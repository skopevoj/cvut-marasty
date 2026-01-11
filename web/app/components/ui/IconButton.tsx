'use client';

import { LucideIcon } from "lucide-react";

interface IconButtonProps {
    icon: LucideIcon;
    onClick?: () => void;
    title?: string;
    className?: string;
    disabled?: boolean;
    active?: boolean;
    variant?: 'default' | 'ghost' | 'subject' | 'frosted';
    size?: number;
}

export function IconButton({
    icon: Icon,
    onClick,
    title,
    className = "",
    disabled = false,
    active = false,
    variant = 'default',
    size = 18
}: IconButtonProps) {
    const variants = {
        default: active
            ? "border-[var(--subject-primary)] bg-[var(--button-bg)] text-[var(--subject-primary)]"
            : "border-[var(--border-default)] bg-[var(--button-bg)] text-[var(--fg-muted)] hover:border-[var(--border-hover)] hover:text-[var(--fg-primary)]",
        ghost: "border-transparent bg-transparent text-[var(--fg-muted)] hover:text-[var(--fg-primary)]",
        subject: "border-[var(--border-default)] bg-[var(--button-bg)] text-[var(--fg-muted)] hover:border-[var(--subject-border)] hover:bg-[var(--subject-bg)] hover:text-[var(--subject-primary)]",
        frosted: "border-white/10 bg-white/5 backdrop-blur-md text-[var(--fg-muted)] hover:bg-white/10 hover:text-[var(--fg-primary)]"
    };

    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className={`rounded-lg border p-2 transition-all duration-200 active:scale-95 disabled:cursor-not-allowed disabled:opacity-30 md:p-2.5 ${variants[variant]} ${className}`}
            title={title}
        >
            <Icon size={size} />
        </button>
    );
}

export default IconButton;
