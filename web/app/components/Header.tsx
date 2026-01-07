'use client';

import { useQuiz } from "../lib/QuizContext";
import { MultiSelect } from "./MultiSelect";
import { Search, Star, ChevronDown, User, Trophy } from "lucide-react";

export function Header() {
    const { subjects, currentSubject, selectSubject, toggleTopic, selectedTopics, questions } = useQuiz();

    const availableTopics = Array.from(new Set(
        questions
            .filter(q => q.subjectCode === currentSubject?.code)
            .map(q => q.topic)
    ));

    return (
        <header className="glass-card-themed relative z-50 rounded-3xl p-3 px-3 transition-all duration-300 md:p-4">
            <div
                className="absolute bottom-0 left-0 right-0 h-px opacity-50"
                style={{
                    background: `linear-gradient(90deg, transparent, var(--subject-primary), transparent)`,
                }}
            />

            <div className="flex items-center justify-between gap-3">
                <div className="flex flex-1 items-center gap-3 min-w-0">
                    {/* Subject Selector */}
                    <div className="relative">
                        <select
                            className="focus-ring appearance-none rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] py-2 pl-3 pr-8 text-sm font-semibold transition-all duration-200 hover:border-[var(--border-hover)] hover:bg-[var(--bg-surface-hover)]"
                            value={currentSubject?.code || ''}
                            onChange={(e) => selectSubject(e.target.value)}
                            style={{ color: currentSubject ? 'var(--subject-primary)' : 'var(--fg-muted)' }}
                        >
                            <option value="" style={{ color: 'var(--fg-primary)', background: 'var(--bg-elevated)' }}>Select Subject</option>
                            {subjects?.map(s => (
                                <option
                                    key={s.id}
                                    value={s.code}
                                    style={{ color: 'var(--fg-primary)', background: 'var(--bg-elevated)' }}
                                >
                                    {s.name}
                                </option>
                            ))}
                        </select>
                        <ChevronDown
                            className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2"
                            style={{ color: currentSubject ? 'var(--subject-primary)' : 'var(--fg-muted)' }}
                        />
                    </div>
                    <div className="hidden h-6 w-px bg-[var(--border-default)] shrink-0 sm:block" />

                    <div className="flex-1 min-w-0">
                        {currentSubject && (
                            <MultiSelect
                                label="Kategorie"
                                options={availableTopics}
                                selected={selectedTopics}
                                onToggle={toggleTopic}
                            />
                        )}
                    </div>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                    <button className="rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] p-2 text-[var(--fg-muted)] transition-all duration-200 hover:border-[var(--border-hover)] hover:text-[var(--fg-primary)] active:scale-95">
                        <Search size={18} />
                    </button>
                    <button className="rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] p-2 text-[var(--fg-muted)] transition-all duration-200 hover:border-[var(--border-hover)] hover:text-[var(--fg-primary)] active:scale-95" title="Oblíbené">
                        <Star size={18} />
                    </button>
                </div>
            </div>
        </header>
    );
}
