'use client';

import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'ghost' | 'icon';
    children: React.ReactNode;
}

export function Button({ variant = 'primary', children, className = '', ...props }: ButtonProps) {
    const baseClasses = 'cursor-pointer transition-all active:scale-95 disabled:cursor-not-allowed disabled:opacity-30';

    const variants = {
        primary: 'bg-[var(--subject-primary)] text-white px-8 py-3 rounded-xl font-bold shadow-[0_0_30px_color-mix(in_srgb,var(--subject-primary)_30%,transparent)] hover:brightness-110 active:scale-[0.97]',
        secondary: 'bg-[#151518] border border-border-color text-text-primary px-6 py-2 rounded-lg font-medium hover:bg-white/[0.05] hover:border-[var(--subject-primary)]',
        ghost: 'bg-transparent text-text-secondary hover:text-[var(--subject-primary)] px-4 py-2 rounded-lg',
        icon: 'bg-[#151518] border border-border-color text-text-primary w-10 h-10 rounded-lg flex items-center justify-center hover:bg-white/[0.05] hover:border-[var(--subject-primary)] hover:text-[var(--subject-primary)]'
    };

    const variantClass = variants[variant] || variants.primary;

    return (
        <button className={`${baseClasses} ${variantClass} ${className}`} {...props}>
            {children}
        </button>
    );
}
