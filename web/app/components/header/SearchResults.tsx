'use client';

import { Question } from "../../lib/types/question";
import Latex from "../Latex";

interface SearchResultsProps {
    results: Question[];
    topicMap: any;
    onQuestionClick: (id: string) => void;
}

export function SearchResults({ results, topicMap, onQuestionClick }: SearchResultsProps) {
    if (results.length === 0) return null;

    return (
        <div
            className="absolute top-[54px] left-[-12px] right-[-12px] rounded-3xl border shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-[100]"
            style={{
                borderColor: 'rgba(255, 255, 255, 0.1)',
                backgroundColor: 'rgba(10, 10, 12, 0.85)',
                backdropFilter: 'saturate(180%) blur(20px)',
                WebkitBackdropFilter: 'saturate(180%) blur(20px)',
            }}
        >
            <div className="max-h-[400px] overflow-y-auto overflow-x-hidden scrollbar-hide rounded-3xl">
                {results.map((question) => (
                    <button
                        key={question.id}
                        className="w-full border-b border-[var(--border-default)] p-4 text-left transition-colors hover:bg-white/[0.05] last:border-0"
                        onClick={() => question.id && onQuestionClick(question.id)}
                    >
                        <div className="mb-1 text-[10px] font-bold uppercase tracking-wider text-[var(--subject-primary)] opacity-70">
                            {(question.topics || (question.topic ? [question.topic] : [])).map((id: string) => topicMap[id] || id).join(' • ')}
                        </div>
                        <Latex tex={question.question} className="line-clamp-2 text-sm text-[var(--fg-primary)]" />
                    </button>
                ))}
            </div>
        </div>
    );
}
