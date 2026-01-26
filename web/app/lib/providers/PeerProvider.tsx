"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
  useRef,
} from "react";
import PartySocket from "partysocket";
import { v4 as uuidv4 } from "uuid";
import type { PeerMessage, ConnectedPeer } from "../types";
import { usePeerStore } from "../stores/peerStore";

// ============================================================================
// Constants
// ============================================================================

const PARTYKIT_HOST = process.env.NEXT_PUBLIC_PARTYKIT_HOST || "localhost:1999";
const CONNECTION_TIMEOUT = 10000;

// ============================================================================
// Context Type (for socket ref and broadcast function)
// ============================================================================

interface PeerContextType {
  broadcastMessage: (message: PeerMessage) => void;
  createRoom: () => Promise<string>;
  closeRoom: () => void;
  joinRoom: (code: string) => Promise<void>;
  leaveRoom: () => void;
}

const PeerContext = createContext<PeerContextType | undefined>(undefined);

// ============================================================================
// Provider
// ============================================================================

export function PeerProvider({ children }: { children: ReactNode }) {
  const store = usePeerStore();
  const [currentPeerId] = useState<string>(uuidv4());
  const socketRef = useRef<PartySocket | null>(null);
  const messageCallbacksRef = useRef<
    Record<string, (msg: PeerMessage) => void>
  >({});

  // Sync peerId to store
  useEffect(() => {
    store.setCurrentPeerId(currentPeerId);
  }, [currentPeerId]);

  const handleMessage = useCallback((event: MessageEvent) => {
    try {
      const message = JSON.parse(event.data) as PeerMessage;
      const handler = messageCallbacksRef.current[message.type];
      if (handler) handler(message);

      if (message.type === "user-joined" && message.senderId) {
        store.addPeer({ peerId: message.senderId });
      } else if (message.type === "user-left" && message.senderId) {
        store.removePeer(message.senderId);
      }
    } catch (err) {
      console.error("[PartyKit] Failed to parse message:", err);
    }
  }, []);

  const handleClose = useCallback(() => {
    store.setConnected(false);
    store.clearPeers();
    store.setRoomCode(null);
  }, []);

  const createRoom = useCallback(async (): Promise<string> => {
    const code = generateRoomCode();
    const socket = new PartySocket({ host: PARTYKIT_HOST, room: code });
    socketRef.current = socket;

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(
        () => reject(new Error("Connection timeout")),
        CONNECTION_TIMEOUT,
      );

      socket.addEventListener("open", () => {
        clearTimeout(timeout);
        store.setRoomCode(code);
        store.setHost(true);
        store.setConnected(true);
        resolve(code);
      });

      socket.addEventListener("message", handleMessage);
      socket.addEventListener("error", () => {
        clearTimeout(timeout);
        reject(new Error("Connection failed"));
      });
      socket.addEventListener("close", handleClose);
    });
  }, [handleMessage, handleClose]);

  const joinRoom = useCallback(
    async (code: string): Promise<void> => {
      const socket = new PartySocket({ host: PARTYKIT_HOST, room: code });
      socketRef.current = socket;

      return new Promise((resolve, reject) => {
        const timeout = setTimeout(
          () => reject(new Error("Connection timeout")),
          CONNECTION_TIMEOUT,
        );

        socket.addEventListener("open", () => {
          clearTimeout(timeout);
          store.setRoomCode(code);
          store.setHost(false);
          store.setConnected(true);

          socket.send(
            JSON.stringify({
              type: "user-joined",
              senderId: currentPeerId,
              data: {},
            }),
          );
          resolve();
        });

        socket.addEventListener("message", handleMessage);
        socket.addEventListener("error", () => {
          clearTimeout(timeout);
          reject(new Error("Connection failed"));
        });
        socket.addEventListener("close", handleClose);
      });
    },
    [currentPeerId, handleMessage, handleClose],
  );

  const closeRoom = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.close();
      socketRef.current = null;
    }
    store.reset();
  }, []);

  const leaveRoom = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.close();
      socketRef.current = null;
    }
    store.reset();
  }, []);

  const broadcastMessage = useCallback(
    (message: PeerMessage) => {
      if (
        !socketRef.current ||
        socketRef.current.readyState !== WebSocket.OPEN
      ) {
        return;
      }

      const msgWithSender = { ...message, senderId: currentPeerId };
      try {
        socketRef.current.send(JSON.stringify(msgWithSender));
      } catch (err) {
        console.error("[PartyKit] Failed to send message:", err);
      }
    },
    [currentPeerId],
  );

  // Register global message handlers
  useEffect(() => {
    const win = window as any;
    win.__registerPeerMessageHandler = (
      type: string,
      callback: (msg: PeerMessage) => void,
    ) => {
      messageCallbacksRef.current[type] = callback;
    };
    win.__unregisterPeerMessageHandler = (type: string) => {
      delete messageCallbacksRef.current[type];
    };
    return () => {
      delete win.__registerPeerMessageHandler;
      delete win.__unregisterPeerMessageHandler;
    };
  }, []);

  const value: PeerContextType = {
    broadcastMessage,
    createRoom,
    closeRoom,
    joinRoom,
    leaveRoom,
  };

  return <PeerContext.Provider value={value}>{children}</PeerContext.Provider>;
}

// ============================================================================
// Hook
// ============================================================================

export function usePeer() {
  const context = useContext(PeerContext);
  const store = usePeerStore();

  if (!context) {
    throw new Error("usePeer must be used within PeerProvider");
  }

  return {
    ...store,
    ...context,
  };
}

// ============================================================================
// Helpers
// ============================================================================

function generateRoomCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}
