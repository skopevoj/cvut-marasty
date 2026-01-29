import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { QuestionAttempt } from "../types";

// ============================================================================
// Types
// ============================================================================

interface StatsState {
  attempts: QuestionAttempt[];
}

interface StatsActions {
  saveAttempt: (attempt: QuestionAttempt) => void;
  setAttempts: (attempts: QuestionAttempt[]) => void;
  clearAttempts: () => void;
  clearSubjectAttempts: (subjectCode: string) => void;
}

// ============================================================================
// Store
// ============================================================================

export const useStatsStore = create<StatsState & StatsActions>()(
  persist(
    (set) => ({
      attempts: [],

      saveAttempt: (attempt) =>
        set((state) => ({
          attempts: [...state.attempts, attempt],
        })),

      setAttempts: (attempts) => set({ attempts }),

      clearAttempts: () => set({ attempts: [] }),

      clearSubjectAttempts: (subjectCode) =>
        set((state) => ({
          attempts: state.attempts.filter((a) => a.subjectCode !== subjectCode),
        })),
    }),
    {
      name: "quiz-stats",
    },
  ),
);
