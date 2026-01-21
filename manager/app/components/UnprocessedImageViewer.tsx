'use client';

import { useState, useEffect } from 'react';
import { Subject } from '../types';
import { ArrowLeft, Trash2, Sparkles } from 'lucide-react';

interface UnprocessedImageViewerProps {
    subject: Subject;
    imageName: string;
    folderPath: string;
    onBack: () => void;
    onRefresh: () => void;
    onBatchProcess?: () => void;
}

export function UnprocessedImageViewer({
    subject,
    imageName,
    folderPath,
    onBack,
    onRefresh,
    onBatchProcess,
}: UnprocessedImageViewerProps) {
    const [imageUrl, setImageUrl] = useState<string | null>(null);

    useEffect(() => {
        loadImage();
    }, [imageName]);

    async function loadImage() {
        const imagePath = `${folderPath}/${subject.code}/unprocessed/${imageName}`;
        try {
            const res = await fetch(`/api/fs?action=readImage&path=${encodeURIComponent(imagePath)}`);
            if (res.ok) {
                const blob = await res.blob();
                setImageUrl(URL.createObjectURL(blob));
            }
        } catch (error) {
            console.error('Error loading image:', error);
        }
    }

    async function handleDelete() {
        if (!confirm(`Delete ${imageName}?`)) return;

        try {
            const imagePath = `${folderPath}/${subject.code}/unprocessed/${imageName}`;
            await fetch('/api/fs', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'deleteFile',
                    filePath: imagePath,
                }),
            });
            onRefresh();
            onBack();
        } catch (error) {
            console.error('Error deleting image:', error);
            alert('Failed to delete image');
        }
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
                            <h2 className="text-lg font-semibold">Unprocessed Image</h2>
                            <p className="text-sm text-muted-foreground font-mono">{imageName}</p>
                        </div>
                    </div>

                    <div className="flex gap-2">
                        {onBatchProcess && subject.unprocessedImages && subject.unprocessedImages.length > 1 && (
                            <button
                                onClick={onBatchProcess}
                                className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all duration-200 flex items-center gap-2 glow-accent"
                            >
                                <Sparkles className="w-4 h-4" />
                                Parse All with AI ({subject.unprocessedImages.length})
                            </button>
                        )}
                        <button
                            onClick={handleDelete}
                            className="px-4 py-2 text-sm font-medium text-destructive hover:bg-destructive/10 rounded-lg transition-all duration-200 flex items-center gap-2"
                        >
                            <Trash2 className="w-4 h-4" />
                            Delete
                        </button>
                    </div>
                </div>
            </div>

            {/* Image Display */}
            <div className="flex-1 overflow-auto p-6">
                <div className="max-w-5xl mx-auto">
                    {imageUrl ? (
                        <div className="bg-card border border-border rounded-xl overflow-hidden">
                            <img
                                src={imageUrl}
                                alt={imageName}
                                className="w-full h-auto"
                            />
                        </div>
                    ) : (
                        <div className="flex items-center justify-center h-64">
                            <p className="text-muted-foreground">Loading image...</p>
                        </div>
                    )}

                    <div className="mt-6 p-4 bg-card border border-border rounded-xl">
                        <h3 className="text-sm font-semibold mb-2">About Unprocessed Images</h3>
                        <p className="text-sm text-muted-foreground">
                            These images are questions that haven't been converted to the question format yet.
                            You can view them here and manually create questions based on them, or delete them
                            once processed.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
