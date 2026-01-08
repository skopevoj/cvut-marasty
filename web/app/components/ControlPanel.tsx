'use client';

import { useQuiz } from "../lib/QuizContext";
import { Shuffle, ChevronLeft, ChevronRight } from "lucide-react";

export function ControlPanel() {
    const { currentQuestionIndex, quizQueue, nextQuestion, prevQuestion, currentSubject, evaluate, showResults, shuffleQueue } = useQuiz();

    if (!currentSubject || quizQueue.length === 0) return null;

    return (
        <footer className="glass-card-themed rounded-3xl p-2.5 transition-all duration-300 md:p-4">
            <div className="flex items-center justify-between gap-2 md:gap-3">
                {/* Left side - Utility buttons */}
                <div className="flex items-center gap-1.5 md:gap-2">
                    <button
                        onClick={shuffleQueue}
                        className="rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] p-2 text-[var(--fg-muted)] transition-all duration-200 hover:border-[var(--border-hover)] hover:text-[var(--fg-primary)] active:scale-95 disabled:cursor-not-allowed disabled:opacity-30 md:p-2.5"
                        title="Zamíchat otázky"
                        disabled={quizQueue.length <= 1}
                    >
                        <Shuffle size={18} />
                    </button>
                </div>

                {/* Center - Navigation */}
                <div className="flex items-center justify-center gap-2 md:gap-3">
                    <button
                        onClick={prevQuestion}
                        disabled={currentQuestionIndex === 0}
                        className="rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] p-2 text-[var(--fg-muted)] transition-all duration-200 hover:border-[var(--subject-border)] hover:bg-[var(--subject-bg)] hover:text-[var(--subject-primary)] active:scale-95 disabled:cursor-not-allowed disabled:opacity-30 md:p-2.5"
                    >
                        <ChevronLeft size={20} />
                    </button>

                    <span className="min-w-[60px] text-center font-medium tabular-nums text-[var(--fg-muted)] text-xs md:text-sm">
                        {currentQuestionIndex + 1} / {quizQueue.length}
                    </span>

                    <button
                        onClick={nextQuestion}
                        disabled={currentQuestionIndex === quizQueue.length - 1}
                        className="rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] p-2 text-[var(--fg-muted)] transition-all duration-200 hover:border-[var(--subject-border)] hover:bg-[var(--subject-bg)] hover:text-[var(--subject-primary)] active:scale-95 disabled:cursor-not-allowed disabled:opacity-30 md:p-2.5"
                    >
                        <ChevronRight size={20} />
                    </button>
                </div>

                {/* Right side - Evaluate button */}
                <button
                    onClick={showResults ? nextQuestion : evaluate}
                    disabled={showResults && currentQuestionIndex === quizQueue.length - 1}
                    className="whitespace-nowrap rounded-xl px-4 py-2 text-xs font-semibold text-white transition-all duration-200 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 md:px-6 md:py-2.5 md:text-sm"
                    style={{
                        background: 'var(--subject-primary)',
                        boxShadow: `
                            0 0 0 1px color-mix(in srgb, var(--subject-primary) 50%, transparent),
                            0 4px 12px color-mix(in srgb, var(--subject-primary) 25%, transparent),
                            inset 0 1px 0 0 rgba(255, 255, 255, 0.15)
                        `,
                    }}
                >
                    {showResults ? 'Další otázka' : 'Vyhodnotit'}
                </button>
            </div>
        </footer>
    );
}
