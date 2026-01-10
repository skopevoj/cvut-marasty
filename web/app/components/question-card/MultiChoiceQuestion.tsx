"use client";

import { useQuiz } from "../../lib/context/QuizContext";
import { AnswerState } from "../../lib/types/enums";
import Latex from "./../ui/Latex";

export function MultiChoiceQuestion() {
    const { shuffledAnswers, userAnswers, setAnswerState, showResults } = useQuiz();
    if (!shuffledAnswers || shuffledAnswers.length === 0) return null;

    return (
        <div className="flex flex-col gap-3">
            {shuffledAnswers.map((answer, i) => {
                const answerState = userAnswers[i] || AnswerState.NEUTRAL;
                const isCorrect = answer.isCorrect;
                const isUserCorrect = (answerState === AnswerState.CORRECT && isCorrect) ||
                    (answerState === AnswerState.INCORRECT && !isCorrect);

                let statusClass = "bg-text-primary/[0.06] border-text-primary/[0.06]";
                if (showResults) {
                    statusClass = isUserCorrect
                        ? "bg-success/10 border-success/20 border-1"
                        : "bg-error/10 border-error/20 border-1";
                } else if (answerState !== AnswerState.NEUTRAL) {
                    statusClass = "border-text-primary/[0.06] bg-text-primary/[0.06]";
                }

                return (
                    <div key={i} className={`flex items-start md:items-center justify-between gap-2 md:gap-3 rounded-2xl border p-1.5 md:p-2 transition-all duration-300 ${statusClass}`}>
                        <div className="flex shrink-0 items-center bg-text-primary/[0.03] p-0.5 md:p-1 rounded-xl border border-text-primary/5" aria-label="Answer state">
                            <button
                                className={`flex h-7 w-7 md:h-9 md:w-9 cursor-pointer items-center justify-center rounded-lg text-[12px] md:text-[15px] transition-all duration-200 ${answerState === AnswerState.CORRECT
                                    ? "bg-text-primary/10 text-text-primary shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)] translate-y-[1px]"
                                    : "text-text-secondary hover:text-text-primary"}`}
                                onClick={() => setAnswerState(i, answerState === AnswerState.CORRECT ? AnswerState.NEUTRAL : AnswerState.CORRECT)}
                                aria-label="Mark as correct"
                            >
                                ✓
                            </button>
                            <button
                                className={`flex h-7 w-7 md:h-9 md:w-9 cursor-pointer items-center justify-center rounded-lg text-[12px] md:text-[15px] transition-all duration-200 ${answerState === AnswerState.REVEALED || answerState === AnswerState.NEUTRAL
                                    ? "bg-text-primary/10 text-text-primary shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)] translate-y-[1px]"
                                    : "text-text-secondary hover:text-text-primary"}`}
                                onClick={() => setAnswerState(i, answerState === AnswerState.REVEALED ? AnswerState.NEUTRAL : AnswerState.REVEALED)}
                                aria-label="Mark as neutral"
                            >
                                −
                            </button>
                            <button
                                className={`flex h-7 w-7 md:h-9 md:w-9 cursor-pointer items-center justify-center rounded-lg text-[12px] md:text-[15px] transition-all duration-200 ${answerState === AnswerState.INCORRECT
                                    ? "bg-text-primary/10 text-text-primary shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)] translate-y-[1px]"
                                    : "text-text-secondary hover:text-text-primary"}`}
                                onClick={() => setAnswerState(i, answerState === AnswerState.INCORRECT ? AnswerState.NEUTRAL : AnswerState.INCORRECT)}
                                aria-label="Mark as incorrect"
                            >
                                ✕
                            </button>
                        </div>
                        <div className="flex-1 px-1 py-1 md:px-2 md:py-0"><Latex tex={answer.text} /></div>
                    </div>
                );
            })}
        </div>
    );
}

export default MultiChoiceQuestion;

