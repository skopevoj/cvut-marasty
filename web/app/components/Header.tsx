'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { useQuiz, SortType } from "../lib/QuizContext";
import { MultiSelect } from "./MultiSelect";
import { Search, Star, Settings } from "lucide-react";
import { SubjectSelector } from "./header/SubjectSelector";
import { SearchBar } from "./header/SearchBar";
import { SearchResults } from "./header/SearchResults";
import { SettingsMenu } from "./header/SettingsMenu";
import { SortSelector } from "./header/SortSelector";
import { favoritesHelper, useFavorites } from "../lib/favoritesHelper";
import * as helpers from "../lib/headerHelpers";
import { IconButton } from "./IconButton";

import { Modal } from "./Modal";

export function Header() {
    const { subjects, currentSubject, currentSubjectDetails, selectSubject, toggleTopic, selectedTopics, sortType, setSortType, questions, goToQuestion } = useQuiz();
    const favorites = useFavorites();
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isFavoritesOpen, setIsFavoritesOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const searchInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isSearchOpen) {
            searchInputRef.current?.focus();
        }
    }, [isSearchOpen]);

    const favoriteResults = useMemo(() => {
        return questions.filter(q => favorites.includes(q.id));
    }, [favorites, questions]);

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
        <>
            <header className="glass-card-themed relative z-50 rounded-3xl p-2 md:p-4 transition-all duration-300">
                <div className="absolute bottom-0 left-0 right-0 h-px opacity-50" />

                <div className="relative flex items-center justify-between gap-2 md:gap-3">
                    {isSearchOpen ? (
                        <div className="flex flex-1 items-center gap-2 md:gap-3">
                            <SearchBar
                                inputRef={searchInputRef}
                                searchQuery={searchQuery}
                                onSearchChange={setSearchQuery}
                                onClose={() => {
                                    setIsSearchOpen(false);
                                    setSearchQuery("");
                                }}
                                placeholder={currentSubject ? `Hledat v ${currentSubject.code}...` : "Hledat..."}
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
                            <div className="flex flex-1 items-center gap-2 md:gap-3 min-w-0">
                                <SubjectSelector
                                    subjects={subjects}
                                    currentSubject={currentSubject}
                                    onSelectSubject={selectSubject}
                                />

                                <div className="hidden h-6 w-px bg-[var(--border-default)] shrink-0 sm:block" />

                                <div className="min-w-0 flex items-center gap-2">
                                    {currentSubject && (
                                        <>
                                            <MultiSelect
                                                label="Kategorie"
                                                options={availableTopics}
                                                selected={selectedTopics}
                                                onToggle={toggleTopic}
                                            />
                                            <SortSelector
                                                sortType={sortType}
                                                onSelectSort={setSortType}
                                            />
                                        </>
                                    )}
                                </div>
                            </div>

                            <div className="flex shrink-0 items-center gap-1.5 md:gap-2">
                                <IconButton
                                    onClick={() => {
                                        setIsSearchOpen(true);
                                    }}
                                    icon={Search}
                                    title="Hledat"
                                />

                                <IconButton
                                    onClick={() => setIsFavoritesOpen(true)}
                                    icon={Star}
                                    title="Oblíbené"
                                    active={isFavoritesOpen}
                                />

                                <IconButton
                                    onClick={() => setIsSettingsOpen(true)}
                                    icon={Settings}
                                    title="Nastavení"
                                    active={isSettingsOpen}
                                />
                            </div>
                        </>
                    )}
                </div>
            </header>

            <Modal
                isOpen={isFavoritesOpen}
                onClose={() => setIsFavoritesOpen(false)}
                title="Oblíbené otázky"
            >
                <SearchResults
                    results={favoriteResults}
                    topicMap={topicMap}
                    className="modal-list"
                    onQuestionClick={(id) => {
                        goToQuestion(id);
                        setIsFavoritesOpen(false);
                    }}
                />
            </Modal>

            <Modal
                isOpen={isSettingsOpen}
                onClose={() => setIsSettingsOpen(false)}
                title="Nastavení"
            >
                <SettingsMenu />
            </Modal>
        </>
    );
}

