import { create } from "zustand";
import type { Subject, Question, SubjectDetails, LoadingState } from "../types";

// ============================================================================
// Types
// ============================================================================

interface DataState {
  // Raw data from sources
  allData: { subjects: any[] } | null;

  // Processed data
  subjects: Subject[];
  questions: Question[];
  currentSubject: Subject | null;
  currentSubjectDetails: SubjectDetails | null;

  // Loading state
  loading: LoadingState;
}

interface DataActions {
  setAllData: (data: { subjects: any[] } | null) => void;
  setSubjects: (subjects: Subject[]) => void;
  setQuestions: (questions: Question[]) => void;
  setCurrentSubject: (subject: Subject | null) => void;
  setCurrentSubjectDetails: (details: SubjectDetails | null) => void;

  // Loading actions
  setLoading: (loading: Partial<LoadingState>) => void;
  addMessage: (message: string) => void;
  setProgress: (progress: number) => void;
  setError: (error: string | null) => void;
  startLoading: () => void;
  finishLoading: () => void;

  // Combined actions
  reset: () => void;
}

// ============================================================================
// Initial State
// ============================================================================

const initialState: DataState = {
  allData: null,
  subjects: [],
  questions: [],
  currentSubject: null,
  currentSubjectDetails: null,
  loading: {
    isLoading: false,
    progress: 0,
    messages: [],
    error: null,
  },
};

// ============================================================================
// Store
// ============================================================================

export const useDataStore = create<DataState & DataActions>((set) => ({
  ...initialState,

  setAllData: (data) => set({ allData: data }),
  setSubjects: (subjects) => set({ subjects }),
  setQuestions: (questions) => set({ questions }),
  setCurrentSubject: (subject) => set({ currentSubject: subject }),
  setCurrentSubjectDetails: (details) =>
    set({ currentSubjectDetails: details }),

  setLoading: (loading) =>
    set((state) => ({
      loading: { ...state.loading, ...loading },
    })),

  addMessage: (message) =>
    set((state) => ({
      loading: {
        ...state.loading,
        messages: [...state.loading.messages, message].slice(-10),
      },
    })),

  setProgress: (progress) =>
    set((state) => ({
      loading: { ...state.loading, progress },
    })),

  setError: (error) =>
    set((state) => ({
      loading: { ...state.loading, error },
    })),

  startLoading: () =>
    set({
      loading: { isLoading: true, progress: 0, messages: [], error: null },
    }),

  finishLoading: () =>
    set((state) => ({
      loading: { ...state.loading, isLoading: false },
    })),

  reset: () => set(initialState),
}));
