'use client';

import { Question } from "../../lib/types/question";
import Latex from "../ui/Latex";

interface SearchResultsProps {
    results: Question[];
    topicMap: any;
    onQuestionClick: (id: string) => void;
    className?: string;
}

export function SearchResults({ results, topicMap, onQuestionClick, className = "" }: SearchResultsProps) {
    const isDropdown = !className.includes("modal-list");

    if (results.length === 0 && isDropdown) return null;

    return (
        <div
            className={isDropdown
                ? `bg-[var(--bg-elevated)] border border-[var(--border-default)] absolute top-[calc(100%+8px)] z-[100] overflow-hidden rounded-3xl ${className || "left-[-8px] right-[-8px] md:left-[-16px] md:right-[-16px]"}`
                : `w-full ${className}`}
        >
            <div className={`${isDropdown ? "max-h-96" : ""} overflow-y-auto overflow-x-hidden scrollbar-hide rounded-3xl`}>
                {results.length === 0 ? (
                    <div className="p-8 text-center text-[var(--fg-muted)]">
                        <p className="text-sm">Žádné výsledky</p>
                    </div>
                ) : (
                    results.map((question) => (
                        <button
                            key={question.id}
                            className="w-full border-b border-[var(--border-default)] p-4 text-left transition-colors hover:bg-[var(--bg-surface-hover)] last:border-0"
                            onClick={() => onQuestionClick(question.id)}
                        >
                            <div className="mb-1 text-[10px] font-bold uppercase tracking-wider text-[var(--subject-primary)] opacity-70">
                                {question.topics.map((id: string) => topicMap[id] || id).join(' • ')}
                            </div>
                            <Latex tex={question.question} className="line-clamp-2 text-sm text-[var(--fg-primary)]" />
                        </button>
                    ))
                )}
            </div>
        </div>
    );
}
