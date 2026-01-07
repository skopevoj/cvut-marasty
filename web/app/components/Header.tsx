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
        <header className="header-nav">
            <div className="nav-group">
                <select
                    className="nav-select"
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

            <div className="nav-group icons-group">
                <button className="nav-btn"><Search /></button>
                <button className="nav-btn"><Star /></button>
            </div>
        </header>
    );
}
