import { Question, Answer } from '../types/question';

export interface QuestionAttempt {
    questionId: string;
    subjectCode: string;
    topic?: string;
    topics?: string[];
    timestamp: number;
    type: 'multichoice' | 'open';
    userAnswers: Record<number, boolean | number> | string; // index (1-based) -> boolean or number for multichoice, string for open
}

const STORAGE_KEY = 'marasty_quiz_stats';

export const statsHelper = {
    saveAttempt(attempt: QuestionAttempt) {
        const attempts = this.getAttempts();
        attempts.push(attempt);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(attempts));
    },

    getAttempts(): QuestionAttempt[] {
        if (typeof window === 'undefined') return [];
        const saved = localStorage.getItem(STORAGE_KEY);
        try {
            const parsed = saved ? JSON.parse(saved) : [];
            return Array.isArray(parsed) ? parsed : [];
        } catch (e) {
            return [];
        }
    },

    isAttemptCorrect(attempt: QuestionAttempt, question: Question | null): boolean {
        if (!question) return false;

        if (attempt.type === 'open') {
            const correctAnswers = (question.answers || [])
                .filter((a: Answer) => !!a.isCorrect)
                .map((a: Answer) => (a.text || "").trim());
            const userAnswer = typeof attempt.userAnswers === 'string'
                ? attempt.userAnswers.trim()
                : "";
            return correctAnswers.includes(userAnswer);
        } else {
            const userAnswers = attempt.userAnswers as Record<number, boolean | number>;
            return question.answers.every((ans: Answer, i: number) => {
                const isActuallyCorrect = !!ans.isCorrect;
                const userChoice = userAnswers[ans.index ?? i];

                if (typeof userChoice === 'boolean') {
                    // Backward compatibility for old stats where only 'correct' was stored as true
                    return isActuallyCorrect === userChoice;
                }

                // New logic: 1 is correct (✓), 3 is incorrect (✕), 0/2 is neutral (−)
                return (userChoice === 1 && isActuallyCorrect) || (userChoice === 3 && !isActuallyCorrect);
            });
        }
    },

    calculateMetrics(attempts: QuestionAttempt[], questions: Question[]) {
        const items = Array.isArray(attempts) ? attempts : [];
        if (items.length === 0) return { total: 0, correct: 0, percent: 0 };

        const correct = items.filter(a => {
            const question = questions.find(q => q.id === a.questionId) || null;
            return this.isAttemptCorrect(a, question);
        }).length;

        return {
            total: items.length,
            correct,
            percent: Math.round((correct / items.length) * 100)
        };
    },

    getStatsByQuestionId(questionId: string, questions: Question[], customAttempts?: QuestionAttempt[]) {
        const attempts = (customAttempts || this.getAttempts()).filter(a => a.questionId === questionId);
        return this.calculateMetrics(attempts, questions);
    },

    getStatsBySubject(subjectCode: string, questions: Question[], customAttempts?: QuestionAttempt[]) {
        const attempts = (customAttempts || this.getAttempts()).filter(a => a.subjectCode === subjectCode);
        return this.calculateMetrics(attempts, questions);
    },

    getStatsByTopic(topic: string, questions: Question[], customAttempts?: QuestionAttempt[]) {
        const attempts = (customAttempts || this.getAttempts()).filter(a => a.topic === topic);
        return this.calculateMetrics(attempts, questions);
    }
};
