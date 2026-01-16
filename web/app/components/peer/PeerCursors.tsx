'use client';

import { useEffect, useState, useCallback } from 'react';
import { usePeer } from '../../lib/context/PeerContext';

interface CursorPosition {
    peerId: string;
    // Position relative to reference element (0-1 means inside, can be negative or >1 for outside)
    xPercent: number;
    yPercent: number;
    color: string;
    name: string;
}

const COLORS = [
    '#3b82f6', // blue
    '#ef4444', // red
    '#10b981', // green
    '#f59e0b', // amber
    '#8b5cf6', // violet
    '#ec4899', // pink
];

// Get the question card element as the reference for positioning
function getReferenceElement(): HTMLElement | null {
    // Find the question card - it's the main element with glass-card-themed class
    return document.querySelector('main.glass-card-themed') as HTMLElement;
}

export function PeerCursors() {
    const { isConnected, broadcastMessage } = usePeer();
    const [cursors, setCursors] = useState<Map<string, CursorPosition>>(new Map());
    const [myColor] = useState(() => COLORS[Math.floor(Math.random() * COLORS.length)]);
    const [, forceUpdate] = useState(0);

    // Force re-render on resize/scroll to recalculate positions
    useEffect(() => {
        const handleUpdate = () => forceUpdate(n => n + 1);
        window.addEventListener('resize', handleUpdate);
        window.addEventListener('scroll', handleUpdate);
        return () => {
            window.removeEventListener('resize', handleUpdate);
            window.removeEventListener('scroll', handleUpdate);
        };
    }, []);

    const handleMouseMove = useCallback((e: MouseEvent) => {
        if (!isConnected) return;

        const refElement = getReferenceElement();
        if (!refElement) {
            // Fallback to viewport if no reference element
            broadcastMessage({
                type: 'cursor-move',
                data: {
                    x: e.clientX / window.innerWidth,
                    y: e.clientY / window.innerHeight,
                    color: myColor,
                    hasRef: false
                }
            });
            return;
        }

        const rect = refElement.getBoundingClientRect();

        // Calculate position relative to the reference element
        // This will be 0 at left/top edge, 1 at right/bottom edge
        // Can be negative (left/above) or >1 (right/below)
        const xPercent = (e.clientX - rect.left) / rect.width;
        const yPercent = (e.clientY - rect.top) / rect.height;

        broadcastMessage({
            type: 'cursor-move',
            data: {
                x: xPercent,
                y: yPercent,
                color: myColor,
                hasRef: true
            }
        });
    }, [isConnected, broadcastMessage, myColor]);

    useEffect(() => {
        if (!isConnected) {
            setCursors(new Map());
            return;
        }

        // Throttle cursor updates
        let throttleTimeout: NodeJS.Timeout | null = null;
        const throttledMouseMove = (e: MouseEvent) => {
            if (!throttleTimeout) {
                throttleTimeout = setTimeout(() => {
                    handleMouseMove(e);
                    throttleTimeout = null;
                }, 50); // 20fps
            }
        };

        window.addEventListener('mousemove', throttledMouseMove);

        const handleCursorMove = (message: any) => {
            const { data, senderId } = message;

            setCursors(prev => {
                const next = new Map(prev);
                next.set(senderId, {
                    peerId: senderId,
                    xPercent: data.x,
                    yPercent: data.y,
                    color: data.color,
                    name: senderId.substring(0, 8)
                });
                return next;
            });
        };

        const handleUserLeft = (message: any) => {
            const { data } = message;
            setCursors(prev => {
                const next = new Map(prev);
                next.delete(data.userId);
                return next;
            });
        };

        if ((window as any).__registerPeerMessageHandler) {
            (window as any).__registerPeerMessageHandler('cursor-move', handleCursorMove);
            (window as any).__registerPeerMessageHandler('user-left', handleUserLeft);
        }

        return () => {
            window.removeEventListener('mousemove', throttledMouseMove);
            if (throttleTimeout) clearTimeout(throttleTimeout);

            if ((window as any).__unregisterPeerMessageHandler) {
                (window as any).__unregisterPeerMessageHandler('cursor-move');
                (window as any).__unregisterPeerMessageHandler('user-left');
            }
        };
    }, [isConnected, handleMouseMove]);

    // Calculate pixel position from reference-relative percentages
    const getPixelPosition = useCallback((xPercent: number, yPercent: number) => {
        const refElement = getReferenceElement();
        if (!refElement) {
            // Fallback to viewport center if no reference
            return {
                x: window.innerWidth / 2,
                y: window.innerHeight / 2
            };
        }

        const rect = refElement.getBoundingClientRect();

        // Convert percentages back to pixels relative to local reference element
        return {
            x: rect.left + (xPercent * rect.width),
            y: rect.top + (yPercent * rect.height)
        };
    }, []);

    if (!isConnected) return null;

    return (
        <div className="fixed inset-0 pointer-events-none z-[100]">
            {Array.from(cursors.values()).map((cursor) => {
                const pos = getPixelPosition(cursor.xPercent, cursor.yPercent);
                return (
                    <div
                        key={cursor.peerId}
                        className="absolute transition-all duration-75 ease-out"
                        style={{
                            left: pos.x,
                            top: pos.y,
                            transform: 'translate(-2px, -2px)'
                        }}
                    >
                        {/* Cursor pointer */}
                        <svg
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill="none"
                            style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' }}
                        >
                            <path
                                d="M5.65376 12.3673L8.4819 19.1234C8.83863 20.0232 10.1452 20.0232 10.502 19.1234L13.3301 12.3673L20.0862 9.53916C20.986 9.18243 20.986 7.87588 20.0862 7.51916L13.3301 4.69097C12.9784 4.5498 12.5803 4.5498 12.2286 4.69097L5.47253 7.51916C4.57275 7.87588 4.57275 9.18243 5.47253 9.53916L12.2286 12.3673C12.5803 12.5085 12.9784 12.5085 13.3301 12.3673Z"
                                fill={cursor.color}
                                stroke="white"
                                strokeWidth="1.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                        </svg>

                        {/* Name label */}
                        <div
                            className="absolute top-6 left-2 px-2 py-1 rounded text-xs font-medium text-white whitespace-nowrap"
                            style={{
                                backgroundColor: cursor.color,
                                boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
                            }}
                        >
                            {cursor.name}
                        </div>
                    </div>
                )
            })}
        </div>
    );
}
