'use client';

import { createContext, useContext, useEffect, ReactNode, useMemo, useRef, useCallback } from 'react';
import { Subject } from '../types/subject';
import { Question } from '../types/question';
import { SubjectDetails } from '../types/subjectDetails';
import { AnswerState, SortType, QuestionType } from '../types/enums';
import { useStats } from '../context/StatsContext';
import { useSettings } from '../context/SettingsContext';
import { DataProvider, useData } from './DataContext';
import { SessionProvider, useSession } from './SessionContext';
import { FilterProvider, useFilter } from './FilterContext';
import { sortingLogic } from '../business/sortingLogic';
import { EvaluationStrategyFactory } from '../evaluation/evaluationStrategy';
import { statsHelper } from '../helper/statsHelper';

interface QuizContextType {
  // Data
  subjects: Subject[];
  questions: Question[];
  currentSubject: Subject | null;
  currentSubjectDetails: SubjectDetails | null;
  isLoading: boolean;
  error: string | null;

  // Filter
  selectedTopics: string[];
  sortType: SortType;

  // Session
  quizQueue: Question[];
  currentQuestionIndex: number;
  currentQuestion: Question | null;
  shuffledAnswers: any[];
  userAnswers: Record<number, AnswerState>;
  userTextAnswer: string;
  showResults: boolean;
  showOriginalText: boolean;

  // Stats
  currentQuestionStats: {
    totalAnswered: number;
    history: { timestamp: number; isCorrect: boolean }[];
  } | null;

  // Actions
  selectSubject: (subjectCode: string | null) => void;
  toggleTopic: (topicId: string) => void;
  setSortType: (sortType: SortType) => void;
  toggleOriginalText: () => void;
  nextQuestion: () => void;
  prevQuestion: () => void;
  setAnswerState: (index: number, state: AnswerState) => void;
  setTextAnswer: (value: string) => void;
  evaluate: () => void;
  shuffleQueue: () => void;
  goToQuestion: (questionId: string) => void;
}

const QuizContext = createContext<QuizContextType | undefined>(undefined);

