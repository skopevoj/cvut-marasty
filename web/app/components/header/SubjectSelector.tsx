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
        <div className="relative min-w-0 flex-shrink sm:flex-initial group">
            <select
                className="glass-dropdown focus-ring w-full max-w-[120px] sm:max-w-none appearance-none pr-8 sm:pr-10 shadow-sm"
                value={currentSubject?.code || ''}
                onChange={(e) => onSelectSubject(e.target.value)}
                style={{
                    color: 'var(--fg-primary)',
                }}
            >
                <option value="" style={{ color: 'var(--fg-primary)', background: 'var(--bg-elevated)' }}>
                    Předmět
                </option>
                {subjects?.map(subject => (
                    <option
                        key={subject.code || subject.id}
                        value={subject.code || ''}
                        style={{ color: 'var(--fg-primary)', background: 'var(--bg-elevated)' }}
                    >
                        {(subject.code || 'N/A').toUpperCase()}
                    </option>
                ))}
            </select>
            <ChevronDown
                className="pointer-events-none absolute right-2.5 sm:right-3 top-1/2 h-4 w-4 -translate-y-1/2 opacity-50 transition-opacity group-hover:opacity-80"
                style={{ color: 'var(--fg-primary)' }}
            />
        </div>
    );
}
