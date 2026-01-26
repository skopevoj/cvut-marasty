import { create } from "zustand";
import type { ConnectedPeer, PeerMessage } from "../types";

// ============================================================================
// Types
// ============================================================================

interface PeerState {
  isConnected: boolean;
  isHost: boolean;
  roomCode: string | null;
  connectedPeers: ConnectedPeer[];
  currentPeerId: string | null;
}

interface PeerActions {
  setConnected: (connected: boolean) => void;
  setHost: (isHost: boolean) => void;
  setRoomCode: (code: string | null) => void;
  setCurrentPeerId: (id: string | null) => void;
  addPeer: (peer: ConnectedPeer) => void;
  removePeer: (peerId: string) => void;
  clearPeers: () => void;
  reset: () => void;
}

// ============================================================================
// Initial State
// ============================================================================

const initialState: PeerState = {
  isConnected: false,
  isHost: false,
  roomCode: null,
  connectedPeers: [],
  currentPeerId: null,
};

// ============================================================================
// Store
// ============================================================================

export const usePeerStore = create<PeerState & PeerActions>((set) => ({
  ...initialState,

  setConnected: (connected) => set({ isConnected: connected }),
  setHost: (isHost) => set({ isHost }),
  setRoomCode: (code) => set({ roomCode: code }),
  setCurrentPeerId: (id) => set({ currentPeerId: id }),

  addPeer: (peer) =>
    set((state) => {
      if (state.connectedPeers.some((p) => p.peerId === peer.peerId)) {
        return state;
      }
      return { connectedPeers: [...state.connectedPeers, peer] };
    }),

  removePeer: (peerId) =>
    set((state) => ({
      connectedPeers: state.connectedPeers.filter((p) => p.peerId !== peerId),
    })),

  clearPeers: () => set({ connectedPeers: [] }),

  reset: () => set(initialState),
}));
