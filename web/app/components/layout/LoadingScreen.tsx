"use client";

import { useEffect, useState } from "react";

interface LoadingScreenProps {
  message?: string;
}

export function LoadingScreen({
  message = "Loading data sources",
}: LoadingScreenProps) {
  const [progress, setProgress] = useState(0);
  const [dots, setDots] = useState("");

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
      setDots((prev) => (prev.length >= 3 ? "" : prev + "."));
    }, 400);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--bg-color)]">
      <div className="w-full max-w-md px-8">
        {/* Glass card container */}
        <div className="glass-card-themed p-8">
          {/* Simple spinner */}
          <div className="relative mb-8 flex h-16 items-center justify-center">
            <div className="relative h-12 w-12 animate-spin rounded-full border-[3px] border-[var(--border-default)] border-t-[var(--subject-primary)]"></div>
          </div>

          {/* Loading text */}
          <div className="mb-6 text-center">
            <h2 className="text-lg font-medium text-[var(--fg-primary)]">
              {message}
              <span className="inline-block w-8 text-left">{dots}</span>
            </h2>
          </div>

          {/* Minimal progress bar */}
          <div className="relative h-1.5 overflow-hidden rounded-full bg-[var(--border-default)]">
            <div
              className="h-full rounded-full bg-[var(--subject-primary)] transition-all duration-500 ease-out"
              style={{
                width: `${progress}%`,
              }}
            ></div>
          </div>

          {/* Progress percentage */}
          <div className="mt-4 text-center text-sm font-medium text-[var(--fg-muted)]">
            {Math.round(progress)}%
          </div>
        </div>
      </div>
    </div>
  );
}
