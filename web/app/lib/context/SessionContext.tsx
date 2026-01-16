'use client';

import { createContext, useContext, useState, ReactNode, useMemo, useCallback, useEffect } from 'react';
import { Question } from '../types/question';
import { AnswerState } from '../types/enums';

interface PeerAnswerState {
    peerId: string;
    peerName?: string;
    answers: Record<number, AnswerState>;
}

interface SessionContextType {
    quizQueue: Question[];
    currentQuestionIndex: number;
    userAnswers: Record<number, AnswerState>;
    userTextAnswer: string;
    showResults: boolean;
    showOriginalText: boolean;
    peerAnswers: Record<string, PeerAnswerState>;
    setQuizQueue: (queue: Question[]) => void;
    setCurrentQuestionIndex: (index: number) => void;
    setUserAnswers: (answers: Record<number, AnswerState> | ((prev: Record<number, AnswerState>) => Record<number, AnswerState>)) => void;
    setUserTextAnswer: (answer: string) => void;
    setShowResults: (show: boolean) => void;
    setPeerAnswers: (answers: Record<string, PeerAnswerState> | ((prev: Record<string, PeerAnswerState>) => Record<string, PeerAnswerState>)) => void;
    toggleOriginalText: () => void;
    resetSession: () => void;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export function SessionProvider({ children }: { children: ReactNode }) {
    const [quizQueue, setQuizQueue] = useState<Question[]>([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [userAnswers, setUserAnswers] = useState<Record<number, AnswerState>>({});
    const [userTextAnswer, setUserTextAnswer] = useState<string>("");
    const [showResults, setShowResults] = useState(false);
    const [showOriginalText, setShowOriginalText] = useState(false);
    const [peerAnswers, setPeerAnswers] = useState<Record<string, PeerAnswerState>>({});

    const toggleOriginalText = useCallback(() => setShowOriginalText(prev => !prev), []);

    const resetSession = useCallback(() => {
        setUserAnswers({});
        setUserTextAnswer("");
        setShowResults(false);
    }, []);

    const value = useMemo(() => ({
        quizQueue, currentQuestionIndex, userAnswers, userTextAnswer, showResults, showOriginalText, peerAnswers,
        setQuizQueue, setCurrentQuestionIndex, setUserAnswers, setUserTextAnswer, setShowResults, setPeerAnswers,
        toggleOriginalText, resetSession
    }), [quizQueue, currentQuestionIndex, userAnswers, userTextAnswer, showResults, showOriginalText, peerAnswers, toggleOriginalText, resetSession]);

    return (
        <SessionContext.Provider value={value}>
            {children}
        </SessionContext.Provider>
    );
}

export function useSession() {
    const context = useContext(SessionContext);
    if (context === undefined) throw new Error('useSession must be used within a SessionProvider');
    return context;
}
