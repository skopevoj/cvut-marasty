'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { Subject, Config, Question } from '../types';
import { Sidebar } from './Sidebar';
import { QuestionEditor } from './QuestionEditorNew';
import { UnprocessedImageViewer } from './UnprocessedImageViewer';
import { UnprocessedBatchViewer } from './UnprocessedBatchViewer';
import { BatchAIProcessor } from './BatchAIProcessor';
import { AmbientBackground } from './AmbientBackground';
import { ThemeToggle } from './ThemeToggle';
import { AddFolderDialog } from './AddFolderDialog';
import { SearchBar } from './SearchBar';
import { SubjectEditorDialog } from './SubjectEditorDialog';
import { SimilarQuestionsDetector } from './SimilarQuestionsDetector';
import { LatexRenderer } from './LatexRenderer';
import { Clipboard, ClipboardCheck, Copy, Download, EllipsisVertical, FolderPlus, Loader2, Plus, Edit, RefreshCw, FileText } from 'lucide-react';
import { ExportDialog } from './ExportDialog';
import { TextImportProcessor } from './TextImportProcessor';

export function QuestionManager() {
    const [config, setConfig] = useState<Config>({ folders: [] });
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [selectedFolder, setSelectedFolder] = useState<string>('');
    const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [selectedQuestionId, setSelectedQuestionId] = useState<string | null>(null);
    const [selectedUnprocessedImage, setSelectedUnprocessedImage] = useState<string | null>(null);
    const [showUnprocessedBatch, setShowUnprocessedBatch] = useState(false);
    const [showBatchProcessor, setShowBatchProcessor] = useState(false);
    const [showSimilarDetector, setShowSimilarDetector] = useState(false);
    const [batchConfig, setBatchConfig] = useState<{
        selectedImages: string[];
        additionalPrompt: string;
        forcedTopics: string[];
    }>({ selectedImages: [], additionalPrompt: '', forcedTopics: [] });
    const [loading, setLoading] = useState(false);
    const [showAddFolder, setShowAddFolder] = useState(false);
    const [showSubjectEditor, setShowSubjectEditor] = useState(false);
    const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
    const [dataHash, setDataHash] = useState<string>('');
    const [showExportDialog, setShowExportDialog] = useState(false);
    const [showTextImport, setShowTextImport] = useState(false);
    const [showMoreMenu, setShowMoreMenu] = useState(false);
    const [copiedToClipboard, setCopiedToClipboard] = useState(false);

    // Computed synchronously — avoids extra render cycle from useEffect+setState
    const filteredQuestions = useMemo<Question[]>(() => {
        if (!selectedSubject) return [];
        if (selectedCategory) {
            return selectedSubject.questions?.filter((q) => q.topics?.includes(selectedCategory)) || [];
        }
        return selectedSubject.questions || [];
    }, [selectedSubject, selectedCategory]);

    useEffect(() => {
        loadConfig();
    }, []);

    useEffect(() => {
        if (selectedFolder) {
            loadSubjects();
        }
    }, [selectedFolder]);


    async function loadConfig() {
        try {
            const res = await fetch('/api/config');
            const data = await res.json();
            setConfig(data);
            if (data.folders.length > 0) {
                setSelectedFolder(data.folders[0]);
            }
        } catch (error) {
            console.error('Error loading config:', error);
        }
    }

    async function saveConfig(newConfig: Config) {
        try {
            await fetch('/api/config', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newConfig),
            });
            setConfig(newConfig);
        } catch (error) {
            console.error('Error saving config:', error);
        }
    }

    async function loadSubjects(silent = false) {
        if (!selectedFolder) return;

        if (!silent) setLoading(true);
        try {
            const res = await fetch('/api/fs', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'loadSubjects',
                    folderPath: selectedFolder,
                }),
            });
            const data = await res.json();
            const newHash = JSON.stringify(data.subjects || []);

            if (silent && dataHash) {
                // Show notification based on comparison
                if (newHash === dataHash) {
                    alert('✓ Checked source\n\nNo changes detected. Data is up to date.');
                } else {
                    alert('✓ Checked source\n\nNew changes detected! Data has been refreshed.');
                }
            }

            setDataHash(newHash);
            setSubjects(data.subjects || []);
        } catch (error) {
            console.error('Error loading subjects:', error);
            if (silent) {
                alert('✗ Failed to check source\n\nAn error occurred while checking for updates.');
            }
        } finally {
            if (!silent) setLoading(false);
        }
    }

    async function forceCheckUpdate() {
        await loadSubjects(true);
    }

    const moreMenuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (moreMenuRef.current && !moreMenuRef.current.contains(e.target as Node)) {
                setShowMoreMenu(false);
            }
        }
        if (showMoreMenu) {
            document.addEventListener('mousedown', handleClickOutside);
            return () => document.removeEventListener('mousedown', handleClickOutside);
        }
    }, [showMoreMenu]);

    async function handleCopySubjectJson() {
        if (!selectedSubject) return;
        const questions = selectedSubject.questions || [];
        const exportData = questions.map(q => ({
            id: q.id,
            question: q.question,
            questionType: q.questionType,
            topics: q.topics,
            answers: q.answers,
            originalText: q.originalText,
        }));
        try {
            await navigator.clipboard.writeText(JSON.stringify(exportData, null, 2));
            setCopiedToClipboard(true);
            setTimeout(() => setCopiedToClipboard(false), 2000);
        } catch {
            alert('Failed to copy to clipboard');
        }
    }

    async function handleExport(quality: number) {
        if (!selectedFolder) return;
        setLoading(true);
        try {
            const res = await fetch('/api/fs', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'exportQuestions',
                    folderPath: selectedFolder,
                    imageQuality: quality,
                }),
            });
            const data = await res.json();

            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'questions-export.json';
            a.click();
            URL.revokeObjectURL(url);
            setShowExportDialog(false);
        } catch (error) {
            console.error('Error exporting:', error);
        } finally {
            setLoading(false);
        }
    }

    function handleAddFolder(path: string) {
        const newConfig = {
            ...config,
            folders: [...config.folders, path],
        };
        saveConfig(newConfig);
        setSelectedFolder(path);
    }

    function handleSubjectSelect(subject: Subject, category?: string) {
        setSelectedSubject(subject);
        setSelectedCategory(category || null);
        setSelectedQuestionId(null);
        setSelectedUnprocessedImage(null);
        setShowUnprocessedBatch(false);
        setShowBatchProcessor(false);
        setShowSimilarDetector(false);
        setShowTextImport(false);
    }

    function handleQuestionSelect(subject: Subject, questionId: string) {
        setSelectedSubject(subject);
        setSelectedQuestionId(questionId);
        setSelectedUnprocessedImage(null);
        setShowUnprocessedBatch(false);
        setShowBatchProcessor(false);
        setShowSimilarDetector(false);
        setShowTextImport(false);
        // Find category if needed
        const question = subject.questions?.find(q => q.id === questionId);
        if (question?.topics && question.topics.length > 0) {
            setSelectedCategory(question.topics[0]);
        }
    }

    function handleUnprocessedImageClick(subject: Subject, imageName: string) {
        setSelectedSubject(subject);
        setSelectedQuestionId(null);
        setSelectedUnprocessedImage(imageName);
        setShowUnprocessedBatch(false);
        setShowBatchProcessor(false);
    }

    function handleUnprocessedBatchClick(subject: Subject) {
        setSelectedSubject(subject);
        setSelectedQuestionId(null);
        setSelectedUnprocessedImage(null);
        setShowUnprocessedBatch(true);
        setShowBatchProcessor(false);
    }

    function handleStartBatchProcessing(selectedImages: string[], additionalPrompt: string, forcedTopics: string[]) {
        setBatchConfig({ selectedImages, additionalPrompt, forcedTopics });
        setShowUnprocessedBatch(false);
        setShowBatchProcessor(true);
    }

    function handleNewSubject() {
        setEditingSubject(null);
        setShowSubjectEditor(true);
    }

    function handleEditSubject() {
        if (selectedSubject) {
            setEditingSubject(selectedSubject);
            setShowSubjectEditor(true);
        }
    }

    function handleSubjectSaved() {
        loadSubjects();
        setShowSubjectEditor(false);
        setEditingSubject(null);
    }

    async function handleCategoryRename(subject: Subject, topicId: string, newName: string) {
        const updatedTopics = subject.topics?.map(t =>
            t.id === topicId ? { ...t, name: newName } : t
        );

        try {
            await fetch('/api/fs', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'saveSubject',
                    folderPath: selectedFolder,
                    data: {
                        subjectCode: subject.code,
                        subjectData: {
                            code: subject.code,
                            name: subject.name,
                            topics: updatedTopics,
                        },
                    },
                }),
            });
            await loadSubjects();
        } catch (error) {
            console.error('Error renaming category:', error);
            alert('Failed to rename category');
        }
    }

    const selectedQuestion = useMemo(() =>
        selectedQuestionId && selectedQuestionId !== 'new'
            ? selectedSubject?.questions?.find((q) => q.id === selectedQuestionId)
            : undefined,
        [selectedQuestionId, selectedSubject]);

    const isCreatingNew = selectedQuestionId === 'new';

    return (
        <div className="h-screen flex flex-col overflow-hidden">
            <AmbientBackground />

            {/* Header */}
            <header className="flex-shrink-0 border-b border-border bg-card/50 backdrop-blur-xl relative z-50 overflow-visible">
                <div className="flex items-center justify-between h-12 px-4 gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                        <h1 className="text-sm font-semibold tracking-tight bg-gradient-to-b from-foreground to-foreground/70 bg-clip-text text-transparent whitespace-nowrap">
                            QM
                        </h1>
                        {selectedFolder && (
                            <span className="text-[11px] text-muted-foreground font-mono px-1.5 py-0.5 bg-accent/50 rounded truncate max-w-[120px]">
                                {selectedFolder.split('/').pop()}
                            </span>
                        )}
                    </div>

                    {subjects.length > 0 && (
                        <SearchBar subjects={subjects} onQuestionSelect={handleQuestionSelect} />
                    )}

                    <div className="flex items-center gap-1">
                        <button
                            onClick={() => setShowAddFolder(true)}
                            className="p-2 text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-all"
                            title="Add Folder"
                        >
                            <FolderPlus className="w-4 h-4" />
                        </button>

                        {selectedFolder && (
                            <>
                                <button
                                    onClick={handleNewSubject}
                                    className="p-2 text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-all"
                                    title="New Subject"
                                >
                                    <Plus className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={forceCheckUpdate}
                                    disabled={loading}
                                    className="p-2 text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-all disabled:opacity-40"
                                    title="Check Updates"
                                >
                                    <RefreshCw className="w-4 h-4" />
                                </button>
                            </>
                        )}

                        {selectedSubject && (
                            <>
                                <button
                                    onClick={handleCopySubjectJson}
                                    className="p-2 text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-all"
                                    title="Copy questions JSON"
                                >
                                    {copiedToClipboard ? (
                                        <ClipboardCheck className="w-4 h-4 text-primary" />
                                    ) : (
                                        <Clipboard className="w-4 h-4" />
                                    )}
                                </button>
                                <button
                                    onClick={() => {
                                        setShowTextImport(true);
                                        setSelectedQuestionId(null);
                                        setSelectedUnprocessedImage(null);
                                        setShowUnprocessedBatch(false);
                                        setShowBatchProcessor(false);
                                        setShowSimilarDetector(false);
                                    }}
                                    className="p-2 text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-all"
                                    title="Import from Text"
                                >
                                    <FileText className="w-4 h-4" />
                                </button>
                            </>
                        )}

                        {/* More menu */}
                        {selectedFolder && (
                            <div className="relative" ref={moreMenuRef}>
                                <button
                                    onClick={() => setShowMoreMenu(!showMoreMenu)}
                                    className="p-2 text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-all"
                                    title="More actions"
                                >
                                    <EllipsisVertical className="w-4 h-4" />
                                </button>
                                {showMoreMenu && (
                                    <div className="absolute right-0 top-full mt-1 w-48 bg-card border border-border rounded-lg shadow-lg py-1 z-50">
                                        <button
                                            onClick={() => {
                                                setShowSimilarDetector(true);
                                                setSelectedQuestionId(null);
                                                setSelectedUnprocessedImage(null);
                                                setShowUnprocessedBatch(false);
                                                setShowBatchProcessor(false);
                                                setShowMoreMenu(false);
                                            }}
                                            disabled={subjects.length === 0}
                                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-accent transition-all disabled:opacity-40"
                                        >
                                            <Copy className="w-4 h-4" />
                                            Find Duplicates
                                        </button>
                                        <button
                                            onClick={() => {
                                                setShowExportDialog(true);
                                                setShowMoreMenu(false);
                                            }}
                                            disabled={loading}
                                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-accent transition-all disabled:opacity-40"
                                        >
                                            <Download className="w-4 h-4" />
                                            Export All
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}

                        <ThemeToggle />
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <div className="flex-1 flex overflow-hidden">
                {/* Sidebar */}
                <aside className="w-64 flex-shrink-0 overflow-hidden">
                    <Sidebar
                        subjects={subjects}
                        selectedSubject={selectedSubject}
                        selectedCategory={selectedCategory}
                        selectedQuestion={selectedQuestionId}
                        onSubjectSelect={handleSubjectSelect}
                        onQuestionSelect={handleQuestionSelect}
                        onUnprocessedImageClick={handleUnprocessedImageClick}
                        onUnprocessedBatchClick={handleUnprocessedBatchClick}
                        onCategoryRename={handleCategoryRename}
                    />
                </aside>

                {/* Main Content Area */}
                <main className="flex-1 overflow-auto">
                    {loading && !subjects.length ? (
                        <div className="flex items-center justify-center h-full">
                            <div className="text-center">
                                <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
                                <p className="text-muted-foreground">Loading subjects...</p>
                            </div>
                        </div>
                    ) : !selectedFolder ? (
                        <div className="flex items-center justify-center h-full">
                            <div className="text-center max-w-md px-4">
                                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                                    <FolderPlus className="w-8 h-8 text-primary" />
                                </div>
                                <h2 className="text-xl font-semibold mb-2">No Folder Selected</h2>
                                <p className="text-muted-foreground mb-6">
                                    Add a questions folder to get started managing your exam questions.
                                </p>
                                <button
                                    onClick={() => setShowAddFolder(true)}
                                    className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all duration-200 glow-accent"
                                >
                                    Add Your First Folder
                                </button>
                            </div>
                        </div>
                    ) : showTextImport && selectedSubject ? (
                        <TextImportProcessor
                            subject={selectedSubject}
                            folderPath={selectedFolder}
                            onBack={() => setShowTextImport(false)}
                            onRefresh={loadSubjects}
                        />
                    ) : showBatchProcessor && selectedSubject ? (
                        <BatchAIProcessor
                            subject={selectedSubject}
                            folderPath={selectedFolder}
                            selectedImages={batchConfig.selectedImages}
                            additionalPrompt={batchConfig.additionalPrompt}
                            forcedTopics={batchConfig.forcedTopics}
                            onBack={() => {
                                setShowBatchProcessor(false);
                                setShowUnprocessedBatch(true);
                            }}
                            onRefresh={loadSubjects}
                        />
                    ) : showUnprocessedBatch && selectedSubject ? (
                        <UnprocessedBatchViewer
                            subject={selectedSubject}
                            folderPath={selectedFolder}
                            onBack={() => setShowUnprocessedBatch(false)}
                            onStartBatch={handleStartBatchProcessing}
                        />
                    ) : selectedUnprocessedImage && selectedSubject ? (
                        <UnprocessedImageViewer
                            subject={selectedSubject}
                            imageName={selectedUnprocessedImage}
                            folderPath={selectedFolder}
                            onBack={() => setSelectedUnprocessedImage(null)}
                            onRefresh={loadSubjects}
                            onBatchProcess={() => {
                                setSelectedUnprocessedImage(null);
                                setShowBatchProcessor(true);
                            }}
                        />
                    ) : showSimilarDetector ? (
                        <SimilarQuestionsDetector
                            subjects={subjects}
                            folderPath={selectedFolder}
                            onBack={() => setShowSimilarDetector(false)}
                            onRefresh={loadSubjects}
                        />
                    ) : selectedQuestionId && selectedSubject ? (
                        <QuestionEditor
                            subject={selectedSubject}
                            question={isCreatingNew ? undefined : selectedQuestion}
                            folderPath={selectedFolder}
                            onBack={() => setSelectedQuestionId(null)}
                            onRefresh={loadSubjects}
                        />
                    ) : (
                        <div className="p-6">
                            {selectedSubject ? (
                                <div>
                                    <div className="mb-6">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <h2 className="text-2xl font-semibold mb-2">{selectedSubject.name}</h2>
                                                {selectedCategory && (
                                                    <p className="text-muted-foreground">
                                                        Category:{' '}
                                                        {selectedSubject.topics?.find((t) => t.id === selectedCategory)?.name ||
                                                            selectedCategory}
                                                    </p>
                                                )}
                                            </div>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={handleEditSubject}
                                                    className="px-4 py-2 bg-accent text-foreground rounded-lg hover:bg-accent/80 transition-all duration-200 flex items-center gap-2"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                    Edit Subject
                                                </button>
                                                <button
                                                    onClick={() => setSelectedQuestionId('new')}
                                                    className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all duration-200 glow-accent flex items-center gap-2"
                                                >
                                                    <Plus className="w-4 h-4" />
                                                    New Question
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid gap-3">
                                        {filteredQuestions.map((question) => (
                                            <button
                                                key={question.id}
                                                onClick={() => setSelectedQuestionId(question.id)}
                                                className="text-left p-4 bg-card/50 backdrop-blur-sm border border-border rounded-xl hover:border-primary/50 hover:shadow-md transition-all duration-200"
                                            >
                                                <div className="flex items-start justify-between gap-4">
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <span className="px-2 py-0.5 bg-secondary text-secondary-foreground text-xs rounded font-mono">
                                                                {question.questionType}
                                                            </span>
                                                            <span className="text-xs text-muted-foreground font-mono">
                                                                {question.id}
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
                                </div>
                            ) : (
                                <div className="text-center py-12">
                                    <p className="text-muted-foreground">
                                        Select a subject from the sidebar to view questions
                                    </p>
                                </div>
                            )}
                        </div>
                    )}
                </main>
            </div>

            {/* Export Dialog */}
            <ExportDialog
                isOpen={showExportDialog}
                onClose={() => setShowExportDialog(false)}
                onExport={handleExport}
                loading={loading}
            />

            {/* Add Folder Dialog */}
            <AddFolderDialog
                isOpen={showAddFolder}
                onClose={() => setShowAddFolder(false)}
                onAdd={handleAddFolder}
            />

            {/* Subject Editor Dialog */}
            {selectedFolder && (
                <SubjectEditorDialog
                    isOpen={showSubjectEditor}
                    subject={editingSubject || undefined}
                    folderPath={selectedFolder}
                    onClose={() => {
                        setShowSubjectEditor(false);
                        setEditingSubject(null);
                    }}
                    onSave={handleSubjectSaved}
                />
            )}
        </div>
    );
}
