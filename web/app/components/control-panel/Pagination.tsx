'use client';

import { ChevronLeft, ChevronRight } from "lucide-react";
import { IconButton } from "../IconButton";

interface PaginationProps {
    currentIndex: number;
    total: number;
    onPrev: () => void;
    onNext: () => void;
}

export function Pagination({ currentIndex, total, onPrev, onNext }: PaginationProps) {
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
