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
            className="group flex items-center justify-between rounded-3xl border border-[var(--border-default)] bg-[var(--bg-elevated)]/40 backdrop-blur-sm p-5 transition-all hover:border-[var(--border-hover)] hover:bg-[var(--bg-elevated)]/60"
        >
            <div className="flex items-center gap-4">
                <div className={`flex h-14 w-14 items-center justify-center rounded-2xl border transition-all ${
                    isActive 
                        ? 'border-[var(--subject-primary)]/30 bg-[var(--subject-primary)]/15 text-[var(--subject-primary)]' 
                        : 'border-[var(--border-default)] bg-[var(--bg-surface)]/50 text-[var(--fg-muted)]'
                }`}>
                    {icon}
                </div>
                <div className="flex flex-col items-start">
                    <span className="text-base font-semibold text-[var(--fg-primary)]">{label}</span>
                    <span className="text-sm text-[var(--fg-muted)]">{description}</span>
                </div>
            </div>
            <div className={`relative flex h-8 w-14 items-center rounded-full transition-all duration-300 ${
                isActive 
                    ? 'bg-[var(--subject-primary)]' 
                    : 'bg-[var(--bg-surface)]/40'
            }`}
            style={{
                boxShadow: isActive 
                    ? 'inset 0 2px 4px rgba(0, 0, 0, 0.4), 0 0 8px rgba(var(--subject-primary-rgb), 0.3)' 
                    : 'inset 0 2px 4px rgba(0, 0, 0, 0.2), 0 1px 3px rgba(0, 0, 0, 0.1)'
            }}>
                <div className={`absolute h-6 w-6 rounded-full transition-all duration-300 shadow-lg ${
                    isActive 
                        ? 'translate-x-7 bg-white' 
                        : 'translate-x-1 bg-white/90'
                }`}
                style={{
                    boxShadow: isActive
                        ? '0 4px 12px rgba(0, 0, 0, 0.3), inset -1px -1px 2px rgba(0, 0, 0, 0.1)'
                        : '0 2px 6px rgba(0, 0, 0, 0.25), inset -1px -1px 2px rgba(0, 0, 0, 0.05)'
                }} />
            </div>
        </button>
    );
}
