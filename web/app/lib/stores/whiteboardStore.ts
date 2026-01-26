import { create } from "zustand";
import type { WhiteboardTool } from "../types";

// ============================================================================
// Types
// ============================================================================

interface WhiteboardState {
  color: string;
  tool: WhiteboardTool;
  // Callback functions for canvas operations
  clearFn: (() => void) | null;
  undoFn: (() => void) | null;
  redoFn: (() => void) | null;
}

interface WhiteboardActions {
  setColor: (color: string) => void;
  setTool: (tool: WhiteboardTool) => void;
  setClearFn: (fn: (() => void) | null) => void;
  setUndoFn: (fn: (() => void) | null) => void;
  setRedoFn: (fn: (() => void) | null) => void;
  clear: () => void;
  undo: () => void;
  redo: () => void;
}

// ============================================================================
// Constants
// ============================================================================

const DEFAULT_COLOR = "#3b82f6";

// ============================================================================
// Store
// ============================================================================

export const useWhiteboardStore = create<WhiteboardState & WhiteboardActions>(
  (set, get) => ({
    color: DEFAULT_COLOR,
    tool: "pencil",
    clearFn: null,
    undoFn: null,
    redoFn: null,

    setColor: (color) => set({ color }),
    setTool: (tool) => set({ tool }),
    setClearFn: (fn) => set({ clearFn: fn }),
    setUndoFn: (fn) => set({ undoFn: fn }),
    setRedoFn: (fn) => set({ redoFn: fn }),
    clear: () => get().clearFn?.(),
    undo: () => get().undoFn?.(),
    redo: () => get().redoFn?.(),
  }),
);
