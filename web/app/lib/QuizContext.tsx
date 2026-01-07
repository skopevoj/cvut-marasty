'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Subject } from './types/subject';

interface QuizContextType {
  subjects: Subject[];
  isLoading: boolean;
  error: string | null;
}

const QuizContext = createContext<QuizContextType | undefined>(undefined);

export function QuizProvider({ children }: { children: ReactNode }) {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchSubjects() {
      try {
        const response = await fetch('/subjects.json');
        if (!response.ok) {
          throw new Error('Failed to fetch subjects');
        }
        const data = await response.json();
        setSubjects(data.subjects);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setIsLoading(false);
      }
    }

    fetchSubjects();
  }, []);

  return (
    <QuizContext.Provider value={{ subjects, isLoading, error }}>
      {children}
    </QuizContext.Provider>
  );
}

export function useQuiz() {
  const context = useContext(QuizContext);
  if (context === undefined) {
    throw new Error('useQuiz must be used within a QuizProvider');
  }
  return context;
}
