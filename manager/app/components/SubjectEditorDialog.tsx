'use client';

import { useState, useEffect } from 'react';
import { X, Save, Plus, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Subject, Topic } from '../types';

interface SubjectEditorDialogProps {
    isOpen: boolean;
    subject?: Subject;
    folderPath: string;
    onClose: () => void;
    onSave: () => void;
}

export function SubjectEditorDialog({
    isOpen,
    subject,
    folderPath,
    onClose,
    onSave,
}: SubjectEditorDialogProps) {
    const [formData, setFormData] = useState<Partial<Subject>>({
        code: '',
        name: '',
        description: '',
        primaryColor: '#5E6AD2',
        secondaryColor: '#4854B0',
        topics: [],
    });

    // Reset form data when subject changes or dialog opens
    useEffect(() => {
        if (isOpen) {
            setFormData(
                subject || {
                    code: '',
                    name: '',
                    description: '',
                    primaryColor: '#5E6AD2',
                    secondaryColor: '#4854B0',
                    topics: [],
                }
            );
        }
    }, [subject, isOpen]);

    async function handleSave() {
        if (!formData.name || !formData.code) {
            alert('Please fill in all required fields');
            return;
        }

        try {
            await fetch('/api/fs', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'saveSubject',
                    folderPath,
                    data: {
                        subjectCode: formData.code,
                        subjectData: {
                            name: formData.name,
                            code: formData.code,
                            description: formData.description,
                            primaryColor: formData.primaryColor,
                            secondaryColor: formData.secondaryColor,
                            topics: formData.topics,
                        },
                        originalTopics: subject?.topics, // Pass original topics for change detection
                    },
                }),
            });

            onSave();
            onClose();
        } catch (error) {
            console.error('Error saving subject:', error);
            alert('Failed to save subject');
        }
    }

    function addTopic() {
        const topicId = prompt('Enter topic ID (e.g., "limits", "derivatives"):');
        if (!topicId) return;

        const topicName = prompt('Enter topic display name:');
        if (!topicName) return;

        setFormData({
            ...formData,
            topics: [...(formData.topics || []), { id: topicId.trim(), name: topicName.trim() }],
        });
    }

    function removeTopic(index: number) {
        setFormData({
            ...formData,
            topics: formData.topics?.filter((_, i) => i !== index),
        });
    }

    function updateTopic(index: number, field: keyof Topic, value: string) {
        const newTopics = [...(formData.topics || [])];
        newTopics[index] = { ...newTopics[index], [field]: value };
        setFormData({ ...formData, topics: newTopics });
    }

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
                        onClick={onClose}
                    />

                    {/* Dialog */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                        className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl max-h-[90vh] overflow-auto z-50"
                    >
                        <div className="bg-card border border-border rounded-2xl shadow-elevated p-6 m-4">
                            {/* Header */}
                            <div className="flex items-start justify-between mb-6">
                                <div>
                                    <h2 className="text-lg font-semibold text-foreground">
                                        {subject ? 'Edit Subject' : 'New Subject'}
                                    </h2>
                                    <p className="text-sm text-muted-foreground mt-0.5">
                                        Configure subject metadata and topics
                                    </p>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="p-2 hover:bg-accent rounded-lg transition-colors"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            {/* Form */}
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-foreground mb-2">
                                            Subject Code *
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.code || ''}
                                            onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                                            placeholder="ma1, dml, aag"
                                            disabled={!!subject}
                                            className="w-full px-4 py-2.5 bg-background border border-input rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all font-mono text-sm disabled:opacity-50"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-foreground mb-2">
                                            Subject Name *
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.name || ''}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            placeholder="Matematická Analýza 1"
                                            className="w-full px-4 py-2.5 bg-background border border-input rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-foreground mb-2">Description</label>
                                    <textarea
                                        value={formData.description || ''}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        placeholder="Brief description of the subject..."
                                        className="w-full px-4 py-2.5 bg-background border border-input rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all resize-none"
                                        rows={2}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-foreground mb-2">
                                            Primary Color
                                        </label>
                                        <div className="flex gap-2">
                                            <input
                                                type="color"
                                                value={formData.primaryColor || '#5E6AD2'}
                                                onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                                                className="w-12 h-10 rounded-lg border border-input cursor-pointer"
                                            />
                                            <input
                                                type="text"
                                                value={formData.primaryColor || ''}
                                                onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                                                className="flex-1 px-4 py-2.5 bg-background border border-input rounded-lg text-foreground font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-foreground mb-2">
                                            Secondary Color
                                        </label>
                                        <div className="flex gap-2">
                                            <input
                                                type="color"
                                                value={formData.secondaryColor || '#4854B0'}
                                                onChange={(e) => setFormData({ ...formData, secondaryColor: e.target.value })}
                                                className="w-12 h-10 rounded-lg border border-input cursor-pointer"
                                            />
                                            <input
                                                type="text"
                                                value={formData.secondaryColor || ''}
                                                onChange={(e) => setFormData({ ...formData, secondaryColor: e.target.value })}
                                                className="flex-1 px-4 py-2.5 bg-background border border-input rounded-lg text-foreground font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Topics */}
                                <div>
                                    <div className="flex items-center justify-between mb-3">
                                        <label className="block text-sm font-medium text-foreground">Topics/Categories</label>
                                        <button
                                            onClick={addTopic}
                                            className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-all duration-200"
                                        >
                                            <Plus className="w-4 h-4" />
                                            Add Topic
                                        </button>
                                    </div>

                                    <div className="space-y-2">
                                        {formData.topics?.map((topic, index) => (
                                            <div key={index} className="flex gap-2 items-start p-3 bg-accent/30 rounded-lg">
                                                <div className="flex-1 grid grid-cols-2 gap-2">
                                                    <input
                                                        type="text"
                                                        value={topic.id}
                                                        onChange={(e) => updateTopic(index, 'id', e.target.value)}
                                                        placeholder="Topic ID"
                                                        className="px-3 py-2 bg-background border border-input rounded-lg text-sm font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                                                    />
                                                    <input
                                                        type="text"
                                                        value={topic.name}
                                                        onChange={(e) => updateTopic(index, 'name', e.target.value)}
                                                        placeholder="Display Name"
                                                        className="px-3 py-2 bg-background border border-input rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                                                    />
                                                </div>
                                                <button
                                                    onClick={() => removeTopic(index)}
                                                    className="p-2 text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ))}

                                        {(!formData.topics || formData.topics.length === 0) && (
                                            <p className="text-sm text-muted-foreground text-center py-4">
                                                No topics yet. Click "Add Topic" to create one.
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex gap-2 justify-end pt-4 border-t border-border">
                                    <button
                                        onClick={onClose}
                                        className="px-4 py-2 text-sm font-medium text-foreground hover:bg-accent rounded-lg transition-all duration-200"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleSave}
                                        disabled={!formData.name || !formData.code}
                                        className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 glow-accent"
                                    >
                                        <Save className="w-4 h-4" />
                                        {subject ? 'Save Changes' : 'Create Subject'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
