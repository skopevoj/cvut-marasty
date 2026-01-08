'use client';

import { createContext, useContext, useEffect, useState, ReactNode, useMemo } from 'react';
import { Subject } from './types/subject';
import { Question } from './types/question';
import { statsHelper } from './statsHelper';
import { useStats } from './StatsContext';

interface QuizContextType {
  subjects: Subject[];
  questions: Question[];
  currentSubject: Subject | null;
  currentSubjectDetails: any | null;
  selectedTopics: string[];
  quizQueue: Question[];
  currentQuestionIndex: number;
  currentQuestion: Question | null;
  currentQuestionStats: {
    totalAnswered: number;
    history: { timestamp: number; isCorrect: boolean }[];
  } | null;
  userAnswers: Record<number, number>;
  userTextAnswer: string;
  showResults: boolean;
  showOriginalText: boolean;
  isLoading: boolean;
  error: string | null;
  selectSubject: (subjectCode: string | null) => void;
  toggleTopic: (topicId: string) => void;
  toggleOriginalText: () => void;
  nextQuestion: () => void;
  prevQuestion: () => void;
  setAnswerState: (index: number, state: number) => void;
  setTextAnswer: (value: string) => void;
  evaluate: () => void;
  shuffleQueue: () => void;
  goToQuestion: (questionId: string) => void;
}

const QuizContext = createContext<QuizContextType | undefined>(undefined);

export function QuizProvider({ children }: { children: ReactNode }) {
  const { attempts, saveAttempt } = useStats();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [currentSubject, setCurrentSubject] = useState<Subject | null>(null);
  const [currentSubjectDetails, setCurrentSubjectDetails] = useState<any | null>(null);
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [quizQueue, setQuizQueue] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<number, number>>({});
  const [userTextAnswer, setUserTextAnswer] = useState<string>("");
  const [showResults, setShowResults] = useState(false);
  const [showOriginalText, setShowOriginalText] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        const subRes = await fetch('subjects.json');
        const { subjects: subList } = await subRes.json();
        setSubjects(subList);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, []);

  useEffect(() => {
    if (!currentSubject) {
      setQuizQueue([]);
      return;
    }
    const filtered = questions.filter(q =>
      q.subjectCode === currentSubject.code &&
      (selectedTopics.length === 0 ||
        (q.topics || []).some((id: string) => selectedTopics.includes(id))
      )
    );
    setQuizQueue(filtered);
  }, [questions, currentSubject, selectedTopics]);

  const selectSubject = async (code: string | null) => {
    const sub = subjects.find(s => s.code === code) || null;
    setCurrentSubject(sub);

    if (sub) {
      setIsLoading(true);
      try {
        // Load both subject details and questions in parallel
        const [subDetailsRes, qListRes] = await Promise.all([
          fetch(`subjects/${sub.code}/subject.json`),
          fetch(`subjects/${sub.code}/questions.json`)
        ]);

        if (subDetailsRes.ok) {
          const subDetails = await subDetailsRes.json();
          setCurrentSubjectDetails(subDetails);
        }

        if (qListRes.ok) {
          const data = await qListRes.json();
          setQuestions(data.questions || []);
        } else {
          setQuestions([]);
        }
      } catch (err) {
        console.error('Error loading subject data:', err);
        setQuestions([]);
      } finally {
        setIsLoading(false);
      }
    } else {
      setCurrentSubjectDetails(null);
      setQuestions([]);
    }

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

  const toggleOriginalText = () => {
    setShowOriginalText(prev => !prev);
  };

  const shuffleQueue = () => {
    setQuizQueue(prev => {
      const newQueue = [...prev];
      for (let i = newQueue.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newQueue[i], newQueue[j]] = [newQueue[j], newQueue[i]];
      }
      return newQueue;
    });
    setCurrentQuestionIndex(0);
    setUserAnswers({});
    setUserTextAnswer("");
    setShowResults(false);
  };

  const goToQuestion = async (questionId: string) => {
    const q = questions.find(item => item.id === questionId);
    if (!q) return;

    if (!currentSubject || currentSubject.code !== q.subjectCode) {
      await selectSubject(q.subjectCode);
    }

    setSelectedTopics([]);

    const filteredQuestions = questions.filter(item =>
      item.subjectCode === q.subjectCode
    );
    const index = filteredQuestions.findIndex(item => item.id === q.id);

    if (index !== -1) {
      setCurrentQuestionIndex(index);
      setUserAnswers({});
      setUserTextAnswer("");
      setShowResults(false);
    }
  };

  const currentQuestion = quizQueue[currentQuestionIndex] || null;

  const currentQuestionStats = useMemo(() => {
    if (!currentQuestion) return null;
    const questionAttempts = attempts
      .filter(a => a.questionId === currentQuestion.id)
      .sort((a, b) => b.timestamp - a.timestamp);

    return {
      totalAnswered: questionAttempts.length,
      history: questionAttempts.map(a => ({
        timestamp: a.timestamp,
        isCorrect: statsHelper.isAttemptCorrect(a, currentQuestion)
      }))
    };
  }, [currentQuestion, attempts]);

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
    if (!currentQuestion) return;

    let isCorrect = false;
    const qType = (currentQuestion.questionType || 'multichoice').toLowerCase();

    if (qType === 'open') {
      const correctAnswers = (currentQuestion.answers || [])
        .filter((a) => a.isCorrect)
        .map((a) => (a.text || "").trim());
      isCorrect = correctAnswers.some(c => c === (userTextAnswer || "").trim());
    } else {
      // For multichoice, check if all correct answers are correctly identified
      isCorrect = currentQuestion.answers.every((ans, i) => {
        const isActuallyCorrect = !!ans.isCorrect;
        const userState = userAnswers[i] || 0;
        return (userState === 1 && isActuallyCorrect) || (userState === 3 && !isActuallyCorrect);
      });
    }

    const statsUserAnswers = qType === 'open'
      ? userTextAnswer
      : currentQuestion.answers.reduce((acc, ans, i) => {
        acc[ans.index ?? i] = userAnswers[i] || 0;
        return acc;
      }, {} as Record<number, number>);

    saveAttempt({
      questionId: currentQuestion.id || 'unknown',
      subjectCode: currentQuestion.subjectCode,
      topic: currentQuestion.topics?.[0] || 'unknown',
      topics: currentQuestion.topics,
      timestamp: Date.now(),
      type: qType as any,
      userAnswers: statsUserAnswers
    });

    setShowResults(true);
  };

  return (
    <QuizContext.Provider value={{
      subjects, questions, currentSubject, currentSubjectDetails, selectedTopics,
      quizQueue, currentQuestionIndex, currentQuestion, currentQuestionStats,
      userAnswers, userTextAnswer, showResults, showOriginalText,
      isLoading, error, selectSubject, toggleTopic, toggleOriginalText, nextQuestion, prevQuestion,
      setAnswerState, setTextAnswer, evaluate, shuffleQueue, goToQuestion
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
