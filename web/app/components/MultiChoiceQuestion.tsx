"use client";

import { useQuiz } from "../lib/QuizContext";
import Latex from "./Latex";

export function MultiChoiceQuestion() {
    const { currentQuestion, userAnswers, setAnswerState, showResults } = useQuiz();
    if (!currentQuestion) return null;

    return (
        <div className="flex flex-col gap-3">
            {currentQuestion.answers.map((answer, i) => {
                const answerState = userAnswers[i] || 0;
                const isCorrect = !!((answer as any).isCorrect ?? (answer as any).is_correct ?? false);
                const userMarkedCorrect = answerState === 1;
                const isUserCorrect = userMarkedCorrect === isCorrect;

                let statusClass = "bg-white/[0.03] border-white/[0.03]";
                if (showResults) {
                    statusClass = isUserCorrect
                        ? "bg-success/10 border-success/20 border-1"
                        : "bg-error/10 border-error/20 border-1";
                } else if (answerState > 0) {
                    statusClass = "border-white/[0.06] bg-white/[0.06]";
                }

                return (
                    <div key={i} className={`flex items-center justify-between gap-3 rounded-xl border p-4 transition-all  ${statusClass}`}>
                        {(
                            <div className="flex items-center gap-1" aria-label="Answer state">
                                <button
                                    className={`flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-border-color bg-white/[0.03] text-[16px] font-medium text-text-secondary transition-all hover:border-[#444] hover:bg-white/[0.05] ${answerState === 1 ? "border-white/[0.25] bg-white/[0.05] text-text-primary" : ""}`}
                                    onClick={() => setAnswerState(i, answerState === 1 ? 0 : 1)}
                                    aria-label="Mark as correct"
                                >
                                    ✓
                                </button>
                                <button
                                    className={`flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-border-color bg-white/[0.03] text-[16px] font-medium text-text-secondary transition-all hover:border-[#444] hover:bg-white/[0.05] ${answerState === 2 ? "border-white/[0.25] bg-white/[0.05] text-text-primary" : ""}`}
                                    onClick={() => setAnswerState(i, answerState === 2 ? 0 : 2)}
                                    aria-label="Mark as maybe"
                                >
                                    −
                                </button>
                                <button
                                    className={`flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-border-color bg-white/[0.03] text-[16px] font-medium text-text-secondary transition-all hover:border-[#444] hover:bg-white/[0.05] ${answerState === 3 ? "border-white/[0.25] bg-white/[0.05] text-text-primary" : ""}`}
                                    onClick={() => setAnswerState(i, answerState === 3 ? 0 : 3)}
                                    aria-label="Mark as incorrect"
                                >
                                    ✕
                                </button>
                            </div>
                        )}
                        <div className="flex-1"><Latex tex={(answer as any).text} /></div>
                    </div>
                );
            })}
        </div>
    );
}

export default MultiChoiceQuestion;
