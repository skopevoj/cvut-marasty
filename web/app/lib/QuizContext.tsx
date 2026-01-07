'use client';

import { createContext, useContext, useEffect, useState, ReactNode, useMemo } from 'react';
import { Subject } from './types/subject';
import { Question } from './types/question';

interface QuizContextType {
  subjects: Subject[];
  questions: Question[];
  currentSubject: Subject | null;
  selectedTopics: string[];
  quizQueue: Question[];
  currentQuestionIndex: number;
  currentQuestion: Question | null;
  userAnswers: Record<number, number>;
  userTextAnswer: string;
  showResults: boolean;
  isLoading: boolean;
  error: string | null;
  selectSubject: (subjectCode: string | null) => void;
  toggleTopic: (topicId: string) => void;
  nextQuestion: () => void;
  prevQuestion: () => void;
  setAnswerState: (index: number, state: number) => void;
  setTextAnswer: (value: string) => void;
  evaluate: () => void;
}

const QuizContext = createContext<QuizContextType | undefined>(undefined);

export function QuizProvider({ children }: { children: ReactNode }) {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [currentSubject, setCurrentSubject] = useState<Subject | null>(null);
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<number, number>>({});
  const [userTextAnswer, setUserTextAnswer] = useState<string>("");
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        const subRes = await fetch('/subjects.json');
        const { subjects: subList } = await subRes.json();
        setSubjects(subList);

        const allQuestions: Question[] = [];
        for (const sub of subList) {
          const qListRes = await fetch(`/subjects/${sub.code}/questions.json`);
          if (!qListRes.ok) continue;
          const { topics } = await qListRes.json();

          for (const [topicName, topicData] of Object.entries(topics) as any) {
            for (const qid of topicData.questions) {
              const qRes = await fetch(`/subjects/${sub.code}/topics/${topicName}/${qid}/question.json`);
              if (qRes.ok) {
                const qData = await qRes.json();

                allQuestions.push({
                  ...qData,
                  subjectCode: sub.code,
                  id: qid,
                  topic: topicName
                });
              }
            }
          }
        }
        setQuestions(allQuestions);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, []);

  const selectSubject = (code: string | null) => {
    const sub = subjects.find(s => s.code === code) || null;
    setCurrentSubject(sub);
    setSelectedTopics([]);
    setCurrentQuestionIndex(0);
    setUserAnswers({});
    setUserTextAnswer("");
    setShowResults(false);
  };

  const toggleTopic = (topicId: string) => {
    setSelectedTopics(prev =>
      prev.includes(topicId) ? prev.filter(id => id !== topicId) : [...prev, topicId]
    );
    setCurrentQuestionIndex(0);
    setUserAnswers({});
    setUserTextAnswer("");
    setShowResults(false);
  };

  const quizQueue = useMemo(() => {
    if (!currentSubject) return [];
    return questions.filter(q =>
      q.subjectCode === currentSubject.code &&
      (selectedTopics.length === 0 || selectedTopics.includes(q.topic))
    );
  }, [questions, currentSubject, selectedTopics]);

  const currentQuestion = quizQueue[currentQuestionIndex] || null;

  const nextQuestion = () => {
    if (currentQuestionIndex < quizQueue.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setUserAnswers({});
      setUserTextAnswer("");
      setShowResults(false);
    }
  };

  const prevQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
      setUserAnswers({});
      setUserTextAnswer("");
      setShowResults(false);
    }
  };

  const setAnswerState = (index: number, state: number) => {
    if (showResults) return;
    setUserAnswers(prev => {
      const newAnswers = { ...prev };
      if (state === 0) {
        delete newAnswers[index];
      } else {
        newAnswers[index] = state;
      }
      return newAnswers;
    });
  };

  const setTextAnswer = (value: string) => {
    if (showResults) return;
    setUserTextAnswer(value);
  };

  const evaluate = () => {
    setShowResults(true);
  };

  return (
    <QuizContext.Provider value={{
      subjects, questions, currentSubject, selectedTopics,
      quizQueue, currentQuestionIndex, currentQuestion,
      userAnswers, userTextAnswer, showResults,
      isLoading, error, selectSubject, toggleTopic, nextQuestion, prevQuestion,
      setAnswerState, setTextAnswer, evaluate
    }}>
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
