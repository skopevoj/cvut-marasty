import { useQuizStore } from "../stores/quizStore";
import { useDataStore } from "../stores/dataStore";
import { selectSubject } from "./subjectActions";

// ============================================================================
// Navigation Actions
// ============================================================================

export function nextQuestion() {
  const quizStore = useQuizStore.getState();
  const { queue, currentIndex } = quizStore;

  if (currentIndex < queue.length - 1) {
    quizStore.setCurrentIndex(currentIndex + 1);
    quizStore.resetAnswers();
  }
}

export function prevQuestion() {
  const quizStore = useQuizStore.getState();
  const { currentIndex } = quizStore;

  if (currentIndex > 0) {
    quizStore.setCurrentIndex(currentIndex - 1);
    quizStore.resetAnswers();
  }
}

export function goToQuestion(questionId: string) {
  const dataStore = useDataStore.getState();
  const quizStore = useQuizStore.getState();
  const { questions, currentSubject } = dataStore;
  const { queue } = quizStore;

  const question = questions.find((q) => q.id === questionId);
  if (!question) return;

  // Switch subject if needed
  if (!currentSubject || currentSubject.code !== question.subjectCode) {
    selectSubject(question.subjectCode);
  }

  // Find index in queue and navigate
  const index = queue.findIndex((q) => q.id === questionId);
  if (index !== -1) {
    quizStore.setCurrentIndex(index);
    quizStore.resetAnswers();
  }
}

export function goToIndex(index: number) {
  const quizStore = useQuizStore.getState();
  const { queue } = quizStore;

  if (index >= 0 && index < queue.length) {
    quizStore.setCurrentIndex(index);
    quizStore.resetAnswers();
  }
}
