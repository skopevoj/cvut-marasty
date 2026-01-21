'use client';

import { useState } from 'react';
import { Subject, Question, Answer } from '../types';

interface QuestionEditorProps {
    subject: Subject;
    folderPath: string;
    onBack: () => void;
}

export function QuestionEditor({ subject, folderPath, onBack }: QuestionEditorProps) {
    const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
    const [editingQuestion, setEditingQuestion] = useState<Partial<Question>>({});
    const [isEditing, setIsEditing] = useState(false);

    function startNewQuestion() {
        const newId = Math.floor(Math.random() * 90000000 + 10000000).toString();
        setEditingQuestion({
            id: newId,
            question: '',
            questionType: 'multichoice',
            topics: [],
            answers: [{ text: '', isCorrect: false }],
        });
        setIsEditing(true);
    }

    function startEditQuestion(question: Question) {
        setEditingQuestion(question);
        setIsEditing(true);
    }

    async function handleSaveQuestion() {
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

            setIsEditing(false);
            setEditingQuestion({});
            onBack();
        } catch (error) {
            console.error('Error saving question:', error);
            alert('Failed to save question');
        }
    }

    async function handleDeleteQuestion(questionId: string) {
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
                        questionId,
                    },
                }),
            });
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

    async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file || !editingQuestion.id) return;

        const formData = new FormData();
        formData.append('file', file);
        formData.append('subjectCode', subject.code);
        formData.append('questionId', editingQuestion.id);
        formData.append('folderPath', folderPath);

        try {
            await fetch('/api/upload', {
                method: 'POST',
                body: formData,
            });
            alert('Image uploaded successfully');
        } catch (error) {
            console.error('Error uploading image:', error);
        }
    }

    if (isEditing) {
        return (
            <div className="bg-card rounded-lg border shadow-sm p-6">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-foreground">
                        {selectedQuestion ? 'Edit Question' : 'New Question'}
                    </h2>
                    <div className="space-x-2">
                        <button
                            onClick={() => {
                                setIsEditing(false);
                                setEditingQuestion({});
                            }}
                            className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSaveQuestion}
                            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                        >
                            Save
                        </button>
                    </div>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-2 text-foreground">Question ID</label>
                        <input
                            type="text"
                            value={editingQuestion.id || ''}
                            onChange={(e) => setEditingQuestion({ ...editingQuestion, id: e.target.value })}
                            className="w-full px-3 py-2 bg-background border border-input rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                            placeholder="Question ID"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2 text-foreground">Question Type</label>
                        <select
                            value={editingQuestion.questionType || 'multichoice'}
                            onChange={(e) =>
                                setEditingQuestion({
                                    ...editingQuestion,
                                    questionType: e.target.value as any,
                                })
                            }
                            className="w-full px-3 py-2 bg-background border border-input rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                        >
                            <option value="multichoice">Multiple Choice</option>
                            <option value="open">Open</option>
                            <option value="truefalse">True/False</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2 text-foreground">Question Text</label>
                        <textarea
                            value={editingQuestion.question || ''}
                            onChange={(e) =>
                                setEditingQuestion({ ...editingQuestion, question: e.target.value })
                            }
                            className="w-full px-3 py-2 bg-background border border-input rounded-lg h-32 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                            placeholder="Enter question text..."
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2 text-foreground">Original Text (optional)</label>
                        <textarea
                            value={editingQuestion.originalText || ''}
                            onChange={(e) =>
                                setEditingQuestion({ ...editingQuestion, originalText: e.target.value })
                            }
                            className="w-full px-3 py-2 bg-background border border-input rounded-lg h-24 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                            placeholder="Original unedited text..."
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2 text-foreground">Topics</label>
                        <input
                            type="text"
                            value={(editingQuestion.topics || []).join(', ')}
                            onChange={(e) =>
                                setEditingQuestion({
                                    ...editingQuestion,
                                    topics: e.target.value.split(',').map((t) => t.trim()),
                                })
                            }
                            className="w-full px-3 py-2 bg-background border border-input rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                            placeholder="topic1, topic2, topic3"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                            Available: {subject.topics?.map(t => t.id).join(', ') || 'none'}
                        </p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2 text-foreground">Image</label>
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageUpload}
                            className="w-full px-3 py-2 bg-background border border-input rounded-lg text-foreground file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-primary file:text-primary-foreground file:cursor-pointer hover:file:bg-primary/90"
                        />
                    </div>

                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <label className="block text-sm font-medium text-foreground">Answers</label>
                            <button
                                onClick={addAnswer}
                                className="px-3 py-1 bg-primary text-primary-foreground text-sm rounded hover:bg-primary/90 transition-colors"
                            >
                                Add Answer
                            </button>
                        </div>

                        <div className="space-y-3">
                            {(editingQuestion.answers || []).map((answer, index) => (
                                <div key={index} className="flex gap-2 items-start p-3 bg-accent/50 rounded-lg border">
                                    <input
                                        type="checkbox"
                                        checked={answer.isCorrect}
                                        onChange={(e) => updateAnswer(index, 'isCorrect', e.target.checked)}
                                        className="mt-1 h-4 w-4 rounded border-input"
                                    />
                                    <div className="flex-1">
                                        <input
                                            type="text"
                                            value={answer.text}
                                            onChange={(e) => updateAnswer(index, 'text', e.target.value)}
                                            className="w-full px-3 py-2 bg-background border border-input rounded mb-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                                            placeholder="Answer text"
                                        />
                                        <input
                                            type="text"
                                            value={answer.explanation || ''}
                                            onChange={(e) => updateAnswer(index, 'explanation', e.target.value)}
                                            className="w-full px-3 py-2 bg-background border border-input rounded text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                                            placeholder="Explanation (optional)"
                                        />
                                    </div>
                                    <button
                                        onClick={() => removeAnswer(index)}
                                        className="px-3 py-2 bg-destructive text-destructive-foreground rounded hover:bg-destructive/90 transition-colors"
                                    >
                                        Remove
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                    <button
                        onClick={onBack}
                        className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-colors"
                    >
                        ← Back
                    </button>
                    <div>
                        <h2 className="text-xl font-bold text-foreground">{subject.name}</h2>
                        <p className="text-sm text-muted-foreground font-mono">{subject.code}</p>
                    </div>
                </div>
                <button
                    onClick={startNewQuestion}
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                >
                    Add Question
                </button>
            </div>

            {subject.questions && subject.questions.length === 0 ? (
                <div className="text-center py-12 bg-card rounded-lg border">
                    <p className="text-muted-foreground">No questions yet. Add your first question!</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {subject.questions?.map((question) => (
                        <div
                            key={question.id}
                            className="bg-card rounded-lg border shadow-sm p-4 hover:shadow-md hover:border-primary/50 transition-all"
                        >
                            <div className="flex justify-between items-start">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="px-2 py-1 bg-secondary text-secondary-foreground text-xs rounded font-mono">
                                            {question.questionType}
                                        </span>
                                        <span className="text-xs text-muted-foreground font-mono">ID: {question.id}</span>
                                        {question.images && question.images.length > 0 && (
                                            <span className="px-2 py-1 bg-primary/10 text-primary text-xs rounded">
                                                📷 {question.images.length}
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-sm mb-2 text-foreground">{question.question}</p>
                                    {question.topics && question.topics.length > 0 && (
                                        <div className="flex gap-1 flex-wrap">
                                            {question.topics.map((topic) => (
                                                <span
                                                    key={topic}
                                                    className="px-2 py-1 bg-accent text-accent-foreground text-xs rounded"
                                                >
                                                    {topic}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => startEditQuestion(question)}
                                        className="px-3 py-1 bg-primary/10 text-primary rounded hover:bg-primary/20 transition-colors"
                                    >
                                        Edit
                                    </button>
                                    <button
                                        onClick={() => handleDeleteQuestion(question.id)}
                                        className="px-3 py-1 bg-destructive/10 text-destructive rounded hover:bg-destructive/20 transition-colors"
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
