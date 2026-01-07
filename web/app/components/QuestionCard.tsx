

'use client';

import { useQuiz } from "../lib/QuizContext";
import MultiChoiceQuestion from "./MultiChoiceQuestion";
import OpenQuestion from "./OpenQuestion";
import Latex from "./Latex";

export function QuestionCard() {
    const { currentQuestion } = useQuiz();

    if (!currentQuestion) return null;

    return (
        <main className="relative overflow-hidden rounded-[20px] border border-white/5 bg-surface p-8 shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
            {/* Gradient borders */}
            <div className="absolute top-0 left-0 right-0 h-px bg-linear-to-r from-transparent via-[var(--subject-primary)] to-transparent opacity-50" />
            <div className="absolute bottom-0 left-0 right-0 h-px bg-linear-to-r from-transparent via-[var(--subject-primary)] to-transparent opacity-50" />
            <div className="absolute top-0 bottom-0 left-0 w-px bg-linear-to-b from-transparent via-[var(--subject-primary)] to-transparent opacity-50" />
            <div className="absolute top-0 bottom-0 right-0 w-px bg-linear-to-b from-transparent via-[var(--subject-primary)] to-transparent opacity-50" />

            <div className="mb-5 flex justify-between text-[12px] font-semibold">
                <span className="rounded-full bg-[color-mix(in_srgb,var(--subject-primary)_15%,transparent)] px-3 py-1 text-subject-secondary">{currentQuestion.topic}</span>
                <div className="flex items-center">
                    <span className="mr-3 text-text-secondary">#{currentQuestion.id || 'N/A'}</span>
                </div>
            </div>

            <div className="mb-6 text-[1.2rem] leading-relaxed text-text-primary">
                <Latex tex={currentQuestion.question} />
            </div>
            {(() => {
                const qType = (currentQuestion.questionType || currentQuestion.question_type || 'multichoice').toLowerCase();
                return qType === 'open' ? <OpenQuestion /> : <MultiChoiceQuestion />;
            })()}

        </main>
    );
}
