'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { X, Download, ImageIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ExportDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onExport: (quality: number) => void;
    loading: boolean;
}

function formatBytes(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function ExportDialog({ isOpen, onClose, onExport, loading }: ExportDialogProps) {
    const [quality, setQuality] = useState(80);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [originalSize, setOriginalSize] = useState<number>(0);
    const [compressedSize, setCompressedSize] = useState<number>(0);
    const [imageLoaded, setImageLoaded] = useState(false);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const imgRef = useRef<HTMLImageElement | null>(null);
    const prevPreviewUrl = useRef<string | null>(null);

    // Load the sample image once
    useEffect(() => {
        if (!isOpen) return;
        const img = new Image();
        img.onload = () => {
            imgRef.current = img;
            setImageLoaded(true);
            // Get original PNG size via fetch
            fetch('/preview-sample.png')
                .then(r => r.blob())
                .then(b => setOriginalSize(b.size))
                .catch(() => {});
        };
        img.src = '/preview-sample.png';
    }, [isOpen]);

    // Redraw canvas whenever quality or image changes
    const updatePreview = useCallback(() => {
        const img = imgRef.current;
        const canvas = canvasRef.current;
        if (!img || !canvas) return;

        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);

        canvas.toBlob(
            (blob) => {
                if (!blob) return;
                setCompressedSize(blob.size);
                const url = URL.createObjectURL(blob);
                setPreviewUrl(() => {
                    if (prevPreviewUrl.current) URL.revokeObjectURL(prevPreviewUrl.current);
                    prevPreviewUrl.current = url;
                    return url;
                });
            },
            'image/avif',
            quality / 100,
        );
    }, [quality]);

    useEffect(() => {
        if (imageLoaded) updatePreview();
    }, [imageLoaded, updatePreview]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (prevPreviewUrl.current) URL.revokeObjectURL(prevPreviewUrl.current);
        };
    }, []);

    const savingsPercent = originalSize > 0
        ? Math.round((1 - compressedSize / originalSize) * 100)
        : 0;

    const qualityLabel =
        quality >= 90 ? 'Lossless-like' :
        quality >= 75 ? 'High quality' :
        quality >= 55 ? 'Balanced' :
        quality >= 35 ? 'Small size' :
        'Aggressive';

    const qualityColor =
        quality >= 90 ? 'text-emerald-400' :
        quality >= 75 ? 'text-primary' :
        quality >= 55 ? 'text-yellow-400' :
        quality >= 35 ? 'text-orange-400' :
        'text-red-400';

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
                        onClick={onClose}
                    />

                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                        className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl z-50"
                    >
                        <div className="bg-card border border-border rounded-2xl shadow-elevated p-6 m-4">
                            {/* Header */}
                            <div className="flex items-start justify-between mb-5">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                                        <Download className="w-5 h-5 text-primary" />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-semibold text-foreground">Export Questions</h2>
                                        <p className="text-sm text-muted-foreground mt-0.5">
                                            Configure image compression before exporting
                                        </p>
                                    </div>
                                </div>
                                <button onClick={onClose} className="p-2 hover:bg-accent rounded-lg transition-colors">
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            {/* Image Quality Slider */}
                            <div className="mb-5">
                                <div className="flex items-center justify-between mb-2">
                                    <label className="text-sm font-medium text-foreground">
                                        Image Quality
                                    </label>
                                    <div className="flex items-center gap-2">
                                        <span className={`text-xs font-medium ${qualityColor}`}>{qualityLabel}</span>
                                        <span className="text-sm font-mono font-semibold text-foreground tabular-nums w-8 text-right">
                                            {quality}
                                        </span>
                                    </div>
                                </div>
                                <input
                                    type="range"
                                    min={10}
                                    max={100}
                                    step={1}
                                    value={quality}
                                    onChange={(e) => setQuality(Number(e.target.value))}
                                    className="w-full h-2 rounded-full appearance-none cursor-pointer accent-primary"
                                    style={{
                                        background: `linear-gradient(to right, var(--primary) 0%, var(--primary) ${quality}%, var(--border) ${quality}%, var(--border) 100%)`,
                                    }}
                                />
                                <div className="flex justify-between text-[10px] text-muted-foreground mt-1 px-0.5">
                                    <span>10</span>
                                    <span>25</span>
                                    <span>50</span>
                                    <span>75</span>
                                    <span>100</span>
                                </div>
                            </div>

                            {/* Preview */}
                            <div className="mb-5">
                                <div className="flex items-center gap-2 mb-2">
                                    <ImageIcon className="w-3.5 h-3.5 text-muted-foreground" />
                                    <span className="text-sm font-medium text-foreground">Preview</span>
                                    <span className="text-xs text-muted-foreground">(sample question image)</span>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    {/* Original */}
                                    <div className="space-y-1.5">
                                        <div className="relative rounded-lg overflow-hidden border border-border bg-background aspect-video flex items-center justify-center">
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img
                                                src="/preview-sample.png"
                                                alt="Original"
                                                className="w-full h-full object-contain"
                                            />
                                        </div>
                                        <div className="flex items-center justify-between px-1">
                                            <span className="text-xs text-muted-foreground">Original PNG</span>
                                            <span className="text-xs font-mono font-medium text-foreground">
                                                {originalSize > 0 ? formatBytes(originalSize) : '—'}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Compressed */}
                                    <div className="space-y-1.5">
                                        <div className="relative rounded-lg overflow-hidden border border-border bg-background aspect-video flex items-center justify-center">
                                            {previewUrl ? (
                                                // eslint-disable-next-line @next/next/no-img-element
                                                <img
                                                    src={previewUrl}
                                                    alt="Compressed preview"
                                                    className="w-full h-full object-contain"
                                                />
                                            ) : (
                                                <span className="text-xs text-muted-foreground">Loading…</span>
                                            )}
                                        </div>
                                        <div className="flex items-center justify-between px-1">
                                            <span className="text-xs text-muted-foreground">AVIF q={quality}</span>
                                            <div className="flex items-center gap-1.5">
                                                <span className="text-xs font-mono font-medium text-foreground">
                                                    {compressedSize > 0 ? formatBytes(compressedSize) : '—'}
                                                </span>
                                                {savingsPercent > 0 && (
                                                    <span className="text-[10px] font-medium text-emerald-400">
                                                        -{savingsPercent}%
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Hidden canvas used for compression */}
                                <canvas ref={canvasRef} className="hidden" />
                            </div>

                            {/* Actions */}
                            <div className="flex gap-2 justify-end">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="px-4 py-2 text-sm font-medium text-foreground hover:bg-accent rounded-lg transition-all duration-200"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => onExport(quality)}
                                    disabled={loading}
                                    className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 glow-accent"
                                >
                                    <Download className="w-4 h-4" />
                                    {loading ? 'Exporting…' : 'Export'}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
