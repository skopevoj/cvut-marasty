'use client';

import { useQuiz } from "./lib/QuizContext";
import { Header } from "./components/Header";
import { QuestionCard } from "./components/QuestionCard";
import { QuestionHistory } from "./components/QuestionHistory";
import { ControlPanel } from "./components/ControlPanel";
import { Footer } from "./components/Footer";

export default function Home() {
  const { isLoading, error, currentSubject, currentSubjectDetails, quizQueue } = useQuiz();

  if (isLoading) return <div className="quiz-container">Loading...</div>;
  if (error) return <div className="quiz-container">Error: {error}</div>;

  return (
    <div className="mx-auto flex min-h-screen max-w-[1000px] flex-col px-5 py-4" data-theme="default">
      <Header />

      <div className="flex flex-1 flex-col justify-center">
        {currentSubject ? (
          quizQueue.length > 0 ? (
            <div className="flex flex-col gap-10 py-4">
              <div>
                <QuestionHistory />
                <QuestionCard />
              </div>
              <ControlPanel />
            </div>
          ) : (
            <div className="text-center text-text-secondary">
              No questions match your selection
            </div>
          )
        ) : (
          <div className="text-center text-text-secondary">
            Please select a subject to start the quiz
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}

