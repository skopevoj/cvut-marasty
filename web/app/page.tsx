'use client';

import { useQuiz } from "./lib/QuizContext";
import { Header } from "./components/Header";
import { QuestionCard } from "./components/QuestionCard";
import { ControlPanel } from "./components/ControlPanel";
import "./quiz.css";

export default function Home() {
  const { isLoading, error, currentSubject, quizQueue } = useQuiz();

  if (isLoading) return <div className="quiz-container">Loading...</div>;
  if (error) return <div className="quiz-container">Error: {error}</div>;

  return (
    <div className="quiz-container" data-theme="default">
      <Header />

      {currentSubject ? (
        quizQueue.length > 0 ? (
          <>
            <QuestionCard />
            <ControlPanel />
          </>
        ) : (
          <div className="text-secondary" style={{ textAlign: 'center', marginTop: '40px' }}>
            No questions match your selection
          </div>
        )
      ) : (
        <div className="text-secondary" style={{ textAlign: 'center', marginTop: '40px' }}>
          Please select a subject to start the quiz
        </div>
      )}
    </div>
  );
}

