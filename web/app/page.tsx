'use client';

import { useQuiz } from "./lib/context/QuizContext";
import { useSettings } from "./lib/context/SettingsContext";
import { Header } from "./components/header/Header";
import { QuestionCard } from "./components/question-card/QuestionCard";
import { QuestionHistory } from "./components/quiz/QuestionHistory";
import { ControlPanel } from "./components/control-panel/ControlPanel";
import { Footer } from "./components/layout/Footer";
import { SetupSource } from "./components/layout/SetupSource";

export default function Home() {
  const { isLoading, error, subjects, currentSubject, quizQueue } = useQuiz();
  const { settings } = useSettings();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary/20 border-t-primary"></div>
      </div>
    );
  }

  const showSetup = settings.dataSources.length === 0;

  return (
    <div className="mx-auto flex min-h-screen max-w-[1000px] flex-col px-2 md:px-5 py-3 md:py-4 relative z-10 pointer-events-none" data-theme="default">
      <div className="pointer-events-auto">
        <Header />
      </div>

      <div className="flex flex-1 flex-col justify-center">
        {showSetup ? (
          <div className="pointer-events-auto">
            <SetupSource />
          </div>
        ) : error ? (
          <div className="quiz-container text-center py-10 pointer-events-auto">
            <div className="text-red-500 mb-4 font-medium">Chyba při načítání dat</div>
            <div className="text-text-secondary text-sm mb-6">{error}</div>
            <p className="mb-6 text-sm text-text-secondary italic">Zkontrolujte připojení nebo nastavení CORS u externích zdrojů.</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-primary text-white rounded-xl hover:opacity-90 transition-opacity"
            >
              Zkusit znovu
            </button>
          </div>
        ) : subjects.length === 0 ? (
          <div className="text-center text-text-secondary py-10 pointer-events-auto">
            Žádné povolené zdroje dat nebo zdroje neobsahují žádné předměty.
          </div>
        ) : currentSubject ? (
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
              Žádné otázky neodpovídají vašemu výběru
            </div>
          )
        ) : (
          <div className="text-center text-text-secondary pointer-events-auto">
            Vyberte předmět pro začátek
          </div>
        )}
      </div>
      <div className="pointer-events-auto">
        <Footer />
      </div>
    </div>
  );
}

