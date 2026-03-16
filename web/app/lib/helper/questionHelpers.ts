import type { Question } from "../types/question";

export function getQuestionTopics(question: Question | null) {
  if (!question) return [];
  return question.topics || [];
}

export function getDisplayedPhoto(question: Question | null, showQuizPhoto: boolean) {
  if (!question) return null;

  if (showQuizPhoto) {
    return question.quizPhoto || question.image || question.photo;
  }

  return question.image || question.photo;
}
