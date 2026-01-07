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
  const { attempts, saveAttempt } = useStats();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [currentSubject, setCurrentSubject] = useState<Subject | null>(null);
  const [currentSubjectDetails, setCurrentSubjectDetails] = useState<any | null>(null);
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<number, number>>({});
  const [userTextAnswer, setUserTextAnswer] = useState<string>("");
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        const subRes = await fetch('subjects.json');
        const { subjects: subList } = await subRes.json();
        setSubjects(subList);

        const allQuestions: Question[] = [];
        for (const sub of subList) {
          const qListRes = await fetch(`subjects/${sub.code}/questions.json`);
          if (!qListRes.ok) continue;
          const { topics } = await qListRes.json();

          // Map topic IDs to names from the subject data
          const topicMap = (sub.topics || []).reduce((acc: any, t: any) => {
            acc[t.id] = t.name;
            return acc;
          }, {});

          for (const [topicId, topicData] of Object.entries(topics) as any) {
            for (const qid of topicData.questions) {
              const qRes = await fetch(`subjects/${sub.code}/topics/${topicId}/${qid}/question.json`);
              if (qRes.ok) {
                const qData = await qRes.json();
                const questionPath = `subjects/${sub.code}/topics/${topicId}/${qid}`;

                const answersWithIndex = (qData.answers || []).map((a: any, index: number) => ({
                  ...a,
                  index: index + 1
                }));

                allQuestions.push({
                  ...qData,
                  answers: answersWithIndex,
                  subjectCode: sub.code,
                  id: qid,
                  topic: topicId,
                  topicName: topicMap[topicId] || topicId,
                  photo: qData.photo === true ? `${questionPath}/photo.png` : qData.photo,
                  quizPhoto: qData.quizPhoto === true ? `${questionPath}/quiz.png` : qData.quizPhoto
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

  const selectSubject = async (code: string | null) => {
    const sub = subjects.find(s => s.code === code) || null;
    setCurrentSubject(sub);

    if (sub) {
      try {
        const subDetailsRes = await fetch(`subjects/${sub.code}/subject.json`);
        if (subDetailsRes.ok) {
          const subDetails = await subDetailsRes.json();
          setCurrentSubjectDetails(subDetails);
        }
      } catch (err) {
        console.error('Error loading subject details:', err);
      }
    } else {
      setCurrentSubjectDetails(null);
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

  const quizQueue = useMemo(() => {
    if (!currentSubject) return [];
    return questions.filter(q =>
      q.subjectCode === currentSubject.code &&
      (selectedTopics.length === 0 || selectedTopics.includes(q.topic))
    );
  }, [questions, currentSubject, selectedTopics]);

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
    const qType = (currentQuestion.questionType || currentQuestion.question_type || 'multichoice').toLowerCase();

    if (qType === 'open') {
      const correctAnswers = (currentQuestion.answers || [])
        .filter((a: any) => a.isCorrect ?? a.is_correct ?? false)
        .map((a) => (a.text || "").trim());
      isCorrect = correctAnswers.some(c => c === (userTextAnswer || "").trim());
    } else {
      // For multichoice, check if all correct answers are selected as 1 (correct)
      // and no incorrect answers are selected as 1
      isCorrect = currentQuestion.answers.every((ans, i) => {
        const isActuallyCorrect = !!(ans.isCorrect ?? ans.is_correct ?? false);
        const userState = userAnswers[i] || 0;
        return isActuallyCorrect === (userState === 1);
      });
    }

    const statsUserAnswers = qType === 'open'
      ? userTextAnswer
      : currentQuestion.answers.reduce((acc, ans, i) => {
        acc[ans.index] = userAnswers[i] === 1;
        return acc;
      }, {} as Record<number, boolean>);

    saveAttempt({
      questionId: currentQuestion.id || 'unknown',
      subjectCode: currentQuestion.subjectCode,
      topic: currentQuestion.topic,
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
