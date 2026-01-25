"use client";

import { usePeer } from "../../lib/context/PeerContext";
import { Users, LogOut, Plus, Copy, Check } from "lucide-react";
import { useState, useRef } from "react";

export function RoomManager() {
  const {
    isConnected,
    isHost,
    roomCode,
    connectedPeers,
    createRoom,
    closeRoom,
    joinRoom,
    leaveRoom,
  } = usePeer();
  const [joinCode, setJoinCode] = useState("");
  const [isJoining, setIsJoining] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleCreateRoom = async () => {
    try {
      setError(null);
      await createRoom();
    } catch (err) {
      setError("Nelze vytvořit místnost");
      console.error(err);
    }
  };

  const handleJoinRoom = async () => {
    if (!joinCode.trim()) {
      setError("Zadejte kód místnosti");
      return;
    }
    try {
      setError(null);
      setIsJoining(true);
      await joinRoom(joinCode.trim().toUpperCase());
      setJoinCode("");
    } catch (err) {
      setError("Nelze se připojit. Zkontrolujte kód místnosti.");
      console.error(err);
    } finally {
      setIsJoining(false);
    }
  };

  const handleCloseRoom = () => {
    closeRoom();
  };

  const handleLeaveRoom = () => {
    leaveRoom();
  };

  const copyRoomCode = () => {
    if (roomCode) {
      navigator.clipboard.writeText(roomCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleJoinRoom();
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm font-semibold text-[var(--fg-primary)]">
        <Users size={18} />
        Spolupráce (PartyKit)
      </div>

      {/* Disclaimer */}
      <div className="p-3 rounded-2xl bg-blue-500/10 border border-blue-500/30 text-xs text-blue-600 leading-relaxed">
        Používáme PartyKit (WebSocket) pro real-time synchronizaci. Tahle skvělá
        feature občas funguje a občas ne, je to jen free tier PartyKitu. Pokud
        bude aplikace používaná, přejdu ze static site na full nextjs apku s
        vlastním socket io serverem.
      </div>

      {!isConnected ? (
        <div className="space-y-3 p-4 rounded-3xl bg-[var(--bg-elevated)]/50 backdrop-blur-sm border border-[var(--border-default)]">
          <div className="flex gap-2">
            <button
              onClick={handleCreateRoom}
              className="flex-1 px-4 py-2 bg-[var(--subject-primary)] text-white rounded-2xl text-sm font-semibold hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
            >
              <Plus size={16} />
              Vytvořit místnost
            </button>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center pointer-events-none">
              <div className="w-full h-px bg-gradient-to-r from-transparent via-[var(--border-default)] to-transparent"></div>
            </div>
            <div className="relative flex justify-center">
              <span className="px-2 bg-[var(--bg-elevated)]/50 text-xs text-[var(--fg-muted)]">
                nebo
              </span>
            </div>
          </div>

          <div className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={joinCode}
              onChange={(e) => {
                setJoinCode(e.target.value.toUpperCase());
                setError(null);
              }}
              onKeyPress={handleKeyPress}
              placeholder="Zadejte kód..."
              className="flex-1 rounded-2xl border border-[var(--border-default)] bg-[var(--bg-surface)]/50 px-4 py-2 text-sm text-[var(--fg-primary)] placeholder-[var(--fg-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--subject-primary)] transition-colors backdrop-blur-sm"
            />
            <button
              onClick={handleJoinRoom}
              disabled={isJoining}
              className="px-4 py-2 bg-[var(--subject-primary)] text-white rounded-2xl text-sm font-semibold hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              {isJoining ? "..." : "Připojit"}
            </button>
          </div>

          {error && (
            <div className="p-3 rounded-2xl bg-red-500/10 border border-red-500/30 text-xs text-red-600">
              {error}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-3 p-4 rounded-3xl bg-[var(--bg-elevated)]/50 backdrop-blur-sm border border-[var(--subject-primary)]/30">
          {/* Room Status */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-[var(--fg-primary)]">
                {isHost ? "Hostitel" : "Připojeno"}
              </span>
            </div>
            <span className="text-xs text-[var(--fg-muted)]">
              {connectedPeers.length}{" "}
              {connectedPeers.length === 1 ? "osoba" : "osoby"}
            </span>
          </div>

          {/* Room Code Display */}
          <div className="flex items-center gap-2 p-3 rounded-2xl bg-[var(--bg-surface)]/50 border border-[var(--border-default)]">
            <span className="text-xs text-[var(--fg-muted)]">Kód:</span>
            <code className="flex-1 text-sm font-mono font-bold text-[var(--subject-primary)]">
              {roomCode}
            </code>
            <button
              onClick={copyRoomCode}
              className="p-1.5 hover:bg-[var(--bg-surface)] rounded-lg transition-colors"
              title="Kopírovat kód"
            >
              {copied ? (
                <Check size={16} className="text-green-500" />
              ) : (
                <Copy size={16} className="text-[var(--fg-muted)]" />
              )}
            </button>
          </div>

          {/* Connected Peers */}
          {connectedPeers.length > 0 && (
            <div className="space-y-2">
              <div className="text-xs font-semibold text-[var(--fg-muted)]">
                Připojení uživatelé:
              </div>
              <div className="space-y-1 max-h-[100px] overflow-y-auto">
                {connectedPeers.map((peer) => (
                  <div
                    key={peer.peerId}
                    className="text-xs px-2 py-1 rounded-lg bg-[var(--bg-surface)]/50 text-[var(--fg-muted)] truncate"
                  >
                    {peer.userName || `Peer ${peer.peerId.substring(0, 8)}`}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Disconnect Button */}
          <button
            onClick={isHost ? handleCloseRoom : handleLeaveRoom}
            className="w-full px-4 py-2 bg-red-500/10 text-red-600 rounded-2xl text-sm font-semibold hover:bg-red-500/20 transition-colors flex items-center justify-center gap-2"
          >
            <LogOut size={16} />
            {isHost ? "Uzavřít místnost" : "Opustit místnost"}
          </button>
        </div>
      )}
    </div>
  );
}
