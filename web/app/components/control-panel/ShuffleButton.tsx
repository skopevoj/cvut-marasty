'use client';

import { Shuffle } from "lucide-react";

interface ShuffleButtonProps {
    onClick: () => void;
    disabled: boolean;
}

export function ShuffleButton({ onClick, disabled }: ShuffleButtonProps) {
    return (
        <button
            onClick={onClick}
            className="rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] p-2 text-[var(--fg-muted)] transition-all duration-200 hover:border-[var(--border-hover)] hover:text-[var(--fg-primary)] active:scale-95 disabled:cursor-not-allowed disabled:opacity-30 md:p-2.5"
            title="Zamíchat otázky"
            disabled={disabled}
        >
            <Shuffle size={18} />
        </button>
    );
}
