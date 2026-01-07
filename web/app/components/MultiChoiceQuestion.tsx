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
                const isSelected = answerState > 0;
                const isCorrect = (answer as any).isCorrect || (answer as any).is_correct;

                let statusClass = "bg-white/[0.03] border-white/[0.03]";
                if (showResults) {
                    if (isCorrect) statusClass = "bg-success/10";
                    else if (isSelected) statusClass = "border-error bg-error/10";
                } else if (isSelected) {
                    statusClass = "border-white/[0.06] bg-white/[0.06]";
                }

                return (
                    <div key={i} className={`flex items-center justify-between gap-4 rounded-xl border p-4 transition-all  ${statusClass}`}>
                        {(
                            <div className="flex items-center gap-2" aria-label="Answer state">
                                <button
                                    className={`flex h-10 w-10 cursor-pointer items-center justify-center rounded-lg border border-border-color bg-white/[0.03] text-[16px] font-medium text-text-secondary transition-all hover:border-[#444] hover:bg-white/[0.08] ${answerState === 1 ? "border-text-primary bg-white/[0.15] text-text-primary" : ""}`}
                                    onClick={() => setAnswerState(i, answerState === 1 ? 0 : 1)}
                                    aria-label="Mark as correct"
                                >
                                    ✓
                                </button>
                                <button
                                    className={`flex h-10 w-10 cursor-pointer items-center justify-center rounded-lg border border-border-color bg-white/[0.03] text-[16px] font-medium text-text-secondary transition-all hover:border-[#444] hover:bg-white/[0.08] ${answerState === 2 ? "border-text-primary bg-white/[0.15] text-text-primary" : ""}`}
                                    onClick={() => setAnswerState(i, answerState === 2 ? 0 : 2)}
                                    aria-label="Mark as maybe"
                                >
                                    −
                                </button>
                                <button
                                    className={`flex h-10 w-10 cursor-pointer items-center justify-center rounded-lg border border-border-color bg-white/[0.03] text-[16px] font-medium text-text-secondary transition-all hover:border-[#444] hover:bg-white/[0.08] ${answerState === 3 ? "border-text-primary bg-white/[0.15] text-text-primary" : ""}`}
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
