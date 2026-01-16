'use client';

import { useEffect, useState } from 'react';
import { UserPlus, UserMinus } from 'lucide-react';

interface Notification {
    id: string;
    type: 'join' | 'leave';
    userId: string;
    timestamp: number;
}

export function PeerNotifications() {
    const [notifications, setNotifications] = useState<Notification[]>([]);

    useEffect(() => {
        const handleUserJoined = (message: any) => {
            const notif: Notification = {
                id: `${message.data.userId}-${Date.now()}`,
                type: 'join',
                userId: message.data.userId.substring(0, 8),
                timestamp: Date.now()
            };

            setNotifications(prev => [...prev, notif]);

            // Auto-remove after 3 seconds
            setTimeout(() => {
                setNotifications(prev => prev.filter(n => n.id !== notif.id));
            }, 3000);
        };

        const handleUserLeft = (message: any) => {
            const notif: Notification = {
                id: `${message.data.userId}-${Date.now()}`,
                type: 'leave',
                userId: message.data.userId.substring(0, 8),
                timestamp: Date.now()
            };

            setNotifications(prev => [...prev, notif]);

            // Auto-remove after 3 seconds
            setTimeout(() => {
                setNotifications(prev => prev.filter(n => n.id !== notif.id));
            }, 3000);
        };

        if ((window as any).__registerPeerMessageHandler) {
            (window as any).__registerPeerMessageHandler('user-joined', handleUserJoined);
            (window as any).__registerPeerMessageHandler('user-left', handleUserLeft);
        }

        return () => {
            if ((window as any).__unregisterPeerMessageHandler) {
                (window as any).__unregisterPeerMessageHandler('user-joined');
                (window as any).__unregisterPeerMessageHandler('user-left');
            }
        };
    }, []);

    if (notifications.length === 0) return null;

    return (
        <div className="fixed top-20 right-4 z-50 space-y-2 pointer-events-none">
            {notifications.map((notif) => (
                <div
                    key={notif.id}
                    className="glass-card-themed px-4 py-2 flex items-center gap-2 animate-in slide-in-from-right fade-in"
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
