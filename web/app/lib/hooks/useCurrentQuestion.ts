import { useMemo } from "react";
import {
  useQuizStore,
  useStatsStore,
  useSettingsStore,
  usePeerStore,
} from "../stores";
import type { Answer, QuestionStats } from "../types";
import { statsHelper } from "../helper/statsHelper";

/**
 * Hook for current question data and computed values.
 * Use this when you need the current question and its related data.
 */
export function useCurrentQuestion() {
  const queue = useQuizStore((s) => s.queue);
  const currentIndex = useQuizStore((s) => s.currentIndex);
  const attempts = useStatsStore((s) => s.attempts);
  const shuffleAnswers = useSettingsStore((s) => s.shuffleAnswers);
  const isConnected = usePeerStore((s) => s.isConnected);

  const currentQuestion = queue[currentIndex] || null;

  const shuffledAnswers = useMemo((): Answer[] => {
    if (!currentQuestion?.answers) return [];

    // Ensure answers have original indices for correct evaluation
    const indexedAnswers = currentQuestion.answers.map((ans, idx) => ({
      ...ans,
      index: ans.index ?? idx,
    }));

    // Disable shuffle when in peer room to keep everyone synchronized
    if (shuffleAnswers && !isConnected) {
      const answers = [...indexedAnswers];
      // Use question ID as seed for deterministic shuffle across components
      const seed = currentQuestion.id || "";
      let seedNum = 0;
      for (let i = 0; i < seed.length; i++) {
        seedNum = seedNum * 31 + seed.charCodeAt(i);
        seedNum |= 0;
      }

      for (let i = answers.length - 1; i > 0; i--) {
        seedNum = (seedNum * 1664525 + 1013904223) | 0;
        const j = Math.abs(seedNum % (i + 1));
        [answers[i], answers[j]] = [answers[j], answers[i]];
      }
      return answers;
    }

    return indexedAnswers;
  }, [currentQuestion, shuffleAnswers, isConnected]);

  const stats = useMemo((): QuestionStats | null => {
    if (!currentQuestion) return null;
    const items = Array.isArray(attempts) ? attempts : [];
    const questionAttempts = items
      .filter((a) => a.questionId === currentQuestion.id)
      .sort((a, b) => b.timestamp - a.timestamp);

    return {
      totalAnswered: questionAttempts.length,
      history: questionAttempts.map((a) => ({
        timestamp: a.timestamp,
        isCorrect: statsHelper.isAttemptCorrect(a, currentQuestion),
      })),
    };
  }, [currentQuestion, attempts]);

  return {
    question: currentQuestion,
    shuffledAnswers,
    stats,
    index: currentIndex,
    total: queue.length,
  };
}
