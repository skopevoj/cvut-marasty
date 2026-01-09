'use client';

import { createContext, useContext, useState, ReactNode, useCallback } from 'react';

type Color = string;

interface WhiteboardContextType {
    color: Color;
    setColor: (color: Color) => void;
    tool: 'pencil' | 'eraser';
    setTool: (tool: 'pencil' | 'eraser') => void;
    clear: () => void;
    undo: () => void;
    redo: () => void;
    setClearFn: (fn: () => void) => void;
    setUndoFn: (fn: () => void) => void;
    setRedoFn: (fn: () => void) => void;
}

const WhiteboardContext = createContext<WhiteboardContextType | undefined>(undefined);

export function WhiteboardProvider({ children }: { children: ReactNode }) {
    const [color, setColor] = useState<Color>('#3b82f6'); // Default blue
    const [tool, setTool] = useState<'pencil' | 'eraser'>('pencil');
    const [clearFn, setClearFnState] = useState<(() => void) | null>(null);
    const [undoFn, setUndoFnState] = useState<(() => void) | null>(null);
    const [redoFn, setRedoFnState] = useState<(() => void) | null>(null);

    const clear = useCallback(() => clearFn?.(), [clearFn]);
    const undo = useCallback(() => undoFn?.(), [undoFn]);
    const redo = useCallback(() => redoFn?.(), [redoFn]);

    return (
        <WhiteboardContext.Provider value={{
            color,
            setColor,
            tool,
            setTool,
            clear,
            undo,
            redo,
            setClearFn: setClearFnState,
            setUndoFn: setUndoFnState,
            setRedoFn: setRedoFnState,
        }}>
            {children}
        </WhiteboardContext.Provider>
    );
}

export function useWhiteboard() {
    const context = useContext(WhiteboardContext);
    if (!context) {
        throw new Error('useWhiteboard must be used within a WhiteboardProvider');
    }
    return context;
}
