'use client';

import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
    currentIndex: number;
    total: number;
    onPrev: () => void;
    onNext: () => void;
}

export function Pagination({ currentIndex, total, onPrev, onNext }: PaginationProps) {
    return (
        <div className="flex items-center justify-center gap-2 md:gap-3">
            <button
                onClick={onPrev}
                disabled={currentIndex === 0}
                className="rounded-lg border border-[var(--border-default)] bg-[var(--button-bg)] p-2 text-[var(--fg-muted)] transition-all duration-200 hover:border-[var(--subject-border)] hover:bg-[var(--subject-bg)] hover:text-[var(--subject-primary)] active:scale-95 disabled:cursor-not-allowed disabled:opacity-30 md:p-2.5"
            >
                <ChevronLeft size={20} />
            </button>

            <span className="min-w-[60px] text-center font-medium tabular-nums text-[var(--fg-muted)] text-xs md:text-sm">
                {currentIndex + 1} / {total}
            </span>

            <button
                onClick={onNext}
                disabled={currentIndex === total - 1}
                className="rounded-lg border border-[var(--border-default)] bg-[var(--button-bg)] p-2 text-[var(--fg-muted)] transition-all duration-200 hover:border-[var(--subject-border)] hover:bg-[var(--subject-bg)] hover:text-[var(--subject-primary)] active:scale-95 disabled:cursor-not-allowed disabled:opacity-30 md:p-2.5"
            >
                <ChevronRight size={20} />
            </button>
        </div>
    );
}
