'use client';

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { Subject } from '../types/subject';
import { Question } from '../types/question';
import { SubjectDetails } from '../types/subjectDetails';

interface DataContextType {
    subjects: Subject[];
    questions: Question[];
    currentSubject: Subject | null;
    currentSubjectDetails: SubjectDetails | null;
    isLoading: boolean;
    error: string | null;
    selectSubject: (code: string | null) => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || '';

export function DataProvider({ children }: { children: ReactNode }) {
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [questions, setQuestions] = useState<Question[]>([]);
    const [currentSubject, setCurrentSubject] = useState<Subject | null>(null);
    const [currentSubjectDetails, setCurrentSubjectDetails] = useState<SubjectDetails | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchSubjects() {
            try {
                const res = await fetch(`${BASE_PATH}/subjects.json`);
                const { subjects: list } = await res.json();
                setSubjects(list);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to fetch subjects');
            } finally {
                setIsLoading(false);
            }
        }
        fetchSubjects();
    }, []);

    const selectSubject = useCallback(async (code: string | null) => {
        if (!code) {
            setCurrentSubject(null);
            setCurrentSubjectDetails(null);
            setQuestions([]);
            return;
        }

        const sub = subjects.find(s => s.code === code);
        if (!sub) return;

        setCurrentSubject(sub);
        setIsLoading(true);

        try {
            const [detailsRes, questionsRes] = await Promise.all([
                fetch(`${BASE_PATH}/subjects/${code}/subject.json?t=${Date.now()}`),
                fetch(`${BASE_PATH}/subjects/${code}/questions.json?t=${Date.now()}`)
            ]);

            if (detailsRes.ok) {
                const details = await detailsRes.json();
                setCurrentSubjectDetails(details);
            }

            if (questionsRes.ok) {
                const data = await questionsRes.json();
                setQuestions(data.questions || []);
            }
        } catch (err) {
            console.error('Error loading subject data:', err);
            setQuestions([]);
        } finally {
            setIsLoading(false);
        }
    }, [subjects]);

    useEffect(() => {
        if (currentSubjectDetails) {
            document.documentElement.style.setProperty('--subject-primary', currentSubjectDetails.primaryColor);
            document.documentElement.style.setProperty('--subject-secondary', currentSubjectDetails.secondaryColor);
        }
    }, [currentSubjectDetails]);

    return (
        <DataContext.Provider value={{
            subjects, questions, currentSubject, currentSubjectDetails,
            isLoading, error, selectSubject
        }}>
            {children}
        </DataContext.Provider>
    );
}

export function useData() {
    const context = useContext(DataContext);
    if (context === undefined) throw new Error('useData must be used within a DataProvider');
    return context;
}
