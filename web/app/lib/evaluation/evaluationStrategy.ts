import { Question, Answer } from "../types/question";
import { AnswerState, QuestionType } from "../types/enums";
import { getAnswerHash } from "../utils/hashing";

export interface EvaluationResult {
  isCorrect: boolean;
  statsUserAnswers: Record<number, number> | string;
  detailed: Record<number, boolean> | boolean;
  answerHashes?: Record<number, string>;
}

export interface EvaluationStrategy {
  evaluate(
    question: Question,
    userAnswers: Record<number, AnswerState>,
    userTextAnswer: string,
    shuffledAnswers: Answer[],
  ): EvaluationResult;
}

export class MultiChoiceEvaluator implements EvaluationStrategy {
  evaluate(
    question: Question,
    userAnswers: Record<number, AnswerState>,
    _userTextAnswer: string,
    shuffledAnswers: Answer[],
  ): EvaluationResult {
    const isCorrect = shuffledAnswers.every((ans, i) => {
      const isActuallyCorrect = !!ans.isCorrect;
      const originalIndex = ans.index ?? i;
      const userState = userAnswers[originalIndex] || AnswerState.NEUTRAL;
      return (
        (userState === AnswerState.CORRECT && isActuallyCorrect) ||
        (userState === AnswerState.INCORRECT && !isActuallyCorrect)
      );
    });

    const statsUserAnswers = shuffledAnswers.reduce(
      (acc, ans, i) => {
        // We use ans.index if available (assigned during shuffling in useCurrentQuestion)
        // if not, we try to find the index in original question answers by text comparison
        let originalIndex = ans.index;
        if (originalIndex === undefined) {
          const foundIndex = question.answers.findIndex(
            (a) => a.text === ans.text,
          );
          originalIndex = foundIndex !== -1 ? foundIndex : i;
        }

        acc[originalIndex] = userAnswers[originalIndex] || AnswerState.NEUTRAL;
        return acc;
      },
      {} as Record<number, number>,
    );

    const detailed = shuffledAnswers.reduce(
      (acc, ans, i) => {
        const isActuallyCorrect = !!ans.isCorrect;
        const originalIndex = ans.index ?? i;
        const userState = userAnswers[originalIndex] || AnswerState.NEUTRAL;
        acc[originalIndex] =
          (userState === AnswerState.CORRECT && isActuallyCorrect) ||
          (userState === AnswerState.INCORRECT && !isActuallyCorrect);
        return acc;
      },
      {} as Record<number, boolean>,
    );

    const answerHashes = shuffledAnswers.reduce(
      (acc, ans, i) => {
        const originalIndex = ans.index ?? i;
        acc[originalIndex] = getAnswerHash(ans.text);
        return acc;
      },
      {} as Record<number, string>,
    );

    return { isCorrect, statsUserAnswers, detailed, answerHashes };
  }
}

export class OpenQuestionEvaluator implements EvaluationStrategy {
  evaluate(
    question: Question,
    _userAnswers: Record<number, AnswerState>,
    userTextAnswer: string,
    _shuffledAnswers: Answer[],
  ): EvaluationResult {
    const correctAnswers = (question.answers || [])
      .filter((a) => a.isCorrect)
      .map((a) => (a.text || "").trim());

    const isCorrect = correctAnswers.some(
      (c) => c === (userTextAnswer || "").trim(),
    );

    // For open questions, we use a single "answer" which is the open field itself
    const answerHashes: Record<number, string> = {
      0: "open-answer",
    };

    return {
      isCorrect,
      statsUserAnswers: userTextAnswer,
      detailed: isCorrect,
      answerHashes,
    };
  }
}

export class EvaluationStrategyFactory {
  private static strategies: Map<QuestionType, EvaluationStrategy> = new Map();

  static {
    this.strategies.set(QuestionType.MULTICHOICE, new MultiChoiceEvaluator());
    this.strategies.set(QuestionType.OPEN, new OpenQuestionEvaluator());
  }

  static getStrategy(type: string): EvaluationStrategy {
    const qType = (
      type || QuestionType.MULTICHOICE
    ).toLowerCase() as QuestionType;
    return (
      this.strategies.get(qType) ||
      this.strategies.get(QuestionType.MULTICHOICE)!
    );
  }
}
