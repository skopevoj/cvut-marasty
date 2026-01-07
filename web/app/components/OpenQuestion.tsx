"use client";

import { useMemo } from "react";
import { useQuiz } from "../lib/QuizContext";
import Latex from "./Latex";

export function OpenQuestion() {
    const { currentQuestion, userTextAnswer, setTextAnswer, showResults } = useQuiz();
    if (!currentQuestion) return null;

    const correctAnswers = useMemo(() => {
        return (currentQuestion.answers || [])
            .filter((a: any) => a.isCorrect || a.is_correct)
            .map((a) => (a.text || "").trim());
    }, [currentQuestion]);

    const isCorrect = showResults && correctAnswers.some(c => c === (userTextAnswer || "").trim());

    return (
        <div className={`mt-4 space-y-3 ${showResults ? (isCorrect ? "text-success" : "text-error") : ""}`}>
            <input
                type="text"
                className="w-full rounded-xl border border-border-color bg-white/[0.03] px-5 py-4 text-text-primary outline-none transition-all placeholder:text-text-secondary focus:border-[var(--subject-primary)] focus:bg-white/[0.05] focus:shadow-[0_0_20px_color-mix(in_srgb,var(--subject-primary)_20%,transparent)] disabled:cursor-not-allowed disabled:opacity-70"
                placeholder="Type your answer here..."
                value={userTextAnswer}
                onChange={(e) => setTextAnswer(e.target.value)}
                disabled={showResults}
            />
            {showResults && (
                <div className="flex items-center gap-2 text-sm font-medium">
                    {isCorrect ? (
                        <>
                            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-success/20 text-[10px]">✓</span>
                            <span>Correct</span>
                        </>
                    ) : (
                        <>
                            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-error/20 text-[10px]">✕</span>
                            <span>Correct answer: </span>
                            <Latex tex={correctAnswers[0] ?? ""} />
                        </>
                    )}
                </div>
            )}
        </div>
    );
}

export default OpenQuestion;
