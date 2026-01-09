'use client';

import { useEffect } from 'react';
import { ChevronLeft, ChevronRight } from "lucide-react";
import { IconButton } from "../IconButton";

interface PaginationProps {
    currentIndex: number;
    total: number;
    onPrev: () => void;
    onNext: () => void;
}

export function Pagination({ currentIndex, total, onPrev, onNext }: PaginationProps) {
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Check if user is typing in an input, textarea, using a select, or has focus in the header
            const activeElement = document.activeElement;
            const isInputFocused = activeElement?.tagName === 'INPUT' ||
                activeElement?.tagName === 'TEXTAREA' ||
                activeElement?.tagName === 'SELECT' ||
                activeElement?.closest('header') ||
                (activeElement as HTMLElement)?.isContentEditable;

            if (isInputFocused) return;

            if (e.key === 'ArrowLeft') {
                if (currentIndex > 0) onPrev();
            } else if (e.key === 'ArrowRight') {
                if (currentIndex < total - 1) onNext();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [currentIndex, total, onPrev, onNext]);

    return (
        <div className="flex items-center justify-center gap-2 md:gap-3">
            <IconButton
                onClick={onPrev}
                disabled={currentIndex === 0}
                icon={ChevronLeft}
                variant="subject"
                size={20}
            />

            <span className="min-w-[60px] text-center font-medium tabular-nums text-[var(--fg-muted)] text-xs md:text-sm">
                {currentIndex + 1} / {total}
            </span>

            <IconButton
                onClick={onNext}
                disabled={currentIndex === total - 1}
                icon={ChevronRight}
                variant="subject"
                size={20}
            />
        </div>
    );
}
