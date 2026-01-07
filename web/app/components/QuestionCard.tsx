

'use client';


import { useQuiz } from "../lib/QuizContext";
import MultiChoiceQuestion from "./MultiChoiceQuestion";
import OpenQuestion from "./OpenQuestion";
import Latex from "./Latex";
import { Star, Pencil, ImageIcon } from "lucide-react";

export function QuestionCard() {
    const { currentQuestion } = useQuiz();

    if (!currentQuestion) return null;

    return (
        <main className="glass-card-themed relative overflow-hidden rounded-3xl p-4 transition-all duration-300 md:p-8">
            {/* Top Gradient Line */}
            <div
                className="absolute top-0 left-0 right-0 h-px opacity-50"
                style={{
                    background: `linear-gradient(90deg, transparent, var(--subject-primary), transparent)`,
                }}
            />

            {/* Category Badges */}
            <div className="absolute top-4 left-4 z-10 flex flex-wrap items-center gap-1.5">
                <span
                    className="rounded-lg border px-2.5 py-1 text-xs font-medium transition-all duration-200"
                    style={{
                        background: 'var(--subject-bg)',
                        color: 'var(--subject-primary)',
                        border: '1px solid var(--subject-border)',
                    }}
                >
                    {currentQuestion.topic}
                </span>
                <span className="ml-2 font-mono text-[10px] tracking-wider text-[var(--fg-subtle)]">
                    #{currentQuestion.id || 'N/A'}
                </span>
            </div>

            {/* Top Right Buttons */}
            <div className="absolute top-4 right-4 z-10 flex gap-2">
                <button
                    className="rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] p-2 text-[var(--fg-muted)] transition-all duration-200 hover:border-[var(--border-hover)] hover:text-[var(--fg-primary)] active:scale-95"
                    title="Zobrazit obrázek"
                >
                    <ImageIcon size={16} />
                </button>
                <button
                    className="rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] p-2 text-[var(--fg-muted)] transition-all duration-200 hover:border-[var(--border-hover)] hover:text-[var(--fg-primary)] active:scale-95"
                    title="Navrhnout úpravu"
                >
                    <Pencil size={16} />
                </button>
                <button
                    className="rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] p-2 transition-all duration-200 hover:border-[var(--border-hover)] hover:bg-[var(--bg-surface-hover)] active:scale-95"
                >
                    <Star
                        size={20}
                        className="text-[var(--fg-muted)] transition-all duration-300 hover:text-yellow-400"
                    />
                </button>
            </div>

            <div className="pt-10">
                <div className="mb-6 text-[1.2rem] leading-relaxed text-[var(--fg-primary)]">
                    <Latex tex={currentQuestion.question} />
                </div>
                {(() => {
                    const qType = (currentQuestion.questionType || currentQuestion.question_type || 'multichoice').toLowerCase();
                    return qType === 'open' ? <OpenQuestion /> : <MultiChoiceQuestion />;
                })()}
            </div>

        </main>
    );
}
