'use client';

import { useQuiz } from "../lib/QuizContext";
import { Check, X } from "lucide-react";

export function QuestionHistory() {
    const { currentQuestionStats, showResults } = useQuiz();

    if (!showResults || !currentQuestionStats || currentQuestionStats.totalAnswered === 0) {
        return null;
    }

    const { totalAnswered, history } = currentQuestionStats;
    const correctCount = history.filter(h => h.isCorrect).length;
    const successRate = Math.round((correctCount / totalAnswered) * 100);

    // Show last 10 attempts in chronological order (most recent on the right)
    const recentHistory = [...history].reverse().slice(-15);

    return (
        <div className="flex items-center justify-between gap-4 px-6 py-2 glass-card-themed rounded-3xl mb-3 text-[10px] md:text-xs font-medium border-b-0">
            <div className="flex items-center gap-1.5 min-w-fit">
                <span className="text-[var(--fg-muted)] uppercase tracking-wider">Úspěšnost</span>
                <span
                    className={successRate >= 50 ? "text-[var(--success)]" : "text-[var(--error)]"}
                >
                    {successRate}%
                </span>
            </div>

            <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide py-0.5">
                {recentHistory.map((attempt, i) => (
                    <div
                        key={attempt.timestamp + i}
                        className={`flex items-center justify-center w-4 h-4 rounded-sm border ${attempt.isCorrect
                            ? "border-[var(--success)]/30 bg-[var(--success)]/10 text-[var(--success)]"
                            : "border-[var(--error)]/30 bg-[var(--error)]/10 text-[var(--error)]"
                            }`}
                    >
                        {attempt.isCorrect ? <Check size={10} /> : <X size={10} />}
                    </div>
                ))}
            </div>

            <div className="flex items-center gap-1.5 min-w-fit text-[var(--fg-muted)] uppercase tracking-wider">
                <span>Pokusy</span>
                <span className="text-[var(--fg-primary)] font-mono">{totalAnswered}x</span>
            </div>
        </div>
    );
}
