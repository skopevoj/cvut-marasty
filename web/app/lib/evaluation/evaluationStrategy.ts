import { Question, Answer } from '../types/question';
import { AnswerState, QuestionType } from '../types/enums';

export interface EvaluationResult {
    isCorrect: boolean;
    statsUserAnswers: Record<number, number> | string;
}

export interface EvaluationStrategy {
    evaluate(question: Question, userAnswers: Record<number, AnswerState>, userTextAnswer: string, shuffledAnswers: Answer[]): EvaluationResult;
}

export class MultiChoiceEvaluator implements EvaluationStrategy {
    evaluate(question: Question, userAnswers: Record<number, AnswerState>, _userTextAnswer: string, shuffledAnswers: Answer[]): EvaluationResult {
        const isCorrect = shuffledAnswers.every((ans, i) => {
            const isActuallyCorrect = !!ans.isCorrect;
            const userState = userAnswers[i] || AnswerState.NEUTRAL;
            return (userState === AnswerState.CORRECT && isActuallyCorrect) ||
                (userState === AnswerState.INCORRECT && !isActuallyCorrect);
        });

        const statsUserAnswers = shuffledAnswers.reduce((acc, ans, i) => {
            acc[ans.index ?? i] = userAnswers[i] || AnswerState.NEUTRAL;
            return acc;
        }, {} as Record<number, number>);

        return { isCorrect, statsUserAnswers };
    }
}

export class OpenQuestionEvaluator implements EvaluationStrategy {
    evaluate(question: Question, _userAnswers: Record<number, AnswerState>, userTextAnswer: string, _shuffledAnswers: Answer[]): EvaluationResult {
        const correctAnswers = (question.answers || [])
            .filter((a) => a.isCorrect)
            .map((a) => (a.text || "").trim());

        const isCorrect = correctAnswers.some(c => c === (userTextAnswer || "").trim());

        return { isCorrect, statsUserAnswers: userTextAnswer };
    }
}

export class EvaluationStrategyFactory {
    private static strategies: Map<QuestionType, EvaluationStrategy> = new Map();

    static {
        this.strategies.set(QuestionType.MULTICHOICE, new MultiChoiceEvaluator());
        this.strategies.set(QuestionType.OPEN, new OpenQuestionEvaluator());
    }

    static getStrategy(type: string): EvaluationStrategy {
        const qType = (type || QuestionType.MULTICHOICE).toLowerCase() as QuestionType;
        return this.strategies.get(qType) || this.strategies.get(QuestionType.MULTICHOICE)!;
    }
}
