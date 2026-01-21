'use client';

import { useState } from 'react';
import { Subject } from '../types';
import { ChevronRight, ChevronDown, Folder, FileQuestion, ImageIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface SidebarProps {
    subjects: Subject[];
    selectedSubject: Subject | null;
    selectedCategory: string | null;
    selectedQuestion: string | null;
    onSubjectSelect: (subject: Subject, category?: string) => void;
    onQuestionSelect: (subject: Subject, questionId: string) => void;
    onUnprocessedImageClick?: (subject: Subject, imageName: string) => void;
    onUnprocessedBatchClick?: (subject: Subject) => void;
    onCategoryRename?: (subject: Subject, topicId: string, newName: string) => void;
}

export function Sidebar({
    subjects,
    selectedSubject,
    selectedCategory,
    selectedQuestion,
    onSubjectSelect,
    onQuestionSelect,
    onUnprocessedImageClick,
    onUnprocessedBatchClick,
    onCategoryRename,
}: SidebarProps) {
    const [expandedSubjects, setExpandedSubjects] = useState<Set<string>>(new Set());
    const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

    const toggleSubject = (code: string) => {
        const newExpanded = new Set(expandedSubjects);
        if (newExpanded.has(code)) {
            newExpanded.delete(code);
        } else {
            newExpanded.add(code);
        }
        setExpandedSubjects(newExpanded);
    };

    const toggleCategory = (key: string) => {
        const newExpanded = new Set(expandedCategories);
        if (newExpanded.has(key)) {
            newExpanded.delete(key);
        } else {
            newExpanded.add(key);
        }
        setExpandedCategories(newExpanded);
    };

    return (
        <div className="h-full flex flex-col bg-card/50 backdrop-blur-xl border-r border-border">
            <div className="p-4 border-b border-border">
                <h2 className="text-sm font-semibold tracking-tight text-foreground">Subjects</h2>
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-1">
                {subjects.map((subject) => {
                    const isExpanded = expandedSubjects.has(subject.code);
                    const isSelected = selectedSubject?.code === subject.code && !selectedCategory;

                    // Group questions by topic
                    const questionsByTopic = subject.questions?.reduce((acc, q) => {
                        const topics = q.topics && q.topics.length > 0 ? q.topics : ['uncategorized'];
                        topics.forEach(topic => {
                            if (!acc[topic]) acc[topic] = [];
                            acc[topic].push(q);
                        });
                        return acc;
                    }, {} as Record<string, typeof subject.questions>) || {};

                    return (
                        <div key={subject.code} className="space-y-1">
                            {/* Subject Header */}
                            <div
                                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${isSelected
                                    ? 'bg-primary text-primary-foreground shadow-sm'
                                    : 'text-foreground hover:bg-accent hover:text-accent-foreground'
                                    }`}
                            >
                                <div
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        toggleSubject(subject.code);
                                    }}
                                    className="p-0.5 hover:bg-background/50 rounded transition-colors cursor-pointer"
                                >
                                    {isExpanded ? (
                                        <ChevronDown className="w-4 h-4" />
                                    ) : (
                                        <ChevronRight className="w-4 h-4" />
                                    )}
                                </div>
                                <div
                                    onClick={() => {
                                        if (!isExpanded) {
                                            toggleSubject(subject.code);
                                        }
                                        onSubjectSelect(subject);
                                    }}
                                    className="flex items-center gap-2 flex-1 min-w-0 cursor-pointer"
                                >
                                    <Folder className="w-4 h-4 flex-shrink-0" />
                                    <span className="flex-1 text-left truncate">{subject.name}</span>
                                    <span className="text-xs opacity-60">{subject.questions?.length || 0}</span>
                                </div>
                            </div>

                            {/* Categories & Questions */}
                            <AnimatePresence>
                                {isExpanded && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.2 }}
                                        className="ml-6 space-y-1 overflow-hidden"
                                    >
                                        {Object.entries(questionsByTopic)
                                            .sort(([topicIdA], [topicIdB]) => {
                                                const topicA = subject.topics?.find((t) => t.id === topicIdA);
                                                const topicB = subject.topics?.find((t) => t.id === topicIdB);
                                                const nameA = topicA?.name || topicIdA;
                                                const nameB = topicB?.name || topicIdB;
                                                return nameA.localeCompare(nameB);
                                            })
                                            .map(([topicId, questions]) => {
                                                const categoryKey = `${subject.code}-${topicId}`;
                                                const isCategoryExpanded = expandedCategories.has(categoryKey);
                                                const isCategorySelected =
                                                    selectedSubject?.code === subject.code && selectedCategory === topicId;

                                                const topic = subject.topics?.find((t) => t.id === topicId);
                                                const displayName = topic?.name || topicId;

                                                return (
                                                    <div key={categoryKey} className="space-y-0.5">
                                                        {/* Category Header */}
                                                        <div
                                                            className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${isCategorySelected
                                                                ? 'bg-accent text-accent-foreground'
                                                                : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground'
                                                                }`}
                                                        >
                                                            <div
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    toggleCategory(categoryKey);
                                                                }}
                                                                className="p-0.5 hover:bg-background/50 rounded transition-colors cursor-pointer"
                                                            >
                                                                {isCategoryExpanded ? (
                                                                    <ChevronDown className="w-3 h-3" />
                                                                ) : (
                                                                    <ChevronRight className="w-3 h-3" />
                                                                )}
                                                            </div>
                                                            <div
                                                                onClick={() => {
                                                                    if (!isCategoryExpanded) {
                                                                        toggleCategory(categoryKey);
                                                                    }
                                                                    onSubjectSelect(subject, topicId);
                                                                }}
                                                                onDoubleClick={(e) => {
                                                                    e.stopPropagation();
                                                                    if (onCategoryRename) {
                                                                        const newName = prompt('Rename category:', displayName);
                                                                        if (newName && newName.trim()) {
                                                                            onCategoryRename(subject, topicId, newName.trim());
                                                                        }
                                                                    }
                                                                }}
                                                                className="flex items-center gap-2 flex-1 min-w-0 cursor-pointer"
                                                            >
                                                                <span className="flex-1 text-left truncate">{displayName}</span>
                                                                <span className="text-[10px] opacity-60">{questions.length}</span>
                                                            </div>
                                                        </div>

                                                        {/* Questions */}
                                                        <AnimatePresence>
                                                            {isCategoryExpanded && (
                                                                <motion.div
                                                                    initial={{ height: 0, opacity: 0 }}
                                                                    animate={{ height: 'auto', opacity: 1 }}
                                                                    exit={{ height: 0, opacity: 0 }}
                                                                    transition={{ duration: 0.15 }}
                                                                    className="ml-4 space-y-0.5 overflow-hidden"
                                                                >
                                                                    {questions.map((question) => {
                                                                        const isQuestionSelected = selectedQuestion === question.id;
                                                                        return (
                                                                            <button
                                                                                key={question.id}
                                                                                onClick={() => onQuestionSelect(subject, question.id)}
                                                                                className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-md text-xs transition-all duration-200 ${isQuestionSelected
                                                                                    ? 'bg-primary/10 text-primary font-medium'
                                                                                    : 'text-muted-foreground hover:bg-accent/30 hover:text-foreground'
                                                                                    }`}
                                                                            >
                                                                                <FileQuestion className="w-3 h-3 flex-shrink-0" />
                                                                                <span className="flex-1 text-left truncate font-mono">
                                                                                    {question.id.substring(0, 8)}
                                                                                </span>
                                                                            </button>
                                                                        );
                                                                    })}
                                                                </motion.div>
                                                            )}
                                                        </AnimatePresence>
                                                    </div>
                                                );
                                            })}

                                        {/* Unprocessed Images */}
                                        {subject.unprocessedImages && subject.unprocessedImages.length > 0 && (
                                            <div className="space-y-0.5">
                                                <div
                                                    onClick={() => onUnprocessedBatchClick?.(subject)}
                                                    className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 cursor-pointer ${false
                                                        ? 'bg-accent text-accent-foreground'
                                                        : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground'
                                                        }`}
                                                >
                                                    <div
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            toggleCategory(`${subject.code}-unprocessed`);
                                                        }}
                                                        className="p-0.5 hover:bg-background/50 rounded transition-colors"
                                                    >
                                                        {expandedCategories.has(`${subject.code}-unprocessed`) ? (
                                                            <ChevronDown className="w-3 h-3" />
                                                        ) : (
                                                            <ChevronRight className="w-3 h-3" />
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-2 flex-1 min-w-0">
                                                        <ImageIcon className="w-3 h-3" />
                                                        <span className="flex-1 text-left truncate">Unprocessed</span>
                                                        <span className="text-[10px] opacity-60">
                                                            {subject.unprocessedImages.length}
                                                        </span>
                                                    </div>
                                                </div>

                                                <AnimatePresence>
                                                    {expandedCategories.has(`${subject.code}-unprocessed`) && (
                                                        <motion.div
                                                            initial={{ height: 0, opacity: 0 }}
                                                            animate={{ height: 'auto', opacity: 1 }}
                                                            exit={{ height: 0, opacity: 0 }}
                                                            transition={{ duration: 0.15 }}
                                                            className="ml-4 space-y-0.5 overflow-hidden"
                                                        >
                                                            {subject.unprocessedImages.map((imageName) => (
                                                                <button
                                                                    key={imageName}
                                                                    onClick={() =>
                                                                        onUnprocessedImageClick?.(subject, imageName)
                                                                    }
                                                                    className="w-full flex items-center gap-2 px-3 py-1.5 rounded-md text-xs transition-all duration-200 text-muted-foreground hover:bg-accent/30 hover:text-foreground"
                                                                >
                                                                    <ImageIcon className="w-3 h-3 flex-shrink-0" />
                                                                    <span className="flex-1 text-left truncate font-mono text-[10px]">
                                                                        {imageName}
                                                                    </span>
                                                                </button>
                                                            ))}
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                            </div>
                                        )}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
