'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { useQuiz } from "../lib/QuizContext";
import { MultiSelect } from "./MultiSelect";
import { Search, Star, ChevronDown, X } from "lucide-react";
import Latex from "./Latex";

export function Header() {
    const { subjects, currentSubject, currentSubjectDetails, selectSubject, toggleTopic, selectedTopics, questions, goToQuestion } = useQuiz();
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const searchInputRef = useRef<HTMLInputElement>(null);

    // Focus input when search opens
    useEffect(() => {
        if (isSearchOpen) {
            searchInputRef.current?.focus();
        }
    }, [isSearchOpen]);

    // Map of topic id -> topic name from subject details
    const topicMap = useMemo(() => {
        return (currentSubjectDetails?.topics || []).reduce((acc: any, t: any) => {
            acc[t.id] = t.name;
            return acc;
        }, {});
    }, [currentSubjectDetails]);

    const availableTopics = useMemo(() => {
        return Array.from(new Set(
            questions
                .filter(q => q.subjectCode === currentSubject?.code)
                .map(q => q.topic)
        )).map(id => ({
            id,
            name: topicMap[id] || id
        }));
    }, [questions, currentSubject, topicMap]);

    const searchResults = useMemo(() => {
        if (!searchQuery.trim() || !currentSubject) return [];
        const query = searchQuery.toLowerCase();
        return questions
            .filter(q => q.subjectCode === currentSubject.code)
            .filter(q => {
                const textMatch = (q.question || "").toLowerCase().includes(query);
                const answerMatch = (q.answers || []).some((a: any) => 
                    (a.text || "").toLowerCase().includes(query)
                );
                return textMatch || answerMatch;
            })
            .slice(0, 10); // Limit results for performance/UI
    }, [searchQuery, currentSubject, questions]);

    return (
        <header className="glass-card-themed relative z-50 rounded-3xl p-3 px-3 transition-all duration-300 md:p-4">
            <div
                className="absolute bottom-0 left-0 right-0 h-px opacity-50"
                style={{
                    background: `linear-gradient(90deg, transparent, var(--subject-primary), transparent)`,
                }}
            />

            <div className="relative flex items-center justify-between gap-3">
                {isSearchOpen ? (
                    <div className="flex flex-1 items-center gap-3">
                        <div className="relative flex-1">
                            <input
                                ref={searchInputRef}
                                type="text"
                                className="w-full h-[44px] bg-transparent text-[14px] outline-none placeholder:text-[var(--fg-muted)]"
                                placeholder={`Hledat v ${currentSubject?.name || 'předmětu'}...`}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                            {searchResults.length > 0 && (
                                <div className="absolute top-[54px] left-[-12px] right-[-12px] overflow-hidden rounded-2xl border border-[var(--border-default)] bg-[var(--bg-elevated)] shadow-2xl backdrop-blur-xl">
                                    <div className="max-h-[400px] overflow-y-auto">
                                        {searchResults.map((q) => (
                                            <button
                                                key={q.id}
                                                className="w-full border-b border-[var(--border-default)] p-4 text-left transition-colors hover:bg-white/[0.05] last:border-0"
                                                onClick={() => {
                                                    goToQuestion(q.id);
                                                    setIsSearchOpen(false);
                                                    setSearchQuery("");
                                                }}
                                            >
                                                <div className="mb-1 text-[10px] font-bold uppercase tracking-wider text-[var(--subject-primary)] opacity-70">
                                                    {topicMap[q.topic] || q.topic}
                                                </div>
                                                <Latex tex={q.question} className="line-clamp-2 text-sm text-[var(--fg-primary)]" />
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                        <button
                            onClick={() => {
                                setIsSearchOpen(false);
                                setSearchQuery("");
                            }}
                            className="rounded-lg p-2 text-[var(--fg-muted)] hover:text-[var(--fg-primary)]"
                        >
                            <X size={20} />
                        </button>
                    </div>
                ) : (
                    <>
                        <div className="flex flex-1 items-center gap-3 min-w-0">
                            {/* Subject Selector */}
                            <div className="relative">
                                <select
                                    className="focus-ring h-[44px] appearance-none rounded-xl border px-4 pr-10 text-[14px] font-medium transition-all duration-200 outline-none"
                                    value={currentSubject?.code || ''}
                                    onChange={(e) => selectSubject(e.target.value)}
                                    style={{
                                        color: 'var(--fg-primary)',
                                        borderColor: 'color-mix(in srgb, var(--subject-primary) 20%, transparent)',
                                        background: 'color-mix(in srgb, var(--subject-primary) 2%, rgba(255,255,255,0.03))',
                                        backdropFilter: 'blur(10px)'
                                    }}
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
                                    className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 opacity-60"
                                    style={{ color: 'var(--fg-primary)' }}
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
                            <button 
                                onClick={() => setIsSearchOpen(true)}
                                className="rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] p-2 text-[var(--fg-muted)] transition-all duration-200 hover:border-[var(--border-hover)] hover:text-[var(--fg-primary)] active:scale-95"
                                title="Hledat"
                            >
                                <Search size={18} />
                            </button>
                            <button className="rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] p-2 text-[var(--fg-muted)] transition-all duration-200 hover:border-[var(--border-hover)] hover:text-[var(--fg-primary)] active:scale-95" title="Oblíbené">
                                <Star size={18} />
                            </button>
                        </div>
                    </>
                )}
            </div>
        </header>
    );
}
