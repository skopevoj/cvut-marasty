'use client';

import { useQuiz } from "../lib/QuizContext";
import { MultiSelect } from "./MultiSelect";
import { Search, Star } from "lucide-react";
export function Header() {
    const { subjects, currentSubject, selectSubject, toggleTopic, selectedTopics, questions } = useQuiz();

    const availableTopics = Array.from(new Set(
        questions
            .filter(q => q.subjectCode === currentSubject?.code)
            .map(q => q.topic)
    ));

    return (
        <header className="flex items-center justify-between rounded-[24px] border border-border-color bg-surface px-5 py-3">
            <div className="flex gap-3">
                <select
                    className="flex min-w-[150px] cursor-pointer items-center justify-between rounded-lg border border-border-color bg-[#151518] px-4 py-2 text-[14px] text-text-primary"
                    value={currentSubject?.code || ''}
                    onChange={(e) => selectSubject(e.target.value)}
                >
                    <option value="">Select Subject</option>
                    {subjects.map(s => <option key={s.id} value={s.code}>{s.name}</option>)}
                </select>

                {currentSubject && (
                    <MultiSelect
                        label="Kategorie"
                        options={availableTopics}
                        selected={selectedTopics}
                        onToggle={toggleTopic}
                    />
                )}
            </div>

            <div className="flex gap-3">
                <button className="flex h-[44px] w-[44px] cursor-pointer items-center justify-center rounded-xl border border-border-color bg-[#151518] text-text-secondary transition-all hover:border-[#444] hover:bg-white/10 active:scale-95">
                    <Search size={20} />
                </button>
                <button className="flex h-[44px] w-[44px] cursor-pointer items-center justify-center rounded-xl border border-border-color bg-[#151518] text-text-secondary transition-all hover:border-[#444] hover:bg-white/10 active:scale-95">
                    <Star size={20} />
                </button>
            </div>
        </header>
    );
}
