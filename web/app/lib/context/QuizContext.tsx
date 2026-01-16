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
import { usePeer } from './PeerContext';

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

  // Peer collaboration
  isInPeerRoom: boolean;
  peerAnswersData: Record<string, any>;

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
    toggleOriginalText, resetSession, setPeerAnswers, peerAnswers
  } = useSession();
  const { isConnected, broadcastMessage } = usePeer();

  const prevFiltersRef = useRef({
    subject: null as Subject | null,
    topics: [] as string[],
    sort: SortType.ID as SortType,
    questionsLength: 0
  });

  // Quiz Queue Logic
  useEffect(() => {
    if (!currentSubject) {
      setQuizQueue([]);
      return;
    }

    const filtersChanged =
      prevFiltersRef.current.subject !== currentSubject ||
      prevFiltersRef.current.sort !== sortType ||
      prevFiltersRef.current.questionsLength !== questions.length ||
      JSON.stringify(prevFiltersRef.current.topics) !== JSON.stringify(selectedTopics);

    if (filtersChanged) {
      let filtered = questions.filter(q =>
        q.subjectCode === currentSubject.code &&
        (selectedTopics.length === 0 ||
          (q.topics || []).some((id: string) => selectedTopics.includes(id))
        )
      );

      filtered = sortingLogic.sortQuestions(filtered, sortType, attempts);
      setQuizQueue(filtered);
      setCurrentQuestionIndex(0);
      resetSession();

      prevFiltersRef.current = {
        subject: currentSubject,
        topics: [...selectedTopics],
        sort: sortType,
        questionsLength: questions.length
      };
    }
  }, [questions, currentSubject, selectedTopics, sortType, attempts, setQuizQueue, setCurrentQuestionIndex, resetSession]);

  const selectSubject = useCallback(async (code: string | null) => {
    await rawSelectSubject(code);
    resetFilters();
    setCurrentQuestionIndex(0);
    resetSession();
  }, [rawSelectSubject, resetFilters, setCurrentQuestionIndex, resetSession]);

  const currentQuestion = quizQueue[currentQuestionIndex] || null;

  // Handle peer answer updates
  useEffect(() => {
    const handleAnswerUpdate = (message: any) => {
      const { data, senderId } = message;
      console.log('[Peer] Received answer update:', data);
      // Only apply answer updates for the current question
      if (data.questionId === currentQuestion?.id) {
        // Synchronize local state with what was sent
        console.log('[Peer] Applying answer update:', data.allAnswers);
        setUserAnswers(data.allAnswers || {});
      }
    };

    const handleNavigate = (message: any) => {
      const { data } = message;
      console.log('[Peer] Received navigate to question ID:', data.questionId);
      // Find the question by ID in our local queue
      const questionIndex = quizQueue.findIndex(q => q.id === data.questionId);
      if (questionIndex !== -1) {
        console.log('[Peer] Found question at index:', questionIndex);
        setCurrentQuestionIndex(questionIndex);
        resetSession();
      } else {
        console.warn('[Peer] Question not found in local queue:', data.questionId);
      }
    };

    const handleEvaluate = (message: any) => {
      const { data } = message;
      console.log('[Peer] Received evaluate:', data);
      // Show results when someone evaluates
      if (data.questionId === currentQuestion?.id) {
        // Make sure we have the same answers
        if (data.userAnswers) {
          setUserAnswers(data.userAnswers);
        }
        setShowResults(true);
      }
    };

    if ((window as any).__registerPeerMessageHandler) {
      (window as any).__registerPeerMessageHandler('answer-update', handleAnswerUpdate);
      (window as any).__registerPeerMessageHandler('navigate', handleNavigate);
      (window as any).__registerPeerMessageHandler('evaluate', handleEvaluate);

      // Handle sync request from new members
      (window as any).__registerPeerMessageHandler('sync-request', (message: any) => {
        if (isConnected) {
          broadcastMessage({
            type: 'sync-response',
            data: {
              index: currentQuestionIndex,
              userAnswers: userAnswers,
              showResults: showResults,
              questionId: currentQuestion?.id
            }
          });
        }
      });

      // Handle sync response when joining
      (window as any).__registerPeerMessageHandler('sync-response', (message: any) => {
        const { data } = message;
        // Only apply sync if we're on the same question or navigate if needed
        setCurrentQuestionIndex(data.index);
        setUserAnswers(data.userAnswers || {});
        setShowResults(data.showResults || false);
      });
    }

    return () => {
      if ((window as any).__unregisterPeerMessageHandler) {
        (window as any).__unregisterPeerMessageHandler('answer-update');
        (window as any).__unregisterPeerMessageHandler('navigate');
        (window as any).__unregisterPeerMessageHandler('evaluate');
        (window as any).__unregisterPeerMessageHandler('sync-request');
        (window as any).__unregisterPeerMessageHandler('sync-response');
      }
    };
  }, [currentQuestion?.id, setPeerAnswers, setUserAnswers, setCurrentQuestionIndex, resetSession, setShowResults, isConnected, broadcastMessage, currentQuestionIndex, userAnswers, showResults, quizQueue]);

  const shuffledAnswers = useMemo(() => {
    if (!currentQuestion || !currentQuestion.answers) return [];

    // Disable shuffle when in peer room to keep everyone synchronized
    if (settings.shuffleAnswers && !isConnected) {
      const answers = [...currentQuestion.answers];
      for (let i = answers.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [answers[i], answers[j]] = [answers[j], answers[i]];
      }
      return answers;
    }

    return currentQuestion.answers;
  }, [currentQuestion, settings.shuffleAnswers, isConnected]);

  const currentQuestionStats = useMemo(() => {
    if (!currentQuestion) return null;
    const items = Array.isArray(attempts) ? attempts : [];
    const questionAttempts = items
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
      const nextIndex = currentQuestionIndex + 1;
      const nextQ = quizQueue[nextIndex];
      setCurrentQuestionIndex(nextIndex);
      resetSession();

      if (isConnected && nextQ) {
        console.log('[Peer] Broadcasting navigate to question ID:', nextQ.id);
        broadcastMessage({
          type: 'navigate',
          data: { questionId: nextQ.id }
        });
      }
    }
  }, [currentQuestionIndex, quizQueue, setCurrentQuestionIndex, resetSession, isConnected, broadcastMessage]);

  const prevQuestion = useCallback(() => {
    if (currentQuestionIndex > 0) {
      const prevIndex = currentQuestionIndex - 1;
      const prevQ = quizQueue[prevIndex];
      setCurrentQuestionIndex(prevIndex);
      resetSession();

      if (isConnected && prevQ) {
        console.log('[Peer] Broadcasting navigate to question ID:', prevQ.id);
        broadcastMessage({
          type: 'navigate',
          data: { questionId: prevQ.id }
        });
      }
    }
  }, [currentQuestionIndex, quizQueue, setCurrentQuestionIndex, resetSession, isConnected, broadcastMessage]);

  const setAnswerState = useCallback((index: number, state: AnswerState) => {
    if (showResults) return;

    setUserAnswers(prev => {
      const newAnswers = {
        ...prev,
        [index]: state
      };

      console.log('[Peer] Setting answer state:', { index, state, newAnswers });

      // Broadcast answer update to peers if in a room
      if (isConnected) {
        console.log('[Peer] Broadcasting answer update');
        broadcastMessage({
          type: 'answer-update',
          data: {
            index,
            state,
            questionId: currentQuestion?.id,
            allAnswers: newAnswers
          }
        });
      }
      return newAnswers;
    });
  }, [showResults, setUserAnswers, isConnected, broadcastMessage, currentQuestion]);

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

    // Broadcast evaluation to all peers
    if (isConnected) {
      console.log('[Peer] Broadcasting evaluate');
      broadcastMessage({
        type: 'evaluate',
        data: {
          questionId: currentQuestion.id,
          userAnswers: userAnswers
        }
      });
    }
  }, [currentQuestion, userAnswers, userTextAnswer, shuffledAnswers, saveAttempt, setShowResults, isConnected, broadcastMessage]);

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

    const index = quizQueue.findIndex(item => item.id === questionId);
    if (index !== -1) {
      setCurrentQuestionIndex(index);
      resetSession();

      if (isConnected) {
        console.log('[Peer] Broadcasting navigate to question ID:', questionId);
        broadcastMessage({
          type: 'navigate',
          data: { questionId }
        });
      }
    }
  }, [questions, currentSubject, selectSubject, quizQueue, setCurrentQuestionIndex, resetSession, isConnected, broadcastMessage]);

  return (
    <QuizContext.Provider value={{
      subjects, questions, currentSubject, currentSubjectDetails, isLoading, error,
      selectedTopics, sortType,
      quizQueue, currentQuestionIndex, currentQuestion, shuffledAnswers,
      userAnswers, userTextAnswer, showResults, showOriginalText,
      currentQuestionStats,
      isInPeerRoom: isConnected,
      peerAnswersData: peerAnswers,
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

