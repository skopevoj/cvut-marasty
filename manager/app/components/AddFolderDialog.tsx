'use client';

import { useState } from 'react';
import { X, FolderPlus, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface AddFolderDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onAdd: (path: string) => void;
}

export function AddFolderDialog({ isOpen, onClose, onAdd }: AddFolderDialogProps) {
    const [folderPath, setFolderPath] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (folderPath.trim()) {
            onAdd(folderPath.trim());
            setFolderPath('');
            onClose();
        }
    };

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
                        className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg z-50"
                    >
                        <div className="bg-card border border-border rounded-2xl shadow-elevated p-6 m-4">
                            {/* Header */}
                            <div className="flex items-start justify-between mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                                        <FolderPlus className="w-5 h-5 text-primary" />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-semibold text-foreground">Add Questions Folder</h2>
                                        <p className="text-sm text-muted-foreground mt-0.5">
                                            Enter the absolute path to your questions directory
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="p-2 hover:bg-accent rounded-lg transition-colors"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            {/* Form */}
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label htmlFor="folder-path" className="block text-sm font-medium text-foreground mb-2">
                                        Folder Path
                                    </label>
                                    <input
                                        id="folder-path"
                                        type="text"
                                        value={folderPath}
                                        onChange={(e) => setFolderPath(e.target.value)}
                                        placeholder="/Users/username/questions"
                                        className="w-full px-4 py-3 bg-background border border-input rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all font-mono text-sm"
                                        autoFocus
                                    />
                                    <p className="text-xs text-muted-foreground mt-2">
                                        Example: <span className="font-mono">/Users/vojta/Documents/cvut-marasty/questions</span>
                                    </p>
                                </div>

                                {/* Actions */}
                                <div className="flex gap-2 justify-end pt-2">
                                    <button
                                        type="button"
                                        onClick={onClose}
                                        className="px-4 py-2 text-sm font-medium text-foreground hover:bg-accent rounded-lg transition-all duration-200"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={!folderPath.trim()}
                                        className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 glow-accent"
                                    >
                                        <Check className="w-4 h-4" />
                                        Add Folder
                                    </button>
                                </div>
                            </form>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
