export enum AnswerState {
    NEUTRAL = 0,
    CORRECT = 1,
    REVEALED = 2,
    INCORRECT = 3
}

export enum QuestionType {
    MULTICHOICE = 'multichoice',
    OPEN = 'open'
}

export enum SortType {
    ID = 'id',
    RANDOM = 'random',
    LEAST_ANSWERED = 'least-answered',
    WORST_RATIO = 'worst-ratio'
}
