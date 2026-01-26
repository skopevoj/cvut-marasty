import type { Question, Answer, AnswerState, QuestionStats } from "../types";
import { QuestionType } from "../types";
import { useQuizStore } from "../stores/quizStore";
import { useDataStore } from "../stores/dataStore";
import { useFilterStore } from "../stores/filterStore";
import { useStatsStore } from "../stores/statsStore";
import { usePeerStore } from "../stores/peerStore";
import { useSettingsStore } from "../stores/settingsStore";
import { sortingLogic } from "../business/sortingLogic";
import { EvaluationStrategyFactory } from "../evaluation/evaluationStrategy";
import { statsHelper } from "../helper/statsHelper";

// ============================================================================
// Queue Management
// ============================================================================

export function updateQuizQueue() {
  const dataStore = useDataStore.getState();
  const quizStore = useQuizStore.getState();
  const filterStore = useFilterStore.getState();
  const statsStore = useStatsStore.getState();

  const { currentSubject, questions } = dataStore;
  const { selectedTopics, sortType } = filterStore;
  const { attempts } = statsStore;

  if (!currentSubject) {
    quizStore.setQueue([]);
    return;
  }

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
}

export function shuffleQueue() {
  const quizStore = useQuizStore.getState();
  const { queue } = quizStore;

  const shuffled = [...queue];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  quizStore.setQueue(shuffled);
  quizStore.setCurrentIndex(0);
  quizStore.resetSession();
}

// ============================================================================
// Answer Shuffling
// ============================================================================

export function getShuffledAnswers(question: Question | null): Answer[] {
  if (!question?.answers) return [];

  const settings = useSettingsStore.getState();
  const peerStore = usePeerStore.getState();

  // Disable shuffle when in peer room to keep everyone synchronized
  if (settings.shuffleAnswers && !peerStore.isConnected) {
    const answers = [...question.answers];
    for (let i = answers.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [answers[i], answers[j]] = [answers[j], answers[i]];
    }
    return answers;
  }

  return question.answers;
}

// ============================================================================
// Stats Calculation
// ============================================================================

export function getQuestionStats(
  question: Question | null,
): QuestionStats | null {
  if (!question) return null;

  const { attempts } = useStatsStore.getState();
  const items = Array.isArray(attempts) ? attempts : [];
  const questionAttempts = items
    .filter((a) => a.questionId === question.id)
    .sort((a, b) => b.timestamp - a.timestamp);

  return {
    totalAnswered: questionAttempts.length,
    history: questionAttempts.map((a) => ({
      timestamp: a.timestamp,
      isCorrect: statsHelper.isAttemptCorrect(a, question),
    })),
  };
}

// ============================================================================
// Evaluation
// ============================================================================

export function evaluate(shuffledAnswers: Answer[]) {
  const quizStore = useQuizStore.getState();
  const statsStore = useStatsStore.getState();
  const { queue, currentIndex, userAnswers, userTextAnswer } = quizStore;

  const currentQuestion = queue[currentIndex];
  if (!currentQuestion) return;

  const strategy = EvaluationStrategyFactory.getStrategy(
    currentQuestion.questionType || QuestionType.MULTICHOICE,
  );

  const result = strategy.evaluate(
    currentQuestion,
    userAnswers,
    userTextAnswer,
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
  });

  quizStore.setShowResults(true);

  return result;
}

// ============================================================================
// Answer Actions
// ============================================================================

export function setAnswer(index: number, state: AnswerState) {
  const quizStore = useQuizStore.getState();
  if (quizStore.showResults) return;

  quizStore.setAnswer(index, state);
}

export function setTextAnswer(value: string) {
  const quizStore = useQuizStore.getState();
  if (quizStore.showResults) return;

  quizStore.setUserTextAnswer(value);
}
