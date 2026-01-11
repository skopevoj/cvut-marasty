'use client';

import { useQuiz } from "./lib/context/QuizContext";
import { Header } from "./components/header/Header";
import { QuestionCard } from "./components/question-card/QuestionCard";
import { QuestionHistory } from "./components/quiz/QuestionHistory";
import { ControlPanel } from "./components/control-panel/ControlPanel";
import { Footer } from "./components/layout/Footer";
import { About } from "./components/layout/About";

export default function Home() {
  const { isLoading, error, currentSubject, currentSubjectDetails, quizQueue } = useQuiz();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary/20 border-t-primary"></div>
      </div>
    );
  }
  if (error) return <div className="quiz-container">Error: {error}</div>;

  return (
    <div className="mx-auto flex min-h-screen max-w-[1000px] flex-col px-2 md:px-5 py-3 md:py-4 relative z-10 pointer-events-none" data-theme="default">
      <div className="pointer-events-auto">
        <Header />
      </div>

      <div className="flex flex-1 flex-col justify-center">
        {currentSubject ? (
          quizQueue.length > 0 ? (
            <div className="flex flex-col gap-10 py-4">
              <div>
                <div className="pointer-events-auto">
                  <QuestionHistory />
                </div>
                <div className="pointer-events-auto">
                  <QuestionCard />
                </div>
              </div>
              <div className="pointer-events-auto">
                <ControlPanel />
              </div>
            </div>
          ) : (
            <div className="text-center text-text-secondary pointer-events-auto">
              No questions match your selection
            </div>
          )
        ) : (
          <div className="text-center text-text-secondary pointer-events-auto">
            <About />
          </div>
        )}
      </div>
      <div className="pointer-events-auto">
        <Footer />
      </div>
    </div>
  );
}

