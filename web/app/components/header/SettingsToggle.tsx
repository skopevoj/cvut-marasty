'use client';

import { ReactNode } from "react";

interface SettingsToggleProps {
    label: string;
    description: string;
    icon: ReactNode;
    isActive: boolean;
    onClick: () => void;
}

export function SettingsToggle({
    label,
    description,
    icon,
    isActive,
    onClick
}: SettingsToggleProps) {
    return (
        <button
            onClick={onClick}
            className="group flex items-center justify-between rounded-2xl border border-[var(--border-default)] bg-[var(--fg-muted)]/[0.03] p-4 transition-all hover:border-[var(--border-hover)] hover:bg-[var(--fg-muted)]/[0.06]"
        >
            <div className="flex items-center gap-4">
                <div className={`flex h-12 w-12 items-center justify-center rounded-xl border transition-colors ${
                    isActive 
                        ? 'border-[var(--subject-primary)]/30 bg-[var(--subject-primary)]/10 text-[var(--subject-primary)]' 
                        : 'border-[var(--fg-primary)]/5 bg-[var(--fg-primary)]/5 text-[var(--fg-muted)]'
                }`}>
                    {icon}
                </div>
                <div className="flex flex-col items-start">
                    <span className="text-base font-semibold text-[var(--fg-primary)]">{label}</span>
                    <span className="text-sm text-[var(--fg-muted)]">{description}</span>
                </div>
            </div>
            <div className={`flex h-6 w-11 items-center rounded-full px-1 transition-all duration-300 ${
                isActive 
                    ? 'bg-[var(--subject-primary)]' 
                    : 'bg-[var(--fg-primary)]/10'
            }`}>
                <div className={`h-4 w-4 rounded-full bg-white transition-all duration-300 ${
                    isActive 
                        ? 'translate-x-5' 
                        : 'translate-x-0'
                }`} />
            </div>
        </button>
    );
}
