'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode, useRef } from 'react';
import Peer, { DataConnection } from 'peerjs';
import { v4 as uuidv4 } from 'uuid';

interface PeerMessage {
    type: 'answer-update' | 'whiteboard-draw' | 'whiteboard-clear' | 'sync-request' | 'sync-response' | 'user-joined' | 'user-left' | 'navigate' | 'evaluate' | 'cursor-move';
    data: any;
    senderId?: string;
}

interface ConnectedPeer {
    peerId: string;
    connection: DataConnection;
    userName?: string;
}

interface PeerContextType {
    isConnected: boolean;
    isHost: boolean;
    roomCode: string | null;
    connectedPeers: ConnectedPeer[];
    currentPeerId: string | null;

    // Host functions
    createRoom: () => Promise<string>;
    closeRoom: () => void;

    // Guest functions
    joinRoom: (code: string) => Promise<void>;
    leaveRoom: () => void;

    // Message sending
    broadcastMessage: (message: PeerMessage) => void;
}

const PeerContext = createContext<PeerContextType | undefined>(undefined);

const ROOM_PREFIX = 'marasty-room-';

export function PeerProvider({ children }: { children: ReactNode }) {
    const [peer, setPeer] = useState<Peer | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [isHost, setIsHost] = useState(false);
    const [roomCode, setRoomCode] = useState<string | null>(null);
    const [connectedPeers, setConnectedPeers] = useState<ConnectedPeer[]>([]);
    const [currentPeerId, setCurrentPeerId] = useState<string | null>(null);
    // Use ref instead of state to avoid stale closures
    const messageCallbacksRef = useRef<{ [key: string]: (msg: PeerMessage) => void }>({});

    // Initialize Peer instance with a random ID or specific ID
    const initPeer = useCallback((id?: string) => {
        if (peer) {
            peer.destroy();
        }

        const peerId = id || uuidv4();
        const newPeer = new Peer(peerId);

        newPeer.on('open', () => {
            console.log('Peer connection opened:', peerId);
            setCurrentPeerId(peerId);
        });

        newPeer.on('error', (err) => {
            console.error('Peer error:', err);
            // If ID is already taken when trying to host, retry with new code
            if (err.type === 'unavailable-id' && id) {
                console.log('ID taken, retrying...');
            }
        });

        // Listen for incoming connections
        newPeer.on('connection', (conn) => {
            console.log('Incoming connection from:', conn.peer);

            conn.on('open', () => {
                setConnectedPeers((prev) => {
                    const exists = prev.some(p => p.peerId === conn.peer);
                    if (!exists) {
                        return [...prev, { peerId: conn.peer, connection: conn }];
                    }
                    return prev;
                });

                // Notify other peers about the new user
                const welcomeMsg: PeerMessage = {
                    type: 'user-joined',
                    data: { userId: conn.peer },
                    senderId: newPeer.id
                };

                // We can't use broadcastMessage here because connectedPeers state isn't updated yet
                conn.send(welcomeMsg);
            });

            conn.on('data', (data: any) => {
                const message = data as PeerMessage;
                console.log('[PeerContext] Received message from incoming conn:', message.type, message);
                if (messageCallbacksRef.current[message.type]) {
                    messageCallbacksRef.current[message.type](message);
                } else {
                    console.warn('[PeerContext] No handler for message type:', message.type);
                }
            });

            conn.on('close', () => {
                setConnectedPeers((prev) => prev.filter((p) => p.peerId !== conn.peer));

                // If we're the guest and the host closed the connection
                if (!isHost && connectedPeers.some(p => p.peerId === conn.peer)) {
                    setIsConnected(false);
                    setRoomCode(null);
                }
            });
        });

        setPeer(newPeer);
        return newPeer;
    }, [peer]);

    useEffect(() => {
        initPeer();
        return () => {
            if (peer) peer.destroy();
        };
    }, []);

    const createRoom = useCallback(async (): Promise<string> => {
        const code = generateRoomCode();
        const hostId = `${ROOM_PREFIX}${code}`;

        initPeer(hostId);

        setRoomCode(code);
        setIsHost(true);
        setIsConnected(true);

        console.log('Room created with code:', code, 'Host Peer ID:', hostId);
        return code;
    }, [initPeer]);

    const joinRoom = useCallback(async (code: string): Promise<void> => {
        if (!peer) throw new Error('Peer not initialized');

        const hostPeerId = `${ROOM_PREFIX}${code.toUpperCase()}`;
        console.log('Joining room:', code, 'Host Peer ID:', hostPeerId);

        const conn = peer.connect(hostPeerId, { reliable: true });

        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                conn.close();
                reject(new Error('Connection timeout - Room not found'));
            }, 10000);

            conn.on('open', () => {
                clearTimeout(timeout);
                console.log('Connected to host:', hostPeerId);
                setConnectedPeers([{ peerId: hostPeerId, connection: conn }]);
                setRoomCode(code.toUpperCase());
                setIsConnected(true);

                conn.send({
                    type: 'sync-request',
                    data: {},
                    senderId: peer.id
                });

                resolve();
            });

            conn.on('data', (data: any) => {
                const message = data as PeerMessage;
                console.log('[PeerContext] Received message from outgoing conn:', message.type, message);
                if (messageCallbacksRef.current[message.type]) {
                    messageCallbacksRef.current[message.type](message);
                } else {
                    console.warn('[PeerContext] No handler for message type:', message.type);
                }
            });

            conn.on('close', () => {
                setIsConnected(false);
                setConnectedPeers([]);
                setRoomCode(null);
            });

            conn.on('error', (err) => {
                clearTimeout(timeout);
                console.error('Connection error:', err);
                reject(err);
            });
        });
    }, [peer]);

    const closeRoom = useCallback(() => {
        if (peer) {
            connectedPeers.forEach((p) => p.connection.close());
            setConnectedPeers([]);
            setRoomCode(null);
            setIsHost(false);
            setIsConnected(false);
            initPeer(); // Revert to random ID
        }
    }, [peer, connectedPeers, initPeer]);

    const leaveRoom = useCallback(() => {
        connectedPeers.forEach((p) => p.connection.close());
        setConnectedPeers([]);
        setRoomCode(null);
        setIsConnected(false);
    }, [connectedPeers]);

    const broadcastMessage = useCallback((message: PeerMessage) => {
        if (!peer) return;
        const msgWithSender = { ...message, senderId: peer.id };
        console.log('[PeerContext] Broadcasting message:', msgWithSender.type, 'to', connectedPeers.length, 'peers');
        connectedPeers.forEach((p) => {
            if (p.connection.open) {
                try {
                    p.connection.send(msgWithSender);
                } catch (err) {
                    console.error('Failed to send message to peer:', err);
                }
            } else {
                console.warn('[PeerContext] Connection not open for peer:', p.peerId);
            }
        });
    }, [peer, connectedPeers]);

    // Hook to register message callbacks
    useEffect(() => {
        const handleMessage = (type: string, callback: (msg: PeerMessage) => void) => {
            console.log('[PeerContext] Registering handler for:', type);
            messageCallbacksRef.current[type] = callback;
        };

        const unregisterMessage = (type: string) => {
            console.log('[PeerContext] Unregistering handler for:', type);
            delete messageCallbacksRef.current[type];
        };

        (window as any).__registerPeerMessageHandler = handleMessage;
        (window as any).__unregisterPeerMessageHandler = unregisterMessage;

        return () => {
            delete (window as any).__registerPeerMessageHandler;
            delete (window as any).__unregisterPeerMessageHandler;
        };
    }, []);

    const value: PeerContextType = {
        isConnected,
        isHost,
        roomCode,
        connectedPeers,
        currentPeerId,
        createRoom,
        closeRoom,
        joinRoom,
        leaveRoom,
        broadcastMessage,
    };

    return <PeerContext.Provider value={value}>{children}</PeerContext.Provider>;
}

export function usePeer() {
    const context = useContext(PeerContext);
    if (context === undefined) {
        throw new Error('usePeer must be used within PeerProvider');
    }
    return context;
}

function generateRoomCode(): string {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
}
