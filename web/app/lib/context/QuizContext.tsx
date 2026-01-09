'use client';

import { createContext, useContext, useEffect, useState, ReactNode, useMemo, useRef } from 'react';
import { Subject } from '../types/subject';
import { Question } from '../types/question';
import { statsHelper } from '../helper/statsHelper';
import { useStats } from '../context/StatsContext';
import { useSettings } from '../context/SettingsContext';

export type SortType = 'random' | 'id' | 'least-answered' | 'worst-ratio';

interface QuizContextType {
  subjects: Subject[];
  questions: Question[];
  currentSubject: Subject | null;
  currentSubjectDetails: any | null;
  selectedTopics: string[];
  sortType: SortType;
  quizQueue: Question[];
  currentQuestionIndex: number;
  currentQuestion: Question | null;
  shuffledAnswers: any[];
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
  setSortType: (sortType: SortType) => void;
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
  const { settings } = useSettings();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [currentSubject, setCurrentSubject] = useState<Subject | null>(null);
  const [currentSubjectDetails, setCurrentSubjectDetails] = useState<any | null>(null);
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [sortType, setSortType] = useState<SortType>('id');
  const [quizQueue, setQuizQueue] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<number, number>>({});
  const [userTextAnswer, setUserTextAnswer] = useState<string>("");
  const [showResults, setShowResults] = useState(false);
  const [showOriginalText, setShowOriginalText] = useState(false);
  const [targetQuestionId, setTargetQuestionId] = useState<string | null>(null);

  const prevFiltersRef = useRef({ subject: null as Subject | null, topics: [] as string[], sort: 'id' as SortType });

  useEffect(() => {
    if (currentSubjectDetails) {
      document.documentElement.style.setProperty('--subject-primary', currentSubjectDetails.primaryColor);
      document.documentElement.style.setProperty('--subject-secondary', currentSubjectDetails.secondaryColor);
    }
  }, [currentSubjectDetails]);

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
    let filtered = questions.filter(q =>
      q.subjectCode === currentSubject.code &&
      (selectedTopics.length === 0 ||
        (q.topics || []).some((id: string) => selectedTopics.includes(id))
      )
    );

    if (sortType === 'id') {
      filtered.sort((a, b) => a.id.localeCompare(b.id));
    } else if (sortType === 'least-answered') {
      const counts = attempts.reduce((acc, a) => {
        acc[a.questionId] = (acc[a.questionId] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      filtered.sort((a, b) => {
        const countA = counts[a.id] || 0;
        const countB = counts[b.id] || 0;
        if (countA === countB) return a.id.localeCompare(b.id);
        return countA - countB;
      });
    } else if (sortType === 'worst-ratio') {
      const stats = filtered.reduce((acc, q) => {
        const qAttempts = attempts.filter(a => a.questionId === q.id);
        const total = qAttempts.length;
        if (total === 0) {
          acc[q.id] = 2; // Value > 1 to put unanswered at the end
          return acc;
        }
        const correct = qAttempts.filter(a => statsHelper.isAttemptCorrect(a, q)).length;
        acc[q.id] = correct / total;
        return acc;
      }, {} as Record<string, number>);

      filtered.sort((a, b) => {
        const ratioA = stats[a.id];
        const ratioB = stats[b.id];
        if (ratioA === ratioB) return a.id.localeCompare(b.id);
        return ratioA - ratioB;
      });
    } else if (sortType === 'random') {
      // Fisher-Yates shuffle
      for (let i = filtered.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [filtered[i], filtered[j]] = [filtered[j], filtered[i]];
      }
    }

    setQuizQueue(filtered);

    if (targetQuestionId) {
      const index = filtered.findIndex(q => q.id === targetQuestionId);
      if (index !== -1) {
        setCurrentQuestionIndex(index);
        setTargetQuestionId(null);
        setUserAnswers({});
        setUserTextAnswer("");
        setShowResults(false);
      }
    } else {
      const filtersChanged =
        prevFiltersRef.current.subject !== currentSubject ||
        prevFiltersRef.current.sort !== sortType ||
        JSON.stringify(prevFiltersRef.current.topics) !== JSON.stringify(selectedTopics);

      if (filtersChanged) {
        setCurrentQuestionIndex(0);
        setUserAnswers({});
        setUserTextAnswer("");
        setShowResults(false);
      }
    }

    prevFiltersRef.current = { subject: currentSubject, topics: [...selectedTopics], sort: sortType };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [questions, currentSubject, selectedTopics, sortType, targetQuestionId]);

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
    // Remove manual index reset here as goToQuestion will handle navigation
    // setCurrentQuestionIndex(0);
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
    // Try current questions first
    let q = questions.find(item => item.id === questionId);

    // If not found and we have subjects, we might need to load another subject
    // But for now, search and favorites are filtered by the active subject's questions
    if (!q) return;

    if (!currentSubject || currentSubject.code !== q.subjectCode) {
      await selectSubject(q.subjectCode);
    }

    setTargetQuestionId(questionId);
    setSelectedTopics([]);
  };

  const currentQuestion = quizQueue[currentQuestionIndex] || null;

  const shuffledAnswers = useMemo(() => {
    if (!currentQuestion || !currentQuestion.answers) return [];

    if (settings.shuffleAnswers) {
      const answers = [...currentQuestion.answers];
      // Fisher-Yates shuffle
      for (let i = answers.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [answers[i], answers[j]] = [answers[j], answers[i]];
      }
      return answers;
    }

    return currentQuestion.answers;
  }, [currentQuestion, currentQuestionIndex, settings.shuffleAnswers]);

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
      isCorrect = shuffledAnswers.every((ans, i) => {
        const isActuallyCorrect = !!ans.isCorrect;
        const userState = userAnswers[i] || 0;
        return (userState === 1 && isActuallyCorrect) || (userState === 3 && !isActuallyCorrect);
      });
    }

    const statsUserAnswers = qType === 'open'
      ? userTextAnswer
      : shuffledAnswers.reduce((acc, ans, i) => {
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
      subjects, questions, currentSubject, currentSubjectDetails, selectedTopics, sortType,
      quizQueue, currentQuestionIndex, currentQuestion, shuffledAnswers, currentQuestionStats,
      userAnswers, userTextAnswer, showResults, showOriginalText,
      isLoading, error, selectSubject, toggleTopic, setSortType, toggleOriginalText, nextQuestion, prevQuestion,
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
