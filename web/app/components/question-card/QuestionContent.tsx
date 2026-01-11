'use client';

import { useMemo } from 'react';
import Latex from "../ui/Latex";

interface QuestionContentProps {
    questionText: string;
    photoUrl: string | null;
}

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || '';

export function QuestionContent({ questionText, photoUrl }: QuestionContentProps) {
    const fullPhotoUrl = useMemo(() => {
        if (!photoUrl) return null;
        if (photoUrl.startsWith('http') || photoUrl.startsWith('data:')) return photoUrl;
        return `${BASE_PATH}/${photoUrl.startsWith('/') ? photoUrl.slice(1) : photoUrl}`;
    }, [photoUrl]);

    return (
        <div className="pt-10">
            <div className="mb-6 text-md leading-relaxed text-[var(--fg-primary)]">
                <Latex tex={questionText} />
            </div>

            {fullPhotoUrl && (
                <div className="mb-8 overflow-hidden rounded-2xl border border-[var(--border-default)] bg-[var(--fg-primary)]/[0.02]">
                    <img
                        src={fullPhotoUrl}
                        alt="Question illustration"
                        className="h-auto w-full object-contain"
                    />
                </div>
            )}
        </div>
    );
}
