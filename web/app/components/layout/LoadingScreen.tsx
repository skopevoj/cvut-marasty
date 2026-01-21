"use client";

import { useData } from "@/app/lib/context/DataContext";

interface LoadingScreenProps {
  message?: string;
}

export function LoadingScreen({}: LoadingScreenProps) {
  const { loadingProgress, loadingMessages } = useData();
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

  return (
    <div className="flex flex-1 flex-col items-center justify-center py-12">
      <div className="w-full max-w-lg px-8">
        {/* Waiting GIF */}
        <div className="relative mb-8 flex items-center justify-center">
          <img
            src={`${basePath}/resource/waiting.gif`}
            alt="Loading"
            className="h-64 w-64 object-contain"
          />
        </div>

        {/* Minimal progress bar */}
        <div className="relative h-1.5 overflow-hidden rounded-full bg-[var(--border-default)]">
          <div
            className="h-full rounded-full bg-[var(--subject-primary)] transition-all duration-500 ease-out"
            style={{
              width: `${loadingProgress}%`,
            }}
          ></div>
        </div>

        {/* Progress percentage */}
        <div className="mt-4 text-center text-sm font-medium text-[var(--fg-muted)]">
          {Math.round(loadingProgress)}%
        </div>

        {/* Loading messages with fade effect */}
        <div className="relative mt-6 h-32 overflow-hidden">
          <div className="space-y-1">
            {loadingMessages.map((msg, index) => (
              <div
                key={index}
                className="text-center text-xs text-[var(--fg-muted)] transition-opacity duration-300"
                style={{
                  opacity: Math.max(0.3, (index + 1) / loadingMessages.length),
                }}
              >
                {msg}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
