'use client';

import { useState, useEffect, useRef } from 'react';
import { Subject, Question, Answer } from '../types';
import { ArrowLeft, Save, Trash2, Plus, X, Image as ImageIcon, Upload, Sparkles } from 'lucide-react';
import { LatexRenderer } from './LatexRenderer';
import { motion } from 'framer-motion';

interface QuestionEditorProps {
    subject: Subject;
    question?: Question;
    folderPath: string;
    onBack: () => void;
    onRefresh: () => void;
}

export function QuestionEditor({
    subject,
    question,
    folderPath,
    onBack,
    onRefresh,
}: QuestionEditorProps) {
    const [editingQuestion, setEditingQuestion] = useState<Partial<Question>>(
        question || {
            id: Date.now().toString(),
            question: '',
            questionType: 'multichoice',
            topics: [],
            answers: [{ text: '', isCorrect: false }],
        }
    );
    const [questionImage, setQuestionImage] = useState<string | null>(null);
    const [quizImage, setQuizImage] = useState<string | null>(null);
    const [aiParsing, setAiParsing] = useState(false);
    const questionTextRef = useRef<HTMLTextAreaElement>(null);
    const questionImageAreaRef = useRef<HTMLDivElement>(null);
    const quizImageAreaRef = useRef<HTMLDivElement>(null);
    const aiParseAreaRef = useRef<HTMLDivElement>(null);

    // Reset editing question when question prop changes
    useEffect(() => {
        setEditingQuestion(
            question || {
                id: Date.now().toString(),
                question: '',
                questionType: 'multichoice',
                topics: [],
                answers: [{ text: '', isCorrect: false }],
            }
        );
    }, [question]);

    // Handle paste events for image areas
    useEffect(() => {
        const handlePaste = (e: ClipboardEvent, type: 'image' | 'quizImage' | 'aiParse') => {
            const items = e.clipboardData?.items;
            if (!items) return;

            for (let i = 0; i < items.length; i++) {
                const item = items[i];
                if (item.type.startsWith('image/')) {
                    e.preventDefault();
                    const file = item.getAsFile();
                    if (file) {
                        if (type === 'aiParse') {
                            handleAIParse(file);
                        } else {
                            handleImageFile(file, type);
                        }
                    }
                    break;
                }
            }
        };

        const questionImageArea = questionImageAreaRef.current;
        const quizImageArea = quizImageAreaRef.current;
        const aiParseArea = aiParseAreaRef.current;

        const questionImageHandler = (e: ClipboardEvent) => handlePaste(e, 'image');
        const quizImageHandler = (e: ClipboardEvent) => handlePaste(e, 'quizImage');
        const aiParseHandler = (e: ClipboardEvent) => handlePaste(e, 'aiParse');

        if (questionImageArea) {
            questionImageArea.addEventListener('paste', questionImageHandler);
        }
        if (quizImageArea) {
            quizImageArea.addEventListener('paste', quizImageHandler);
        }
        if (aiParseArea) {
            aiParseArea.addEventListener('paste', aiParseHandler);
        }

        return () => {
            if (questionImageArea) {
                questionImageArea.removeEventListener('paste', questionImageHandler);
            }
            if (quizImageArea) {
                quizImageArea.removeEventListener('paste', quizImageHandler);
            }
            if (aiParseArea) {
                aiParseArea.removeEventListener('paste', aiParseHandler);
            }
        };
    }, [editingQuestion.id]);

    // Load existing images
    useEffect(() => {
        if (editingQuestion.id) {
            loadImages();
        }
    }, [editingQuestion.id]);

    async function loadImages() {
        if (!editingQuestion.id) return;

        try {
            // Try to load both images
            const imagePath = `${folderPath}/${subject.code}/questions/${editingQuestion.id}/image.png`;
            const quizImagePath = `${folderPath}/${subject.code}/questions/${editingQuestion.id}/quizImage.png`;

            // Check if images exist by trying to fetch them
            try {
                const res1 = await fetch(`/api/fs?action=readImage&path=${encodeURIComponent(imagePath)}`);
                if (res1.ok) {
                    const blob = await res1.blob();
                    setQuestionImage(URL.createObjectURL(blob));
                }
            } catch (e) {
                // Image doesn't exist
            }

            try {
                const res2 = await fetch(`/api/fs?action=readImage&path=${encodeURIComponent(quizImagePath)}`);
                if (res2.ok) {
                    const blob = await res2.blob();
                    setQuizImage(URL.createObjectURL(blob));
                }
            } catch (e) {
                // Image doesn't exist
            }
        } catch (error) {
            console.error('Error loading images:', error);
        }
    }

    async function handleImageFile(file: File, type: 'image' | 'quizImage') {
        if (!editingQuestion.id) {
            alert('Please set a question ID first');
            return;
        }

        const formData = new FormData();
        formData.append('file', file);
        formData.append('subjectCode', subject.code);
        formData.append('questionId', editingQuestion.id);
        formData.append('folderPath', folderPath);
        formData.append('imageType', type);

        try {
            await fetch('/api/upload', {
                method: 'POST',
                body: formData,
            });
            loadImages(); // Reload images
        } catch (error) {
            console.error('Error uploading image:', error);
            alert('Failed to upload image');
        }
    }

    async function handleAIParse(imageFile: File) {
        setAiParsing(true);
        try {
            // Convert image to base64
            const reader = new FileReader();
            reader.readAsDataURL(imageFile);

            const imageData = await new Promise<string>((resolve) => {
                reader.onloadend = () => resolve(reader.result as string);
            });

            // Call AI API
            const response = await fetch('/api/ai/parse', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    imageData,
                    availableTopics: subject.topics || [],
                }),
            });

            if (!response.ok) {
                throw new Error('AI parsing failed');
            }

            const parsed = await response.json();

            // Update question with parsed data
            setEditingQuestion({
                ...editingQuestion,
                questionType: parsed.questionType,
                question: parsed.question,
                topics: parsed.topics || [],
                answers: parsed.answers || [{ text: '', isCorrect: false }],
                originalText: parsed.originalText,
            });

            // Upload image as quizImage
            await handleImageFile(imageFile, 'quizImage');

            alert('Question parsed successfully! Please review and save.');
        } catch (error) {
            console.error('Error parsing with AI:', error);
            alert('Failed to parse question with AI');
        } finally {
            setAiParsing(false);
        }
    }

    async function handleSave() {
        if (!editingQuestion.question || !editingQuestion.id) {
            alert('Please fill in all required fields');
            return;
        }

        try {
            await fetch('/api/fs', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'saveQuestion',
                    folderPath,
                    data: {
                        subjectCode: subject.code,
                        questionId: editingQuestion.id,
                        questionData: {
                            question: editingQuestion.question,
                            questionType: editingQuestion.questionType,
                            topics: editingQuestion.topics,
                            answers: editingQuestion.answers,
                            originalText: editingQuestion.originalText,
                        },
                    },
                }),
            });

            onRefresh();
            onBack();
        } catch (error) {
            console.error('Error saving question:', error);
            alert('Failed to save question');
        }
    }

    async function handleDelete() {
        if (!confirm('Delete this question?')) return;

        try {
            await fetch('/api/fs', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'deleteQuestion',
                    folderPath,
                    data: {
                        subjectCode: subject.code,
                        questionId: editingQuestion.id,
                    },
                }),
            });
            onRefresh();
            onBack();
        } catch (error) {
            console.error('Error deleting question:', error);
        }
    }

    function addAnswer() {
        setEditingQuestion({
            ...editingQuestion,
            answers: [...(editingQuestion.answers || []), { text: '', isCorrect: false }],
        });
    }

    function updateAnswer(index: number, field: keyof Answer, value: any) {
        const newAnswers = [...(editingQuestion.answers || [])];
        newAnswers[index] = { ...newAnswers[index], [field]: value };
        setEditingQuestion({ ...editingQuestion, answers: newAnswers });
    }

    function removeAnswer(index: number) {
        const newAnswers = (editingQuestion.answers || []).filter((_, i) => i !== index);
        setEditingQuestion({ ...editingQuestion, answers: newAnswers });
    }

    async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'quizImage') {
        const file = e.target.files?.[0];
        if (!file) return;
        handleImageFile(file, type);
    }

    function toggleTopic(topicId: string) {
        const current = editingQuestion.topics || [];
        const newTopics = current.includes(topicId)
            ? current.filter(t => t !== topicId)
            : [...current, topicId];
        setEditingQuestion({ ...editingQuestion, topics: newTopics });
    }

    return (
        <div className="h-full flex flex-col">
            {/* Header */}
            <div className="flex-shrink-0 border-b border-border bg-card/30 backdrop-blur-sm px-6 py-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={onBack}
                            className="p-2 hover:bg-accent rounded-lg transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <div>
                            <h2 className="text-lg font-semibold">
                                {question ? 'Edit Question' : 'New Question'}
                            </h2>
                            <p className="text-sm text-muted-foreground font-mono">{editingQuestion.id}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {question && (
                            <button
                                onClick={handleDelete}
                                className="px-4 py-2 text-sm font-medium text-destructive hover:bg-destructive/10 rounded-lg transition-all duration-200 flex items-center gap-2"
                            >
                                <Trash2 className="w-4 h-4" />
                                Delete
                            </button>
                        )}
                        <button
                            onClick={handleSave}
                            className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all duration-200 flex items-center gap-2 glow-accent"
                        >
                            <Save className="w-4 h-4" />
                            Save
                        </button>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-auto px-6 py-6">
                <div className="max-w-4xl mx-auto space-y-6">
                    {/* AI Parse Section */}
                    {!question && (
                        <div
                            ref={aiParseAreaRef}
                            tabIndex={0}
                            className="p-4 bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50"
                        >
                            <div className="flex items-start gap-4">
                                <Sparkles className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                                <div className="flex-1">
                                    <h3 className="text-sm font-semibold text-foreground mb-1">
                                        AI-Powered Question Parsing
                                    </h3>
                                    <p className="text-xs text-muted-foreground mb-3">
                                        Upload an image or <kbd className="px-1.5 py-0.5 text-xs bg-background border border-border rounded">Cmd/Ctrl+V</kbd> to paste from clipboard. AI will extract the content automatically.
                                    </p>
                                    <div className="relative">
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={(e) => {
                                                const file = e.target.files?.[0];
                                                if (file) handleAIParse(file);
                                            }}
                                            className="hidden"
                                            id="ai-parse-upload"
                                            disabled={aiParsing}
                                        />
                                        <label
                                            htmlFor="ai-parse-upload"
                                            className={`flex items-center justify-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 cursor-pointer transition-all text-sm font-medium ${aiParsing ? 'opacity-50 cursor-not-allowed' : ''
                                                }`}
                                        >
                                            {aiParsing ? (
                                                <>
                                                    <Sparkles className="w-4 h-4 animate-spin" />
                                                    Parsing with AI...
                                                </>
                                            ) : (
                                                <>
                                                    <Sparkles className="w-4 h-4" />
                                                    Parse Question from Image
                                                </>
                                            )}
                                        </label>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Question ID */}
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-foreground">Question ID</label>
                        <input
                            type="text"
                            value={editingQuestion.id || ''}
                            onChange={(e) => setEditingQuestion({ ...editingQuestion, id: e.target.value })}
                            className="w-full px-4 py-2.5 bg-background border border-input rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all font-mono"
                            placeholder="Question ID"
                        />
                    </div>

                    {/* Question Type */}
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-foreground">Question Type</label>
                        <select
                            value={editingQuestion.questionType || 'multichoice'}
                            onChange={(e) =>
                                setEditingQuestion({
                                    ...editingQuestion,
                                    questionType: e.target.value as any,
                                })
                            }
                            className="w-full px-4 py-2.5 bg-background border border-input rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                        >
                            <option value="multichoice">Multiple Choice (includes True/False)</option>
                            <option value="open">Open</option>
                        </select>
                    </div>

                    {/* Question Text */}
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-foreground">Question Text</label>
                        <textarea
                            value={editingQuestion.question || ''}
                            onChange={(e) =>
                                setEditingQuestion({ ...editingQuestion, question: e.target.value })
                            }
                            className="w-full px-4 py-3 bg-background border border-input rounded-lg h-32 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all resize-none"
                            placeholder="Enter question text (LaTeX supported: use $ for inline, $$ for display)"
                        />
                        {editingQuestion.question && (
                            <div className="p-4 bg-card border border-border rounded-lg">
                                <p className="text-xs text-muted-foreground mb-2">Preview:</p>
                                <LatexRenderer content={editingQuestion.question} />
                            </div>
                        )}
                    </div>

                    {/* Original Text */}
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-foreground">
                            Original Text (optional)
                        </label>
                        <textarea
                            value={editingQuestion.originalText || ''}
                            onChange={(e) =>
                                setEditingQuestion({ ...editingQuestion, originalText: e.target.value })
                            }
                            className="w-full px-4 py-3 bg-background border border-input rounded-lg h-24 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all resize-none"
                            placeholder="Original unedited text from source..."
                        />
                    </div>

                    {/* Topics */}
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-foreground">Topics/Categories</label>
                        <div className="flex flex-wrap gap-2">
                            {subject.topics?.map((topic) => (
                                <button
                                    key={topic.id}
                                    type="button"
                                    onClick={() => toggleTopic(topic.id)}
                                    className={`px-3 py-1.5 text-sm rounded-lg border transition-all duration-200 ${(editingQuestion.topics || []).includes(topic.id)
                                        ? 'bg-primary text-primary-foreground border-primary'
                                        : 'bg-background text-foreground border-input hover:bg-accent'
                                        }`}
                                >
                                    {topic.name}
                                </button>
                            ))}
                        </div>
                        {(!subject.topics || subject.topics.length === 0) && (
                            <p className="text-sm text-muted-foreground">
                                No topics defined. Edit the subject to add topics.
                            </p>
                        )}
                    </div>

                    {/* Images */}
                    <div className="space-y-4">
                        <label className="block text-sm font-medium text-foreground">Images</label>

                        {/* Question Image */}
                        <div
                            ref={questionImageAreaRef}
                            tabIndex={0}
                            className="space-y-2 p-3 bg-card/50 border border-dashed border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                        >
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-muted-foreground flex items-center gap-2">
                                    Question Image (image.png)
                                    <span className="text-xs opacity-70">
                                        • Click to focus, then <kbd className="px-1 py-0.5 bg-background border border-border rounded text-[10px]">Cmd/Ctrl+V</kbd>
                                    </span>
                                </span>
                                <div className="relative">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => handleImageUpload(e, 'image')}
                                        className="hidden"
                                        id="question-image-upload"
                                    />
                                    <label
                                        htmlFor="question-image-upload"
                                        className="flex items-center gap-2 px-3 py-1.5 text-sm bg-background border border-input rounded-lg text-foreground hover:bg-accent cursor-pointer transition-all"
                                    >
                                        <Upload className="w-4 h-4" />
                                        Select File
                                    </label>
                                </div>
                            </div>
                            {questionImage && (
                                <div className="relative border border-border rounded-lg overflow-hidden">
                                    <img src={questionImage} alt="Question" className="w-full h-auto" />
                                </div>
                            )}
                        </div>

                        {/* Quiz Image */}
                        <div
                            ref={quizImageAreaRef}
                            tabIndex={0}
                            className="space-y-2 p-3 bg-card/50 border border-dashed border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                        >
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-muted-foreground flex items-center gap-2">
                                    Quiz Image (quizImage.png)
                                    <span className="text-xs opacity-70">
                                        • Click to focus, then <kbd className="px-1 py-0.5 bg-background border border-border rounded text-[10px]">Cmd/Ctrl+V</kbd>
                                    </span>
                                </span>
                                <div className="relative">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => handleImageUpload(e, 'quizImage')}
                                        className="hidden"
                                        id="quiz-image-upload"
                                    />
                                    <label
                                        htmlFor="quiz-image-upload"
                                        className="flex items-center gap-2 px-3 py-1.5 text-sm bg-background border border-input rounded-lg text-foreground hover:bg-accent cursor-pointer transition-all"
                                    >
                                        <Upload className="w-4 h-4" />
                                        Select File
                                    </label>
                                </div>
                            </div>
                            {quizImage && (
                                <div className="relative border border-border rounded-lg overflow-hidden">
                                    <img src={quizImage} alt="Quiz" className="w-full h-auto" />
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Answers */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <label className="block text-sm font-medium text-foreground">Answers</label>
                            <button
                                onClick={addAnswer}
                                className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-all duration-200"
                            >
                                <Plus className="w-4 h-4" />
                                Add Answer
                            </button>
                        </div>

                        <div className="space-y-3">
                            {(editingQuestion.answers || []).map((answer, index) => (
                                <motion.div
                                    key={index}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="p-4 bg-card border border-border rounded-xl space-y-3"
                                >
                                    <div className="flex items-start gap-3">
                                        <input
                                            type="checkbox"
                                            checked={answer.isCorrect}
                                            onChange={(e) => updateAnswer(index, 'isCorrect', e.target.checked)}
                                            className="mt-1 h-4 w-4 rounded border-input accent-primary"
                                        />
                                        <div className="flex-1 space-y-2">
                                            <textarea
                                                value={answer.text}
                                                onChange={(e) => updateAnswer(index, 'text', e.target.value)}
                                                className="w-full px-3 py-2 bg-background border border-input rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all resize-none"
                                                placeholder="Answer text (LaTeX supported)"
                                                rows={2}
                                            />
                                            {answer.text && (
                                                <div className="p-3 bg-background/50 rounded-lg">
                                                    <LatexRenderer content={answer.text} />
                                                </div>
                                            )}
                                            <input
                                                type="text"
                                                value={answer.explanation || ''}
                                                onChange={(e) => updateAnswer(index, 'explanation', e.target.value)}
                                                className="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                                                placeholder="Explanation (optional)"
                                            />
                                        </div>
                                        <button
                                            onClick={() => removeAnswer(index)}
                                            className="p-2 text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
