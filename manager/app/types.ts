export interface Topic {
    id: string;
    name: string;
}

export interface Subject {
    name: string;
    code: string;
    description: string;
    primaryColor: string;
    secondaryColor: string;
    topics: Topic[];
    questions: Question[];
    unprocessedImages?: string[]; // List of image filenames in unprocessed folder
}

export interface Answer {
    text: string;
    isCorrect: boolean;
    order?: string;
    explanation?: string;
}

export interface Question {
    id: string;
    question: string;
    answers: Answer[];
    topics: string[];
    questionType: 'open' | 'multichoice' | 'truefalse';
    originalText?: string;
    images?: string[];
}

export interface Config {
    folders: string[];
}
