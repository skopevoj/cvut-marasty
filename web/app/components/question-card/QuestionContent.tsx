'use client';

import Latex from "../ui/Latex";

interface QuestionContentProps {
    questionText: string;
    photoUrl: string | null;
}

export function QuestionContent({ questionText, photoUrl }: QuestionContentProps) {
    return (
        <div className="pt-10">
            <div className="mb-6 text-md leading-relaxed text-[var(--fg-primary)]">
                <Latex tex={questionText} />
            </div>

            {photoUrl && (
                <div className="mb-8 overflow-hidden rounded-2xl border border-[var(--border-default)] bg-[var(--fg-primary)]/[0.02]">
                    <img
                        src={typeof photoUrl === 'string' ? photoUrl : ''}
                        alt="Question illustration"
                        className="h-auto w-full object-contain"
                    />
                </div>
            )}
        </div>
    );
}
