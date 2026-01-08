'use client';

import { Subject } from "../../lib/types/subject";
import { ChevronDown } from "lucide-react";

interface SubjectSelectorProps {
    subjects: Subject[];
    currentSubject: Subject | null;
    onSelectSubject: (code: string) => void;
}

export function SubjectSelector({ subjects, currentSubject, onSelectSubject }: SubjectSelectorProps) {
    return (
        <div className="relative min-w-0 flex-shrink sm:flex-initial">
            <select
                className="focus-ring h-[44px] w-full max-w-[120px] sm:max-w-none appearance-none rounded-xl border px-3 sm:px-4 pr-8 sm:pr-10 text-[14px] font-medium transition-all duration-200 outline-none"
                value={currentSubject?.code || ''}
                onChange={(e) => onSelectSubject(e.target.value)}
                style={{
                    color: 'var(--fg-primary)',
                    borderColor: 'color-mix(in srgb, var(--subject-primary) 20%, transparent)',
                    background: 'color-mix(in srgb, var(--subject-primary) 2%, rgba(255,255,255,0.03))',
                    backdropFilter: 'blur(10px)'
                }}
            >
                <option value="" style={{ color: 'var(--fg-primary)', background: 'var(--bg-elevated)' }}>
                    Předmět
                </option>
                {subjects?.map(subject => (
                    <option
                        key={subject.id}
                        value={subject.code}
                        style={{ color: 'var(--fg-primary)', background: 'var(--bg-elevated)' }}
                    >
                        {subject.code.toUpperCase()}
                    </option>
                ))}
            </select>
            <ChevronDown
                className="pointer-events-none absolute right-2.5 sm:right-3 top-1/2 h-4 w-4 -translate-y-1/2 opacity-60"
                style={{ color: 'var(--fg-primary)' }}
            />
        </div>
    );
}
