'use client';

import { useEffect, useState } from 'react';

interface LoadingScreenProps {
    message?: string;
}

export function LoadingScreen({ message = 'Loading data sources' }: LoadingScreenProps) {
    const [progress, setProgress] = useState(0);
    const [dots, setDots] = useState('');

    // Simulate progress
    useEffect(() => {
        const interval = setInterval(() => {
            setProgress((prev) => {
                if (prev >= 95) return prev;
                const increment = Math.random() * 15;
                return Math.min(prev + increment, 95);
            });
        }, 300);

        return () => clearInterval(interval);
    }, []);

    // Animate dots
    useEffect(() => {
        const interval = setInterval(() => {
            setDots((prev) => (prev.length >= 3 ? '' : prev + '.'));
        }, 400);

        return () => clearInterval(interval);
    }, []);

    return (
        <div className="flex min-h-screen items-center justify-center bg-[var(--bg-color)]">
            <div className="w-full max-w-md px-8">
                {/* Animated circles */}
                <div className="relative mb-12 flex h-20 items-center justify-center">
                    <div className="absolute h-16 w-16 animate-ping rounded-full bg-[var(--subject-primary)] opacity-20"></div>
                    <div className="absolute h-12 w-12 animate-pulse rounded-full bg-[var(--subject-primary)] opacity-40"></div>
                    <div className="relative h-8 w-8 animate-spin rounded-full border-4 border-[var(--subject-primary)]/20 border-t-[var(--subject-primary)]"></div>
                </div>

                {/* Loading text */}
                <div className="mb-6 text-center">
                    <h2 className="text-xl font-semibold text-[var(--fg-primary)]">
                        {message}
                        <span className="inline-block w-8 text-left">{dots}</span>
                    </h2>
                </div>

                {/* Progress bar */}
                <div className="relative h-2 overflow-hidden rounded-full bg-[var(--surface-color)]">
                    <div
                        className="h-full rounded-full bg-gradient-to-r from-[var(--subject-primary)] to-[var(--subject-secondary)] transition-all duration-500 ease-out"
                        style={{
                            width: `${progress}%`,
                            boxShadow: `0 0 20px var(--subject-primary)`,
                        }}
                    >
                        {/* Shimmer effect */}
                        <div className="absolute inset-0 animate-shimmer bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
                    </div>
                </div>

                {/* Progress percentage */}
                <div className="mt-4 text-center text-sm text-[var(--fg-muted)]">
                    {Math.round(progress)}%
                </div>

                {/* Pulsing subtitle */}
                {/* <p className="mt-6 animate-pulse text-center text-sm text-[var(--fg-subtle)]">
                    Please wait while we prepare your content
                </p> */}
            </div>
        </div>
    );
}
