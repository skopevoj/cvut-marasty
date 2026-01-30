import { useState, useEffect } from "react";
import { useSettingsStore, useQuizStore } from "../stores";
import { getAnswerHash } from "../utils/hashing";

interface AnswerStat {
  answerHash: string;
  total: number;
  correct: number;
  accuracy: number;
}

interface QuestionStats {
  questionHash: string;
  totalAttempts: number;
  answerStats: AnswerStat[];
}

export function useQuestionStats(
  questionId: string | null,
  answerHashes: string[] = [],
) {
  const [stats, setStats] = useState<QuestionStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { backendUrl } = useSettingsStore();
  const showStats = useQuizStore((s) => s.showStats);

  const fetchStats = async () => {
    if (!questionId || !backendUrl || !showStats || answerHashes.length === 0)
      return;

    setLoading(true);
    setError(null);
    try {
      const baseUrl = backendUrl.endsWith("/") ? backendUrl : `${backendUrl}/`;
      const response = await fetch(`${baseUrl}stats/query`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          questionHash: questionId,
          answerHashes: answerHashes,
        }),
      });
      if (!response.ok) throw new Error("Failed to fetch stats");
      const data = await response.json();
      setStats(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (questionId && showStats && answerHashes.length > 0) {
      fetchStats();
    }
  }, [questionId, backendUrl, showStats, JSON.stringify(answerHashes)]);

  return { stats, loading, error, refresh: fetchStats };
}
