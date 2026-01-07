'use client';

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { statsHelper, QuestionAttempt } from './statsHelper';

interface StatsContextType {
    attempts: QuestionAttempt[];
    refreshStats: () => void;
    saveAttempt: (attempt: QuestionAttempt) => void;
}

const StatsContext = createContext<StatsContextType | undefined>(undefined);

export function StatsProvider({ children }: { children: ReactNode }) {
    const [attempts, setAttempts] = useState<QuestionAttempt[]>([]);

    const refreshStats = useCallback(() => {
        setAttempts(statsHelper.getAttempts());
    }, []);

    useEffect(() => {
        refreshStats();
    }, [refreshStats]);

    const saveAttempt = useCallback((attempt: QuestionAttempt) => {
        statsHelper.saveAttempt(attempt);
        refreshStats();
    }, [refreshStats]);

    return (
        <StatsContext.Provider value={{ attempts, refreshStats, saveAttempt }}>
            {children}
        </StatsContext.Provider>
    );
}

export function useStats() {
    const context = useContext(StatsContext);
    if (context === undefined) {
        throw new Error('useStats must be used within a StatsProvider');
    }
    return context;
}
