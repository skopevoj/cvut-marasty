'use client';

import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'ghost' | 'icon';
    children: React.ReactNode;
}

export function Button({ variant = 'primary', children, className = '', ...props }: ButtonProps) {
    let baseClass = 'btn-base';
    if (variant === 'primary') baseClass = 'evaluate-btn';
    if (variant === 'secondary') baseClass = 'nav-btn-large';
    if (variant === 'icon') baseClass = 'nav-btn';

    return (
        <button className={`${baseClass} ${className}`} {...props}>
            {children}
        </button>
    );
}
