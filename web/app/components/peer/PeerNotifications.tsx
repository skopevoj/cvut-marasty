"use client";

import { useEffect, useState } from "react";
import { UserPlus, UserMinus } from "lucide-react";
import { usePeer } from "../../lib/providers/PeerProvider";
import type { PeerMessage } from "../../lib/types";

interface Notification {
  id: string;
  type: "join" | "leave";
  userId: string;
  timestamp: number;
}

export function PeerNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const { registerMessageHandler, unregisterMessageHandler } = usePeer();

  useEffect(() => {
    const addNotification = (type: "join" | "leave", message: PeerMessage) => {
      const data = message.data as { userId?: string };
      const userId = (data.userId ?? "").substring(0, 8);
      const notif: Notification = {
        id: `${userId}-${Date.now()}`,
        type,
        userId,
        timestamp: Date.now(),
      };
      setNotifications((prev) => [...prev, notif]);
      setTimeout(() => {
        setNotifications((prev) => prev.filter((n) => n.id !== notif.id));
      }, 3000);
    };

    registerMessageHandler("user-joined", (msg) => addNotification("join", msg));
    registerMessageHandler("user-left", (msg) => addNotification("leave", msg));

    return () => {
      unregisterMessageHandler("user-joined");
      unregisterMessageHandler("user-left");
    };
  }, [registerMessageHandler, unregisterMessageHandler]);

    if (notifications.length === 0) return null;

    return (
        <div className="fixed top-20 right-4 z-50 space-y-2 pointer-events-none">
            {notifications.map((notif) => (
                <div
                    key={notif.id}
                    className="card px-4 py-2 flex items-center gap-2"
                >
                    {notif.type === 'join' ? (
                        <>
                            <UserPlus size={16} className="text-green-500" />
                            <span className="text-sm text-[var(--fg-primary)]">
                                Připojen uživatel
                            </span>
                        </>
                    ) : (
                        <>
                            <UserMinus size={16} className="text-red-500" />
                            <span className="text-sm text-[var(--fg-primary)]">
                                Odpojen uživatel
                            </span>
                        </>
                    )}
                </div>
            ))}
        </div>
    );
}
