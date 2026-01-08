export interface Answer {
    index: number;
    text: string;
    isCorrect?: boolean;
    is_correct?: boolean;
}

export interface Question {
    id?: string;
    question: string;
    questionType?: string;
    question_type?: string;
    topic?: string;
    topics?: string[];
    answers: Answer[];
    subjectCode: string;
    photo?: string | boolean | null;
    quizPhoto?: string | boolean | null;
    original_text?: string;
    originalText?: string;
}
