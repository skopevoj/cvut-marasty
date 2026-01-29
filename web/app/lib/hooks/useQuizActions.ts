import { useQuizStore, useStatsStore, usePeerStore } from "../stores";
import { usePeer } from "../providers/PeerProvider";
import { QuestionType } from "../types";
import { EvaluationStrategyFactory } from "../evaluation/evaluationStrategy";
import type { Answer, AnswerState } from "../types";

/**
 * Hook for quiz answer actions.
 * Handles setting answers, text input, and evaluation.
 */
export function useQuizActions() {
  const quizStore = useQuizStore();
  const statsStore = useStatsStore();
  const peerStore = usePeerStore();
  const { broadcastMessage } = usePeer();

  const setAnswer = (index: number, state: AnswerState) => {
    if (quizStore.showResults) return;

    const newAnswers = { ...quizStore.userAnswers, [index]: state };
    quizStore.setAnswer(index, state);

    if (peerStore.isConnected) {
      const currentQuestion = quizStore.queue[quizStore.currentIndex];
      broadcastMessage({
        type: "answer-update",
        data: {
          index,
          state,
          questionId: currentQuestion?.id,
          allAnswers: newAnswers,
        },
      });
    }
  };

  const setTextAnswer = (value: string) => {
    if (quizStore.showResults) return;
    quizStore.setUserTextAnswer(value);
  };

  const evaluate = (shuffledAnswers: Answer[]) => {
    const currentQuestion = quizStore.queue[quizStore.currentIndex];
    if (!currentQuestion) return;

    const strategy = EvaluationStrategyFactory.getStrategy(
      currentQuestion.questionType || QuestionType.MULTICHOICE,
    );

    const result = strategy.evaluate(
      currentQuestion,
      quizStore.userAnswers,
      quizStore.userTextAnswer,
      shuffledAnswers,
    );

    statsStore.saveAttempt({
      questionId: currentQuestion.id || "unknown",
      subjectCode: currentQuestion.subjectCode,
      topic: currentQuestion.topics?.[0] || "unknown",
      topics: currentQuestion.topics,
      timestamp: Date.now(),
      type: (currentQuestion.questionType?.toLowerCase() ||
        QuestionType.MULTICHOICE) as "multichoice" | "open",
      userAnswers: result.statsUserAnswers,
      isCorrect: result.isCorrect,
      detailed: result.detailed,
    });

    quizStore.setShowResults(true);

    if (peerStore.isConnected) {
      broadcastMessage({
        type: "evaluate",
        data: {
          questionId: currentQuestion.id,
          userAnswers: quizStore.userAnswers,
        },
      });
    }

    return result;
  };

  return {
    setAnswer,
    setTextAnswer,
    evaluate,
    toggleOriginalText: quizStore.toggleOriginalText,
  };
}
