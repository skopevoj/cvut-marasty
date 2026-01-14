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
    const variantClasses = {
        default: `glass-icon-button-default ${active ? 'glass-icon-button-active' : ''}`,
        ghost: `glass-icon-button-ghost ${active ? 'glass-icon-button-active' : ''}`,
        subject: `glass-icon-button-default glass-icon-button-subject ${active ? 'glass-icon-button-active' : ''}`,
        frosted: `glass-icon-button-default backdrop-blur-xl ${active ? 'glass-icon-button-active' : ''}`
    };

    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className={`glass-icon-button ${variantClasses[variant]} ${className}`}
            title={title}
        >
            <Icon size={size} />
        </button>
    );
}

export default IconButton;
