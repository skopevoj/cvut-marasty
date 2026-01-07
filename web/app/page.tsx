'use client';

import { useQuiz } from "./lib/QuizContext";
import { Header } from "./components/Header";
import { QuestionCard } from "./components/QuestionCard";
import { ControlPanel } from "./components/ControlPanel";

export default function Home() {
  const { isLoading, error, currentSubject, currentSubjectDetails, quizQueue } = useQuiz();

  if (isLoading) return <div className="quiz-container">Loading...</div>;
  if (error) return <div className="quiz-container">Error: {error}</div>;

  const containerStyle = currentSubjectDetails ? {
    '--subject-primary': currentSubjectDetails.primaryColor,
    '--subject-secondary': currentSubjectDetails.secondaryColor,
  } as React.CSSProperties : {};

  return (
    <div className="mx-auto flex min-h-screen max-w-[1000px] flex-col gap-10 px-5 py-10" data-theme="default" style={containerStyle}>
      <Header />

      {currentSubject ? (
        quizQueue.length > 0 ? (
          <div className="flex flex-col gap-10">
            <QuestionCard />
            <ControlPanel />
          </div>
        ) : (
          <div className="mt-10 text-center text-text-secondary">
            No questions match your selection
          </div>
        )
      ) : (
        <div className="mt-10 text-center text-text-secondary">
          Please select a subject to start the quiz
        </div>
      )}
    </div>
  );
}

