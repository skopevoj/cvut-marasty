import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { QuestionAttempt } from "../types";
import { useSettingsStore } from "./settingsStore";

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

      saveAttempt: (attempt) => {
        set((state) => ({
          attempts: [...state.attempts, attempt],
        }));

        // Send to remote backend if configured
        const { backendUrl, username, uid } = useSettingsStore.getState();
        if (backendUrl && backendUrl.trim() !== "") {
          const url = backendUrl.endsWith("/")
            ? `${backendUrl}stats`
            : `${backendUrl}/stats`;

          fetch(url, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              uid: uid,
              username: username || "Anonym",
              questionHash: attempt.questionId, // Assuming questionId is the hash
              isCorrect: attempt.isCorrect,
              userAnswers: attempt.detailed,
            }),
          }).catch((err) => {
            console.error("Failed to sync stats to remote backend:", err);
          });
        }
      },

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
