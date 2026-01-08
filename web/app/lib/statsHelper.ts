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
                .filter((a: any) => !!a.isCorrect)
                .map((a: any) => (a.text || "").trim());
            const userAnswer = typeof attempt.userAnswers === 'string'
                ? attempt.userAnswers.trim()
                : "";
            return correctAnswers.includes(userAnswer);
        } else {
            const userAnswers = attempt.userAnswers as Record<number, boolean | number>;
            return question.answers.every((ans: any, i: number) => {
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
