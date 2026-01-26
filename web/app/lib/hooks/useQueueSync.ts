import { useEffect, useRef } from "react";
import {
  useDataStore,
  useQuizStore,
  useFilterStore,
  useStatsStore,
} from "../stores";
import { sortingLogic } from "../business/sortingLogic";
import type { SortType } from "../types";

/**
 * Hook that syncs the quiz queue when filters, subject, or questions change.
 * Should be called once at the app root level.
 */
export function useQueueSync() {
  const currentSubject = useDataStore((s) => s.currentSubject);
  const questions = useDataStore((s) => s.questions);
  const selectedTopics = useFilterStore((s) => s.selectedTopics);
  const sortType = useFilterStore((s) => s.sortType);
  const attempts = useStatsStore((s) => s.attempts);
  const quizStore = useQuizStore();

  const prevFiltersRef = useRef({
    subjectCode: null as string | null,
    topics: [] as string[],
    sort: "id" as SortType,
    questionsLength: 0,
  });

  useEffect(() => {
    if (!currentSubject) {
      if (quizStore.queue.length > 0) {
        quizStore.setQueue([]);
      }
      return;
    }

    const filtersChanged =
      prevFiltersRef.current.subjectCode !== currentSubject.code ||
      prevFiltersRef.current.sort !== sortType ||
      prevFiltersRef.current.questionsLength !== questions.length ||
      JSON.stringify(prevFiltersRef.current.topics) !==
        JSON.stringify(selectedTopics);

    if (filtersChanged) {
      let filtered = questions.filter(
        (q) =>
          q.subjectCode === currentSubject.code &&
          (selectedTopics.length === 0 ||
            (q.topics || []).some((id) => selectedTopics.includes(id))),
      );

      filtered = sortingLogic.sortQuestions(filtered, sortType, attempts);

      quizStore.setQueue(filtered);
      quizStore.setCurrentIndex(0);
      quizStore.resetSession();

      prevFiltersRef.current = {
        subjectCode: currentSubject.code,
        topics: [...selectedTopics],
        sort: sortType,
        questionsLength: questions.length,
      };
    }
  }, [currentSubject, questions, selectedTopics, sortType, attempts]);
}
