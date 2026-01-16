'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode, useRef } from 'react';
import PartySocket from 'partysocket';
import { v4 as uuidv4 } from 'uuid';

interface PeerMessage {
    type: 'answer-update' | 'whiteboard-draw' | 'whiteboard-clear' | 'sync-request' | 'sync-response' | 'user-joined' | 'user-left' | 'navigate' | 'evaluate' | 'cursor-move';
    data: any;
    senderId?: string;
}

interface ConnectedPeer {
    peerId: string;
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

// Use PartyKit dev server for development, deployed URL for production
const PARTYKIT_HOST = process.env.NEXT_PUBLIC_PARTYKIT_HOST || 'localhost:1999';

export function PeerProvider({ children }: { children: ReactNode }) {
    const [isConnected, setIsConnected] = useState(false);
    const [isHost, setIsHost] = useState(false);
    const [roomCode, setRoomCode] = useState<string | null>(null);
    const [connectedPeers, setConnectedPeers] = useState<ConnectedPeer[]>([]);
    const [currentPeerId] = useState<string>(uuidv4());

    const socketRef = useRef<PartySocket | null>(null);
    const messageCallbacksRef = useRef<{ [key: string]: (msg: PeerMessage) => void }>({});

    const createRoom = useCallback(async (): Promise<string> => {
        const code = generateRoomCode();
        console.log('[PartyKit] Creating room with code:', code);

        try {
            const socket = new PartySocket({
                host: PARTYKIT_HOST,
                room: code
            });

            socketRef.current = socket;

            return new Promise((resolve, reject) => {
                const timeout = setTimeout(() => {
                    reject(new Error('Failed to connect to room'));
                }, 10000);

                socket.addEventListener('open', () => {
                    clearTimeout(timeout);
                    console.log('[PartyKit] Connected to room:', code);
                    setRoomCode(code);
                    setIsHost(true);
                    setIsConnected(true);
                    resolve(code);
                });

                socket.addEventListener('message', (event) => {
                    try {
                        const message = JSON.parse(event.data) as PeerMessage;
                        console.log('[PartyKit] Received message:', message.type, 'from:', message.senderId);
                        console.log('[PartyKit] Available handlers:', Object.keys(messageCallbacksRef.current));

                        if (messageCallbacksRef.current[message.type]) {
                            console.log('[PartyKit] Calling handler for:', message.type);
                            messageCallbacksRef.current[message.type](message);
                        } else {
                            console.warn('[PartyKit] No handler registered for message type:', message.type);
                        }

                        // Track peer connections based on user-joined/left messages
                        if (message.type === 'user-joined' && message.senderId) {
                            setConnectedPeers(prev => {
                                if (!prev.some(p => p.peerId === message.senderId)) {
                                    return [...prev, { peerId: message.senderId! }];
                                }
                                return prev;
                            });
                        } else if (message.type === 'user-left' && message.senderId) {
                            setConnectedPeers(prev => prev.filter(p => p.peerId !== message.senderId));
                        }
                    } catch (err) {
                        console.error('[PartyKit] Failed to parse message:', err);
                    }
                });

                socket.addEventListener('error', (err) => {
                    clearTimeout(timeout);
                    console.error('[PartyKit] Socket error:', err);
                    reject(err);
                });

                socket.addEventListener('close', () => {
                    console.log('[PartyKit] Socket closed');
                    setIsConnected(false);
                    setConnectedPeers([]);
                    setRoomCode(null);
                });
            });
        } catch (error) {
            console.error('[PartyKit] Failed to create room:', error);
            throw error;
        }
    }, []);


    const joinRoom = useCallback(async (code: string): Promise<void> => {
        console.log('[PartyKit] Joining room:', code);

        try {
            const socket = new PartySocket({
                host: PARTYKIT_HOST,
                room: code
            });

            socketRef.current = socket;

            return new Promise((resolve, reject) => {
                const timeout = setTimeout(() => {
                    reject(new Error('Failed to connect to room'));
                }, 10000);

                socket.addEventListener('open', () => {
                    clearTimeout(timeout);
                    console.log('[PartyKit] Connected to room:', code);
                    setRoomCode(code.toUpperCase());
                    setIsHost(false);
                    setIsConnected(true);

                    // Send sync request after a short delay
                    setTimeout(() => {
                        socket.send(JSON.stringify({
                            type: 'sync-request',
                            data: {},
                            senderId: currentPeerId
                        }));
                    }, 200);

                    resolve();
                });

                socket.addEventListener('message', (event) => {
                    try {
                        const message = JSON.parse(event.data) as PeerMessage;
                        console.log('[PartyKit] Received message:', message.type, 'from:', message.senderId);
                        console.log('[PartyKit] Available handlers:', Object.keys(messageCallbacksRef.current));

                        if (messageCallbacksRef.current[message.type]) {
                            console.log('[PartyKit] Calling handler for:', message.type);
                            messageCallbacksRef.current[message.type](message);
                        } else {
                            console.warn('[PartyKit] No handler registered for message type:', message.type);
                        }

                        // Track peer connections
                        if (message.type === 'user-joined' && message.senderId) {
                            setConnectedPeers(prev => {
                                if (!prev.some(p => p.peerId === message.senderId)) {
                                    return [...prev, { peerId: message.senderId! }];
                                }
                                return prev;
                            });
                        } else if (message.type === 'user-left' && message.senderId) {
                            setConnectedPeers(prev => prev.filter(p => p.peerId !== message.senderId));
                        }
                    } catch (err) {
                        console.error('[PartyKit] Failed to parse message:', err);
                    }
                });

                socket.addEventListener('error', (err) => {
                    clearTimeout(timeout);
                    console.error('[PartyKit] Socket error:', err);
                    reject(err);
                });

                socket.addEventListener('close', () => {
                    console.log('[PartyKit] Socket closed');
                    setIsConnected(false);
                    setConnectedPeers([]);
                    setRoomCode(null);
                });
            });
        } catch (error) {
            console.error('[PartyKit] Failed to join room:', error);
            throw error;
        }
    }, [currentPeerId]);

    const closeRoom = useCallback(() => {
        console.log('[PartyKit] Closing room');
        if (socketRef.current) {
            socketRef.current.close();
            socketRef.current = null;
        }
        setConnectedPeers([]);
        setRoomCode(null);
        setIsHost(false);
        setIsConnected(false);
    }, []);

    const leaveRoom = useCallback(() => {
        console.log('[PartyKit] Leaving room');
        if (socketRef.current) {
            socketRef.current.close();
            socketRef.current = null;
        }
        setConnectedPeers([]);
        setRoomCode(null);
        setIsConnected(false);
    }, []);

    const broadcastMessage = useCallback((message: PeerMessage) => {
        if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) {
            console.warn('[PartyKit] Cannot broadcast - not connected');
            return;
        }

        const msgWithSender = { ...message, senderId: currentPeerId };
        console.log('[PartyKit] Broadcasting message:', msgWithSender.type);

        try {
            socketRef.current.send(JSON.stringify(msgWithSender));
        } catch (err) {
            console.error('[PartyKit] Failed to send message:', err);
        }
    }, [currentPeerId]);
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
