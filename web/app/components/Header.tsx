'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { useQuiz } from "../lib/QuizContext";
import { MultiSelect } from "./MultiSelect";
import { Search, Star } from "lucide-react";
import { SubjectSelector } from "./header/SubjectSelector";
import { SearchBar } from "./header/SearchBar";
import { SearchResults } from "./header/SearchResults";
import * as helpers from "../lib/headerHelpers";
import { IconButton } from "./IconButton";

export function Header() {
    const { subjects, currentSubject, currentSubjectDetails, selectSubject, toggleTopic, selectedTopics, questions, goToQuestion } = useQuiz();
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const searchInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isSearchOpen) {
            searchInputRef.current?.focus();
        }
    }, [isSearchOpen]);

    const topicMap = useMemo(() => {
        return helpers.getTopicMap(currentSubjectDetails);
    }, [currentSubjectDetails]);

    const availableTopics = useMemo(() => {
        return helpers.getAvailableTopics(questions, currentSubject, topicMap);
    }, [questions, currentSubject, topicMap]);

    const searchResults = useMemo(() => {
        return helpers.filterSearchResults(questions, currentSubject, searchQuery);
    }, [searchQuery, currentSubject, questions]);

    return (
        <header className="glass-card-themed relative z-50 rounded-3xl p-3 px-3 transition-all duration-300 md:p-4">
            <div className="absolute bottom-0 left-0 right-0 h-px opacity-50" />

            <div className="relative flex items-center justify-between gap-3">
                {isSearchOpen ? (
                    <div className="flex flex-1 items-center gap-3">
                        <SearchBar
                            inputRef={searchInputRef}
                            searchQuery={searchQuery}
                            onSearchChange={setSearchQuery}
                            onClose={() => {
                                setIsSearchOpen(false);
                                setSearchQuery("");
                            }}
                            placeholder={`Hledat v ${currentSubject?.name || 'předmětu'}...`}
                        />
                        <SearchResults
                            results={searchResults}
                            topicMap={topicMap}
                            onQuestionClick={(id) => {
                                goToQuestion(id);
                                setIsSearchOpen(false);
                                setSearchQuery("");
                            }}
                        />
                    </div>
                ) : (
                    <>
                        <div className="flex flex-1 items-center gap-3 min-w-0">
                            <SubjectSelector
                                subjects={subjects}
                                currentSubject={currentSubject}
                                onSelectSubject={selectSubject}
                            />

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
                            <IconButton
                                onClick={() => setIsSearchOpen(true)}
                                icon={Search}
                                title="Hledat"
                            />
                            <IconButton
                                icon={Star}
                                title="Oblíbené"
                            />
                        </div>
                    </>
                )}
            </div>
        </header>
    );
}

