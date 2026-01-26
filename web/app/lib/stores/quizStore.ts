import { create } from "zustand";
import type { Question, AnswerState, PeerAnswerState } from "../types";

// ============================================================================
// Types
// ============================================================================

interface QuizState {
  // Queue state
  queue: Question[];
  currentIndex: number;

  // User answers
  userAnswers: Record<number, AnswerState>;
  userTextAnswer: string;

  // UI state
  showResults: boolean;
  showOriginalText: boolean;

  // Peer answers (from collaborators)
  peerAnswers: Record<string, PeerAnswerState>;
}

interface QuizActions {
  // Queue management
  setQueue: (queue: Question[]) => void;
  setCurrentIndex: (index: number) => void;

  // Answer management
  setUserAnswers: (
    answers:
      | Record<number, AnswerState>
      | ((prev: Record<number, AnswerState>) => Record<number, AnswerState>),
  ) => void;
  setUserTextAnswer: (answer: string) => void;
  setAnswer: (index: number, state: AnswerState) => void;

  // UI state
  setShowResults: (show: boolean) => void;
  toggleOriginalText: () => void;

  // Peer state
  setPeerAnswers: (
    answers:
      | Record<string, PeerAnswerState>
      | ((
          prev: Record<string, PeerAnswerState>,
        ) => Record<string, PeerAnswerState>),
  ) => void;

  // Reset
  resetAnswers: () => void;
  resetSession: () => void;
}

// ============================================================================
// Initial State
// ============================================================================

const initialState: QuizState = {
  queue: [],
  currentIndex: 0,
  userAnswers: {},
  userTextAnswer: "",
  showResults: false,
  showOriginalText: false,
  peerAnswers: {},
};

// ============================================================================
// Store
// ============================================================================

export const useQuizStore = create<QuizState & QuizActions>((set) => ({
  ...initialState,

  setQueue: (queue) => set({ queue }),
  setCurrentIndex: (index) => set({ currentIndex: index }),

  setUserAnswers: (answers) =>
    set((state) => ({
      userAnswers:
        typeof answers === "function" ? answers(state.userAnswers) : answers,
    })),

  setUserTextAnswer: (answer) => set({ userTextAnswer: answer }),

  setAnswer: (index, state) =>
    set((prev) => ({
      userAnswers: { ...prev.userAnswers, [index]: state },
    })),

  setShowResults: (show) => set({ showResults: show }),
  toggleOriginalText: () =>
    set((state) => ({ showOriginalText: !state.showOriginalText })),

  setPeerAnswers: (answers) =>
    set((state) => ({
      peerAnswers:
        typeof answers === "function" ? answers(state.peerAnswers) : answers,
    })),

  resetAnswers: () =>
    set({
      userAnswers: {},
      userTextAnswer: "",
      showResults: false,
    }),

  resetSession: () =>
    set({
      userAnswers: {},
      userTextAnswer: "",
      showResults: false,
      peerAnswers: {},
    }),
}));

// ============================================================================
// Selectors
// ============================================================================

export const selectCurrentQuestion = (state: QuizState) =>
  state.queue[state.currentIndex] || null;
