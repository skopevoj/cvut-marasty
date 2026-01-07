export interface Answer {
    text: string;
    isCorrect?: boolean;
    is_correct?: boolean;
}

export interface Question {
    id?: string;
    question: string;
    questionType?: string;
    question_type?: string;
    topic: string;
    answers: Answer[];
    subjectCode: string;
}
