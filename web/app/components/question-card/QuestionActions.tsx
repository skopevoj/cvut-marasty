'use client';

import { Star, Pencil, ImageIcon } from "lucide-react";

interface QuestionActionsProps {
    hasQuizPhoto: boolean;
    showQuizPhoto: boolean;
    onToggleQuizPhoto: () => void;
}

export function QuestionActions({ hasQuizPhoto, showQuizPhoto, onToggleQuizPhoto }: QuestionActionsProps) {
    return (
        <div className="absolute top-4 right-4 z-10 flex gap-2">
            {hasQuizPhoto && (
                <button
                    onClick={onToggleQuizPhoto}
                    className={`rounded-lg border p-2 transition-all duration-200 active:scale-95 ${showQuizPhoto
                        ? "border-[var(--subject-primary)] bg-[var(--button-bg)] text-[var(--subject-primary)]"
                        : "border-[var(--border-default)] bg-[var(--button-bg)] text-[var(--fg-muted)] hover:border-[var(--border-hover)] hover:text-[var(--fg-primary)]"
                        }`}
                    title="Zobrazit detailní obrázek"
                >
                    <ImageIcon size={16} />
                </button>
            )}
            <button
                className="rounded-lg border border-[var(--border-default)] bg-[var(--button-bg)] p-2 text-[var(--fg-muted)] transition-all duration-200 hover:border-[var(--border-hover)] hover:text-[var(--fg-primary)] active:scale-95"
                title="Navrhnout úpravu"
            >
                <Pencil size={16} />
            </button>
            <button
                className="rounded-lg border border-[var(--border-default)] bg-[var(--button-bg)] p-2 transition-all duration-200 hover:border-[var(--border-hover)] hover:bg-[var(--bg-surface-hover)] active:scale-95"
            >
                <Star
                    size={20}
                    className="text-[var(--fg-muted)] transition-all duration-300 hover:text-yellow-400"
                />
            </button>
        </div>
    );
}
