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
        if (backendUrl && backendUrl.trim() !== "" && attempt.answerHashes) {
          const url = backendUrl.endsWith("/")
            ? `${backendUrl}stats`
            : `${backendUrl}/stats`;

          const answersBody: { hash: string; isCorrect: boolean }[] = [];

          if (
            typeof attempt.detailed === "object" &&
            attempt.detailed !== null
          ) {
            Object.entries(attempt.detailed).forEach(([idx, correct]) => {
              const hash = attempt.answerHashes?.[Number(idx)];
              if (hash) {
                answersBody.push({ hash, isCorrect: !!correct });
              }
            });
          } else if (typeof attempt.detailed === "boolean") {
            const hash = attempt.answerHashes[0];
            if (hash) {
              answersBody.push({ hash, isCorrect: attempt.detailed });
            }
          }

          if (answersBody.length > 0) {
            fetch(url, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                uid: uid,
                username: username || "Anonym",
                questionHash: attempt.questionId,
                answers: answersBody,
              }),
            }).catch((err) => {
              console.error("Failed to sync stats to remote backend:", err);
            });
          }
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
