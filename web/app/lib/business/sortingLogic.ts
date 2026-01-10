import { Question } from '../types/question';
import { SortType } from '../types/enums';
import { QuestionAttempt, statsHelper } from '../helper/statsHelper';

export const sortingLogic = {
    sortQuestions(questions: Question[], sortType: SortType, attempts: QuestionAttempt[]): Question[] {
        const filtered = [...questions];
        const items = Array.isArray(attempts) ? attempts : [];

        switch (sortType) {
            case SortType.ID:
                return filtered.sort((a, b) => a.id.localeCompare(b.id));

            case SortType.LEAST_ANSWERED: {
                const counts = items.reduce((acc, a) => {
                    acc[a.questionId] = (acc[a.questionId] || 0) + 1;
                    return acc;
                }, {} as Record<string, number>);

                return filtered.sort((a, b) => {
                    const countA = counts[a.id] || 0;
                    const countB = counts[b.id] || 0;
                    if (countA === countB) return a.id.localeCompare(b.id);
                    return countA - countB;
                });
            }

            case SortType.WORST_RATIO: {
                const stats = filtered.reduce((acc, q) => {
                    const qAttempts = items.filter(a => a.questionId === q.id);
                    const total = qAttempts.length;
                    if (total === 0) {
                        acc[q.id] = 2; // Unanswered at the end
                        return acc;
                    }
                    const correct = qAttempts.filter(a => statsHelper.isAttemptCorrect(a, q)).length;
                    acc[q.id] = correct / total;
                    return acc;
                }, {} as Record<string, number>);

                return filtered.sort((a, b) => {
                    const ratioA = stats[a.id];
                    const ratioB = stats[b.id];
                    if (ratioA === ratioB) return a.id.localeCompare(b.id);
                    return ratioA - ratioB;
                });
            }

            case SortType.RANDOM:
                // Fisher-Yates
                for (let i = filtered.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    [filtered[i], filtered[j]] = [filtered[j], filtered[i]];
                }
                return filtered;

            default:
                return filtered;
        }
    }
};
