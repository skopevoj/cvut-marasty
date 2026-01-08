'use client';

import { X } from "lucide-react";
import { RefObject } from "react";

interface SearchBarProps {
    searchQuery: string;
    placeholder: string;
    onSearchChange: (value: string) => void;
    onClose: () => void;
    inputRef: RefObject<HTMLInputElement | null>;
}

export function SearchBar({ searchQuery, placeholder, onSearchChange, onClose, inputRef }: SearchBarProps) {
    return (
        <div className="flex flex-1 items-center gap-3">
            <div className="relative flex-1">
                <input
                    ref={inputRef}
                    type="text"
                    className="w-full h-[44px] bg-transparent text-[14px] outline-none placeholder:text-[var(--fg-muted)]"
                    placeholder={placeholder}
                    value={searchQuery}
                    onChange={(e) => onSearchChange(e.target.value)}
                />
            </div>
            <button
                onClick={onClose}
                className="rounded-lg p-2 text-[var(--fg-muted)] hover:text-[var(--fg-primary)]"
            >
                <X size={20} />
            </button>
        </div>
    );
}
