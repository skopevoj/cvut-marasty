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
                const isCorrect = answer.isCorrect;
                const isUserCorrect = (answerState === 1 && isCorrect) || (answerState === 3 && !isCorrect);

                let statusClass = "bg-white/[0.03] border-white/[0.03]";
                if (showResults) {
                    statusClass = isUserCorrect
                        ? "bg-success/10 border-success/20 border-1"
                        : "bg-error/10 border-error/20 border-1";
                } else if (answerState > 0) {
                    statusClass = "border-white/[0.06] bg-white/[0.06]";
                }

                return (
                    <div key={i} className={`flex items-center justify-between gap-3 rounded-2xl border p-2 transition-all duration-300 ${statusClass}`}>
                        <div className="flex items-center bg-white/[0.03] p-1 rounded-xl border border-white/5" aria-label="Answer state">
                            <button
                                className={`flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg text-[15px] transition-all duration-200 ${answerState === 1
                                    ? "bg-white/10 text-white shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)] translate-y-[1px]"
                                    : "text-white/30 hover:text-white/60"}`}
                                onClick={() => setAnswerState(i, answerState === 1 ? 0 : 1)}
                                aria-label="Mark as correct"
                            >
                                ✓
                            </button>
                            <button
                                className={`flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg text-[15px] transition-all duration-200 ${answerState === 2 || answerState === 0
                                    ? "bg-white/10 text-white shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)] translate-y-[1px]"
                                    : "text-white/30 hover:text-white/60"}`}
                                onClick={() => setAnswerState(i, answerState === 2 ? 0 : 2)}
                                aria-label="Mark as neutral"
                            >
                                −
                            </button>
                            <button
                                className={`flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg text-[15px] transition-all duration-200 ${answerState === 3
                                    ? "bg-white/10 text-white shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)] translate-y-[1px]"
                                    : "text-white/30 hover:text-white/60"}`}
                                onClick={() => setAnswerState(i, answerState === 3 ? 0 : 3)}
                                aria-label="Mark as incorrect"
                            >
                                ✕
                            </button>
                        </div>
                        <div className="flex-1 px-2"><Latex tex={answer.text} /></div>
                    </div>
                );
            })}
        </div>
    );
}

export default MultiChoiceQuestion;
