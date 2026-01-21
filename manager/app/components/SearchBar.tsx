'use client';

import { useState } from 'react';
import { Search, X } from 'lucide-react';
import { Subject, Question } from '../types';
import { LatexRenderer } from './LatexRenderer';

interface SearchBarProps {
    subjects: Subject[];
    onQuestionSelect: (subject: Subject, questionId: string) => void;
}

export function SearchBar({ subjects, onQuestionSelect }: SearchBarProps) {
    const [query, setQuery] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const [results, setResults] = useState<Array<{ subject: Subject; question: Question }>>([]);

    function handleSearch(searchQuery: string) {
        setQuery(searchQuery);

        if (!searchQuery.trim()) {
            setResults([]);
            setIsOpen(false);
            return;
        }

        const searchLower = searchQuery.toLowerCase();
        const found: Array<{ subject: Subject; question: Question }> = [];

        subjects.forEach((subject) => {
            subject.questions?.forEach((question) => {
                if (
                    question.question.toLowerCase().includes(searchLower) ||
                    question.id.toLowerCase().includes(searchLower) ||
                    question.answers?.some((a) => a.text.toLowerCase().includes(searchLower))
                ) {
                    found.push({ subject, question });
                }
            });
        });

        setResults(found.slice(0, 20)); // Limit to 20 results
        setIsOpen(found.length > 0);
    }

    function selectQuestion(subject: Subject, questionId: string) {
        onQuestionSelect(subject, questionId);
        setQuery('');
        setIsOpen(false);
    }

    return (
        <div className="relative flex-1 max-w-md">
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                <input
                    type="text"
                    value={query}
                    onChange={(e) => handleSearch(e.target.value)}
                    placeholder="Search questions..."
                    className="w-full pl-9 pr-9 py-1.5 text-sm bg-background border border-input rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                />
                {query && (
                    <button
                        onClick={() => {
                            setQuery('');
                            setResults([]);
                            setIsOpen(false);
                        }}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-accent rounded transition-colors"
                    >
                        <X className="w-3 h-3" />
                    </button>
                )}
            </div>

            {/* Results Dropdown */}
            {isOpen && results.length > 0 && (
                <>
                    <div
                        className="fixed inset-0 z-[90]"
                        onClick={() => setIsOpen(false)}
                    />
                    <div className="absolute top-full mt-2 w-full max-h-96 overflow-auto bg-card border border-border rounded-xl shadow-elevated z-[100]">
                        {results.map(({ subject, question }) => (
                            <button
                                key={`${subject.code}-${question.id}`}
                                onClick={() => selectQuestion(subject, question.id)}
                                className="w-full text-left px-4 py-3 hover:bg-accent transition-colors border-b border-border last:border-b-0"
                            >
                                <div className="flex items-start gap-3">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-xs font-mono text-muted-foreground">{question.id}</span>
                                            <span className="text-xs px-1.5 py-0.5 bg-secondary text-secondary-foreground rounded">
                                                {subject.name}
                                            </span>
                                        </div>
                                        <div className="text-sm text-foreground line-clamp-2">
                                            <LatexRenderer content={question.question} />
                                        </div>
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}
