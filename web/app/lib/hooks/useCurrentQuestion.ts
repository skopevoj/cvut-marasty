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

    // Disable shuffle when in peer room to keep everyone synchronized
    if (shuffleAnswers && !isConnected) {
      const answers = [...currentQuestion.answers];
      for (let i = answers.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [answers[i], answers[j]] = [answers[j], answers[i]];
      }
      return answers;
    }

    return currentQuestion.answers;
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
