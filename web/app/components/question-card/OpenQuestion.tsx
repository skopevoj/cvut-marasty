"use client";

import { useMemo } from "react";
import { useQuiz } from "../../lib/QuizContext";
import Latex from "../ui/Latex";

export function OpenQuestion() {
    const { currentQuestion, userTextAnswer, setTextAnswer, showResults } = useQuiz();
    if (!currentQuestion) return null;

    const correctAnswers = useMemo(() => {
        return (currentQuestion.answers || [])
            .filter((a) => a.isCorrect)
            .map((a) => (a.text || "").trim());
    }, [currentQuestion]);

    const isCorrect = showResults && correctAnswers.some(c => c === (userTextAnswer || "").trim());

    return (
        <div className="mt-4 space-y-3">
            <input
                type="text"
                className={`w-full rounded-xl border px-5 py-4 text-text-primary outline-none transition-all placeholder:text-text-secondary disabled:cursor-not-allowed ${showResults
                    ? isCorrect
                        ? "border-success bg-success/5 shadow-[0_0_20px_color-mix(in_srgb,var(--success)_20%,transparent)]"
                        : "border-error bg-error/5 shadow-[0_0_20px_color-mix(in_srgb,var(--error)_20%,transparent)]"
                    : "border-border-color bg-[var(--fg-primary)]/[0.03] focus:border-[var(--subject-primary)] focus:bg-[var(--fg-primary)]/[0.05] focus:shadow-[0_0_20px_color-mix(in_srgb,var(--subject-primary)_20%,transparent)]"
                    }`}
                placeholder="Zde napište odpověď..."
                value={userTextAnswer}
                onChange={(e) => setTextAnswer(e.target.value)}
                disabled={showResults}
            />
            {showResults && (
                <div className={`flex items-center gap-2 text-sm font-medium ${isCorrect ? "text-success" : "text-error"}`}>
                    {isCorrect ? (
                        <>
                            <span className="flex h-3 w-5 items-center justify-center rounded-full bg-success/20 text-[10px]">✓</span>
                            <span>Correct</span>
                        </>
                    ) : (
                        <>
                            {/* <span className="flex h-3 w-5 items-center justify-center rounded-full bg-error/20 text-[10px]">✕</span> */}
                            <span>Správná odpověď: </span>
                            <Latex tex={correctAnswers[0] ?? ""} />
                        </>
                    )}
                </div>
            )}
        </div>
    );
}

export default OpenQuestion;
