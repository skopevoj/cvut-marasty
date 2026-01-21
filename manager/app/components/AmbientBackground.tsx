'use client';

import { useEffect, useState } from 'react';

export function AmbientBackground() {
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            setMousePosition({ x: e.clientX, y: e.clientY });
        };

        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, []);

    return (
        <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
            {/* Base gradient */}
            <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-background-elevated" />

            {/* Animated gradient blobs - only in dark mode */}
            <div className="dark:block hidden">
                {/* Primary blob - top center */}
                <div
                    className="absolute -top-1/4 left-1/2 -translate-x-1/2 w-[900px] h-[1400px] rounded-full opacity-25 blur-[150px]"
                    style={{
                        background: 'radial-gradient(circle, rgba(94,106,210,0.4) 0%, transparent 70%)',
                        animation: 'float 10s ease-in-out infinite',
                    }}
                />

                {/* Secondary blob - left side */}
                <div
                    className="absolute top-1/4 -left-1/4 w-[600px] h-[800px] rounded-full opacity-15 blur-[120px]"
                    style={{
                        background: 'radial-gradient(circle, rgba(139,92,246,0.3) 0%, transparent 70%)',
                        animation: 'float 12s ease-in-out infinite 2s',
                    }}
                />

                {/* Tertiary blob - right side */}
                <div
                    className="absolute top-1/2 -right-1/4 w-[500px] h-[700px] rounded-full opacity-12 blur-[100px]"
                    style={{
                        background: 'radial-gradient(circle, rgba(59,130,246,0.3) 0%, transparent 70%)',
                        animation: 'float 8s ease-in-out infinite 4s',
                    }}
                />

                {/* Bottom accent */}
                <div
                    className="absolute -bottom-1/4 left-1/3 w-[700px] h-[700px] rounded-full opacity-10 blur-[140px]"
                    style={{
                        background: 'radial-gradient(circle, rgba(94,106,210,0.3) 0%, transparent 70%)',
                        animation: 'pulse-glow 6s ease-in-out infinite',
                    }}
                />
            </div>

            {/* Noise texture */}
            <div
                className="absolute inset-0 opacity-[0.015] mix-blend-overlay"
                style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
                }}
            />

            {/* Grid overlay - subtle */}
            <div
                className="absolute inset-0 opacity-[0.02]"
                style={{
                    backgroundImage: `
            linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)
          `,
                    backgroundSize: '64px 64px',
                }}
            />
        </div>
    );
}
