'use client';

import { useState, useEffect } from 'react';
import { Subject } from '../types';
import { ArrowLeft, Sparkles, ChevronDown, ChevronRight, FolderOpen } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface UnprocessedBatchViewerProps {
    subject: Subject;
    folderPath: string;
    onBack: () => void;
    onStartBatch: (selectedImages: string[], additionalPrompt: string, forcedTopics: string[]) => void;
}

interface GroupedImages {
    [folder: string]: string[];
}

export function UnprocessedBatchViewer({
    subject,
    folderPath,
    onBack,
    onStartBatch,
}: UnprocessedBatchViewerProps) {
    const [groupedImages, setGroupedImages] = useState<GroupedImages>({});
    const [selectedImages, setSelectedImages] = useState<Set<string>>(new Set());
    const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
    const [additionalPrompt, setAdditionalPrompt] = useState('');
    const [forcedTopics, setForcedTopics] = useState<string[]>([]);
    const [imageUrls, setImageUrls] = useState<Map<string, string>>(new Map());

    useEffect(() => {
        // Group images by folder
        const groups: GroupedImages = {};

        (subject.unprocessedImages || []).forEach((imagePath) => {
            const parts = imagePath.split('/');
            const folder = parts.length > 1 ? parts.slice(0, -1).join('/') : '/';

            if (!groups[folder]) {
                groups[folder] = [];
            }
            groups[folder].push(imagePath);
        });

        setGroupedImages(groups);

        // Expand root folder by default
        setExpandedFolders(new Set(['/']));

        // Select all by default
        setSelectedImages(new Set(subject.unprocessedImages || []));
    }, [subject.unprocessedImages]);

    function toggleFolder(folder: string) {
        const newExpanded = new Set(expandedFolders);
        if (newExpanded.has(folder)) {
            newExpanded.delete(folder);
        } else {
            newExpanded.add(folder);
        }
        setExpandedFolders(newExpanded);
    }

    function toggleImage(imagePath: string) {
        const newSelected = new Set(selectedImages);
        if (newSelected.has(imagePath)) {
            newSelected.delete(imagePath);
        } else {
            newSelected.add(imagePath);
        }
        setSelectedImages(newSelected);
    }

    function toggleFolderSelection(folder: string) {
        const folderImages = groupedImages[folder] || [];
        const allSelected = folderImages.every(img => selectedImages.has(img));
        const newSelected = new Set(selectedImages);

        folderImages.forEach(img => {
            if (allSelected) {
                newSelected.delete(img);
            } else {
                newSelected.add(img);
            }
        });

        setSelectedImages(newSelected);
    }

    function toggleTopic(topicId: string) {
        if (forcedTopics.includes(topicId)) {
            setForcedTopics(forcedTopics.filter(t => t !== topicId));
        } else {
            setForcedTopics([...forcedTopics, topicId]);
        }
    }

    function handleStartProcessing() {
        if (selectedImages.size === 0) {
            alert('Please select at least one image');
            return;
        }
        onStartBatch(Array.from(selectedImages), additionalPrompt, forcedTopics);
    }

    async function loadImagePreview(imagePath: string) {
        if (imageUrls.has(imagePath)) return;

        const fullPath = `${folderPath}/${subject.code}/unprocessed/${imagePath}`;
        try {
            const res = await fetch(`/api/fs?action=readImage&path=${encodeURIComponent(fullPath)}`);
            if (res.ok) {
                const blob = await res.blob();
                const url = URL.createObjectURL(blob);
                setImageUrls(new Map(imageUrls.set(imagePath, url)));
            }
        } catch (error) {
            console.error('Error loading image:', error);
        }
    }

    const sortedFolders = Object.keys(groupedImages).sort();

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
                            <h2 className="text-lg font-semibold">Batch Process Unprocessed Images</h2>
                            <p className="text-sm text-muted-foreground">
                                {selectedImages.size} of {subject.unprocessedImages?.length || 0} selected
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={handleStartProcessing}
                        disabled={selectedImages.size === 0}
                        className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all duration-200 flex items-center gap-2 glow-accent disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Sparkles className="w-4 h-4" />
                        Start AI Processing ({selectedImages.size})
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-auto px-6 py-6">
                <div className="max-w-6xl mx-auto space-y-6">
                    {/* Configuration Section */}
                    <div className="p-4 bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 rounded-xl space-y-4">
                        <h3 className="text-sm font-semibold text-foreground">Processing Options</h3>

                        {/* Additional Prompt */}
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-foreground">
                                Additional Prompt (optional)
                            </label>
                            <textarea
                                value={additionalPrompt}
                                onChange={(e) => setAdditionalPrompt(e.target.value)}
                                className="w-full px-4 py-3 bg-background border border-input rounded-lg h-24 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all resize-none"
                                placeholder="Add instructions for AI (e.g., 'Pay extra attention to calculus notation' or 'These are probability questions')"
                            />
                        </div>

                        {/* Force Categories */}
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-foreground">
                                Force Assign Categories (will be added to AI suggestions)
                            </label>
                            <div className="flex flex-wrap gap-2">
                                {subject.topics?.map((topic) => (
                                    <button
                                        key={topic.id}
                                        type="button"
                                        onClick={() => toggleTopic(topic.id)}
                                        className={`px-3 py-1.5 text-sm rounded-lg border transition-all duration-200 ${forcedTopics.includes(topic.id)
                                            ? 'bg-primary text-primary-foreground border-primary'
                                            : 'bg-background text-foreground border-input hover:bg-accent'
                                            }`}
                                    >
                                        {topic.name}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Images by Folder */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-semibold text-foreground">Select Images to Process</h3>

                        {sortedFolders.map((folder) => {
                            const images = groupedImages[folder];
                            const isExpanded = expandedFolders.has(folder);
                            const selectedCount = images.filter(img => selectedImages.has(img)).length;
                            const allSelected = selectedCount === images.length;

                            return (
                                <div key={folder} className="border border-border rounded-lg overflow-hidden">
                                    {/* Folder Header */}
                                    <div className="bg-card p-3 flex items-center gap-3">
                                        <button
                                            onClick={() => toggleFolder(folder)}
                                            className="p-1 hover:bg-accent rounded transition-colors"
                                        >
                                            {isExpanded ? (
                                                <ChevronDown className="w-4 h-4" />
                                            ) : (
                                                <ChevronRight className="w-4 h-4" />
                                            )}
                                        </button>

                                        <input
                                            type="checkbox"
                                            checked={allSelected}
                                            onChange={() => toggleFolderSelection(folder)}
                                            className="h-4 w-4 rounded border-input accent-primary cursor-pointer"
                                        />

                                        <FolderOpen className="w-4 h-4 text-primary" />

                                        <span className="flex-1 text-sm font-medium">
                                            {folder === '/' ? 'Root' : folder}
                                        </span>

                                        <span className="text-xs text-muted-foreground">
                                            {selectedCount}/{images.length} selected
                                        </span>
                                    </div>

                                    {/* Images */}
                                    <AnimatePresence>
                                        {isExpanded && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: 'auto', opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                transition={{ duration: 0.2 }}
                                                className="overflow-hidden"
                                            >
                                                <div className="p-3 bg-background/50 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                                                    {images.map((imagePath) => {
                                                        const fileName = imagePath.split('/').pop() || imagePath;
                                                        const isSelected = selectedImages.has(imagePath);

                                                        return (
                                                            <div
                                                                key={imagePath}
                                                                className={`relative border rounded-lg overflow-hidden transition-all ${isSelected
                                                                    ? 'border-primary ring-2 ring-primary/20'
                                                                    : 'border-border hover:border-primary/50'
                                                                    }`}
                                                                onMouseEnter={() => loadImagePreview(imagePath)}
                                                            >
                                                                <div
                                                                    onClick={() => toggleImage(imagePath)}
                                                                    className="cursor-pointer"
                                                                >
                                                                    {/* Checkbox */}
                                                                    <div className="absolute top-2 left-2 z-10">
                                                                        <input
                                                                            type="checkbox"
                                                                            checked={isSelected}
                                                                            onChange={() => toggleImage(imagePath)}
                                                                            className="h-5 w-5 rounded border-2 border-white shadow-lg accent-primary cursor-pointer"
                                                                            onClick={(e) => e.stopPropagation()}
                                                                        />
                                                                    </div>

                                                                    {/* Image Preview */}
                                                                    <div className="aspect-square bg-muted flex items-center justify-center">
                                                                        {imageUrls.has(imagePath) ? (
                                                                            <img
                                                                                src={imageUrls.get(imagePath)}
                                                                                alt={fileName}
                                                                                className="w-full h-full object-cover"
                                                                            />
                                                                        ) : (
                                                                            <span className="text-xs text-muted-foreground">
                                                                                Hover to preview
                                                                            </span>
                                                                        )}
                                                                    </div>

                                                                    {/* File Name */}
                                                                    <div className="p-2 bg-card">
                                                                        <p className="text-xs font-mono truncate">
                                                                            {fileName}
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}
