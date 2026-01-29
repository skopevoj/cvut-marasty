"use client";

import { RoomManager } from "./RoomManager";

export function SyncTab() {
  return (
    <div className="animate-in fade-in slide-in-from-right-2 md:slide-in-from-right-4 duration-300">
      <h2 className="text-xl md:text-2xl font-bold mb-4 md:mb-6 text-[var(--fg-primary)]">
        Synchronizace
      </h2>
      <RoomManager />
    </div>
  );
}
