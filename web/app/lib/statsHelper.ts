export interface QuestionAttempt {
    questionId: string;
    subjectCode: string;
    topic: string;
    timestamp: number;
    type: 'multichoice' | 'open';
    userAnswers: Record<number, boolean> | string; // index (1-based) -> boolean for multichoice, string for open
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
        const data = localStorage.getItem(STORAGE_KEY);
        try {
            return data ? JSON.parse(data) : [];
        } catch {
            return [];
        }
    },

    isAttemptCorrect(attempt: QuestionAttempt, question: any): boolean {
        if (!question) return false;

        if (attempt.type === 'open') {
            const correctAnswers = (question.answers || [])
                .filter((a: any) => a.isCorrect || a.is_correct)
                .map((a: any) => (a.text || "").trim());
            return correctAnswers.includes((attempt.userAnswers as string).trim());
        } else {
            const userAnswers = attempt.userAnswers as Record<number, boolean>;
            return question.answers.every((ans: any) => {
                const isActuallyCorrect = ans.isCorrect || ans.is_correct;
                const userChoice = userAnswers[ans.index] || false;
                return isActuallyCorrect === userChoice;
            });
        }
    },

    calculateMetrics(attempts: QuestionAttempt[], questions: any[]) {
        if (attempts.length === 0) return { total: 0, correct: 0, percent: 0 };

        const correct = attempts.filter(a => {
            const question = questions.find(q => q.id === a.questionId);
            return this.isAttemptCorrect(a, question);
        }).length;

        return {
            total: attempts.length,
            correct,
            percent: Math.round((correct / attempts.length) * 100)
        };
    },

    getStatsByQuestionId(questionId: string, questions: any[], customAttempts?: QuestionAttempt[]) {
        const attempts = (customAttempts || this.getAttempts()).filter(a => a.questionId === questionId);
        return this.calculateMetrics(attempts, questions);
    },

    getStatsBySubject(subjectCode: string, questions: any[], customAttempts?: QuestionAttempt[]) {
        const attempts = (customAttempts || this.getAttempts()).filter(a => a.subjectCode === subjectCode);
        return this.calculateMetrics(attempts, questions);
    },

    getStatsByTopic(topic: string, questions: any[], customAttempts?: QuestionAttempt[]) {
        const attempts = (customAttempts || this.getAttempts()).filter(a => a.topic === topic);
        return this.calculateMetrics(attempts, questions);
    }
};
