'use client';

import { useWhiteboard } from "../../lib/context/WhiteboardContext";
import { useQuiz } from "../../lib/context/QuizContext";
import { useSettings } from "../../lib/context/SettingsContext";
import { useEffect, useRef, useState, useCallback } from "react";

export function Whiteboard() {
    const { settings } = useSettings();
    const { currentQuestionIndex } = useQuiz();
    const { color, tool, setClearFn, setUndoFn, setRedoFn } = useWhiteboard();
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isMobile, setIsMobile] = useState(false);
    const [isDrawing, setIsDrawing] = useState(false);
    const [history, setHistory] = useState<ImageData[]>([]);
    const [redoStack, setRedoStack] = useState<ImageData[]>([]);

    const lastX = useRef(0);
    const lastY = useRef(0);

    // Detect mobile
    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.matchMedia("(max-width: 768px)").matches);
        };
        checkMobile();
        window.addEventListener("resize", checkMobile);
        return () => window.removeEventListener("resize", checkMobile);
    }, []);

    // Handle canvas sizing
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas || !settings.whiteboardEnabled) return;

        const resize = () => {
            const ctx = canvas.getContext('2d', { willReadFrequently: true });
            if (!ctx) return;

            // Save current content
            const temp = ctx.getImageData(0, 0, canvas.width, canvas.height);

            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;

            // Restore content
            ctx.putImageData(temp, 0, 0);
        };

        resize();
        window.addEventListener("resize", resize);
        return () => window.removeEventListener("resize", resize);
    }, [settings.whiteboardEnabled]); // Re-run when enabled

    const clear = useCallback(() => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d', { willReadFrequently: true });
        if (canvas && ctx) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
            setHistory([data]);
            setRedoStack([]);
        }
    }, []);

    const saveToHistory = useCallback(() => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d', { willReadFrequently: true });
        if (canvas && ctx) {
            const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
            setHistory(prev => {
                const updated = [...prev, data];
                if (updated.length > 30) updated.shift();
                return updated;
            });
            setRedoStack([]);
        }
    }, []);

    const undo = useCallback(() => {
        if (history.length <= 1) {
            if (history.length === 1) {
                const canvas = canvasRef.current;
                const ctx = canvas?.getContext('2d', { willReadFrequently: true });
                if (canvas && ctx) {
                    const current = history[0];
                    setRedoStack(prev => [current, ...prev]);
                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                    setHistory([]);
                }
            }
            return;
        }

        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d', { willReadFrequently: true });
        if (canvas && ctx) {
            const current = history[history.length - 1];
            const previous = history[history.length - 2];

            setRedoStack(prev => [current, ...prev]);
            setHistory(prev => prev.slice(0, -1));
            ctx.putImageData(previous, 0, 0);
        }
    }, [history]);

    const redo = useCallback(() => {
        if (redoStack.length === 0) return;

        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d', { willReadFrequently: true });
        if (canvas && ctx) {
            const next = redoStack[0];
            setRedoStack(prev => prev.slice(1));
            setHistory(prev => [...prev, next]);
            ctx.putImageData(next, 0, 0);
        }
    }, [redoStack]);

    useEffect(() => {
        setClearFn(() => clear);
        setUndoFn(() => undo);
        setRedoFn(() => redo);
    }, [clear, undo, redo, setClearFn, setUndoFn, setRedoFn]);

    // Clear drawing on question change
    useEffect(() => {
        if (settings.whiteboardEnabled) {
            clear();
        }
    }, [currentQuestionIndex, clear, settings.whiteboardEnabled]);

    const getCoordinates = (e: React.MouseEvent | React.TouchEvent | MouseEvent | TouchEvent) => {
        let clientX, clientY;
        if ('touches' in e) {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        } else {
            clientX = (e as MouseEvent).clientX;
            clientY = (e as MouseEvent).clientY;
        }
        return { x: clientX, y: clientY };
    };

    const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
        if (!settings.whiteboardEnabled || isMobile) return;
        setIsDrawing(true);
        const { x, y } = getCoordinates(e);
        lastX.current = x;
        lastY.current = y;

        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (ctx) {
            ctx.beginPath();
            ctx.moveTo(x, y);
        }
    };

    const draw = (e: React.MouseEvent | React.TouchEvent) => {
        if (!isDrawing || !settings.whiteboardEnabled || isMobile) return;
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!canvas || !ctx) return;

        const { x, y } = getCoordinates(e);

        ctx.strokeStyle = tool === 'eraser' ? '#030303' : color;
        ctx.lineWidth = tool === 'eraser' ? 40 : 2.5;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        const midX = (lastX.current + x) / 2;
        const midY = (lastY.current + y) / 2;

        ctx.quadraticCurveTo(lastX.current, lastY.current, midX, midY);
        ctx.stroke();

        // Start a new path from the midpoint to keep it smooth
        ctx.beginPath();
        ctx.moveTo(midX, midY);

        lastX.current = x;
        lastY.current = y;
    };

    const stopDrawing = () => {
        if (isDrawing) {
            setIsDrawing(false);
            saveToHistory();
        }
    };

    return (
        <canvas
            ref={canvasRef}
            className={`fixed inset-0 pointer-events-auto transition-opacity duration-300 ${(!settings.whiteboardEnabled || isMobile) ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
            style={{
                zIndex: 0,
                backgroundColor: 'transparent',
                cursor: tool === 'eraser' ? 'cell' : 'crosshair'
            }}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
        />
    );
}