function QuizFacade({ children }: { children: ReactNode }) {
  const { attempts, saveAttempt } = useStats();
  const { settings } = useSettings();
  const { subjects, questions, currentSubject, currentSubjectDetails, isLoading, error, selectSubject: rawSelectSubject } = useData();
  const { selectedTopics, sortType, toggleTopic, setSortType, resetFilters } = useFilter();
  const {
    quizQueue, currentQuestionIndex, userAnswers, userTextAnswer, showResults, showOriginalText,
    setQuizQueue, setCurrentQuestionIndex, setUserAnswers, setUserTextAnswer, setShowResults,
    toggleOriginalText, resetSession
  } = useSession();

  const prevFiltersRef = useRef({ subject: null as Subject | null, topics: [] as string[], sort: SortType.ID as SortType });

  // Quiz Queue Logic
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

    filtered = sortingLogic.sortQuestions(filtered, sortType, attempts);
    setQuizQueue(filtered);

    const filtersChanged =
      prevFiltersRef.current.subject !== currentSubject ||
      prevFiltersRef.current.sort !== sortType ||
      JSON.stringify(prevFiltersRef.current.topics) !== JSON.stringify(selectedTopics);

    if (filtersChanged) {
      setCurrentQuestionIndex(0);
      resetSession();
    }

    prevFiltersRef.current = { subject: currentSubject, topics: [...selectedTopics], sort: sortType };
  }, [questions, currentSubject, selectedTopics, sortType, attempts, setQuizQueue, setCurrentQuestionIndex, resetSession]);

  const selectSubject = useCallback(async (code: string | null) => {
    await rawSelectSubject(code);
    resetFilters();
    setCurrentQuestionIndex(0);
    resetSession();
  }, [rawSelectSubject, resetFilters, setCurrentQuestionIndex, resetSession]);

  const currentQuestion = quizQueue[currentQuestionIndex] || null;

  const shuffledAnswers = useMemo(() => {
    if (!currentQuestion || !currentQuestion.answers) return [];

    if (settings.shuffleAnswers) {
      const answers = [...currentQuestion.answers];
      for (let i = answers.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [answers[i], answers[j]] = [answers[j], answers[i]];
      }
      return answers;
    }

    return currentQuestion.answers;
  }, [currentQuestion, settings.shuffleAnswers]);

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

  const nextQuestion = useCallback(() => {
    if (currentQuestionIndex < quizQueue.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      resetSession();
    }
  }, [currentQuestionIndex, quizQueue.length, setCurrentQuestionIndex, resetSession]);

  const prevQuestion = useCallback(() => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
      resetSession();
    }
  }, [currentQuestionIndex, setCurrentQuestionIndex, resetSession]);

  const setAnswerState = useCallback((index: number, state: AnswerState) => {
    if (showResults) return;
    setUserAnswers({
      ...userAnswers,
      [index]: state
    });
  }, [showResults, userAnswers, setUserAnswers]);

  const setTextAnswer = useCallback((value: string) => {
    if (showResults) return;
    setUserTextAnswer(value);
  }, [showResults, setUserTextAnswer]);

  const evaluate = useCallback(() => {
    if (!currentQuestion) return;

    const strategy = EvaluationStrategyFactory.getStrategy(currentQuestion.questionType || QuestionType.MULTICHOICE);
    const result = strategy.evaluate(currentQuestion, userAnswers, userTextAnswer, shuffledAnswers);

    saveAttempt({
      questionId: currentQuestion.id || 'unknown',
      subjectCode: currentQuestion.subjectCode,
      topic: currentQuestion.topics?.[0] || 'unknown',
      topics: currentQuestion.topics,
      timestamp: Date.now(),
      type: (currentQuestion.questionType?.toLowerCase() || QuestionType.MULTICHOICE) as any,
      userAnswers: result.statsUserAnswers
    });

    setShowResults(true);
  }, [currentQuestion, userAnswers, userTextAnswer, shuffledAnswers, saveAttempt, setShowResults]);

  const shuffleQueue = useCallback(() => {
    const shuffled = [...quizQueue];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    setQuizQueue(shuffled);
    setCurrentQuestionIndex(0);
    resetSession();
  }, [quizQueue, setQuizQueue, setCurrentQuestionIndex, resetSession]);

  const goToQuestion = useCallback(async (questionId: string) => {
    const q = questions.find(item => item.id === questionId);
    if (!q) return;

    if (!currentSubject || currentSubject.code !== q.subjectCode) {
      await selectSubject(q.subjectCode);
    }

    // After selectSubject, questions might update. We need to find the index.
    // This is a bit tricky with async. The old implementation used targetQuestionId state.
    // For now, let's just find it in the current queue if possible.
    const index = quizQueue.findIndex(item => item.id === questionId);
    if (index !== -1) {
      setCurrentQuestionIndex(index);
      resetSession();
    }
  }, [questions, currentSubject, selectSubject, quizQueue, setCurrentQuestionIndex, resetSession]);

  return (
    <QuizContext.Provider value={{
      subjects, questions, currentSubject, currentSubjectDetails, isLoading, error,
      selectedTopics, sortType,
      quizQueue, currentQuestionIndex, currentQuestion, shuffledAnswers,
      userAnswers, userTextAnswer, showResults, showOriginalText,
      currentQuestionStats,
      selectSubject, toggleTopic, setSortType, toggleOriginalText,
      nextQuestion, prevQuestion, setAnswerState, setTextAnswer,
      evaluate, shuffleQueue, goToQuestion
    }}>
      {children}
    </QuizContext.Provider>
  );
}

export function QuizProvider({ children }: { children: ReactNode }) {
  return (
    <DataProvider>
      <FilterProvider>
        <SessionProvider>
          <QuizFacade>
            {children}
          </QuizFacade>
        </SessionProvider>
      </FilterProvider>
    </DataProvider>
  );
}

export function useQuiz() {
  const context = useContext(QuizContext);
  if (context === undefined) {
    throw new Error('useQuiz must be used within a QuizProvider');
  }
  return context;
}

