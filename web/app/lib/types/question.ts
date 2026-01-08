export interface Answer {
    index: number;
    text: string;
    isCorrect: boolean;
}

export interface Question {
    id: string;
    question: string;
    questionType: string;
    topics: string[];
    answers: Answer[];
    subjectCode: string;
    photo?: string | boolean | null;
    quizPhoto?: string | boolean | null;
    originalText?: string;
}
