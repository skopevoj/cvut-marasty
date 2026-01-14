'use client';

import { useQuiz } from "./lib/context/QuizContext";
import { useSettings } from "./lib/context/SettingsContext";
import { Header } from "./components/header/Header";
import { QuestionCard } from "./components/question-card/QuestionCard";
import { QuestionHistory } from "./components/quiz/QuestionHistory";
import { ControlPanel } from "./components/control-panel/ControlPanel";
import { Footer } from "./components/layout/Footer";
import { LandingScreen } from "./components/layout/LandingScreen";
import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, Suspense } from "react";

function SourceHandler() {
  const searchParams = useSearchParams();
  const { addDataSource, settings } = useSettings();
  const router = useRouter();

  useEffect(() => {
    const sourceUrl = searchParams.get('addSource');
    if (sourceUrl) {
      // Check if already exists
      const exists = settings.dataSources.some(s => s.url === sourceUrl);
      if (!exists) {
        try {
          const hostname = new URL(sourceUrl).hostname || 'Remote Source';
          addDataSource({
            name: hostname,
            type: 'url',
            url: sourceUrl
          });
        } catch (e) {
          console.error('Invalid URL in addSource parameter');
        }
      }

      // Remove the param from URL
      const params = new URLSearchParams(searchParams.toString());
      params.delete('addSource');
      const newSearch = params.toString();

      const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
      const cleanPath = window.location.pathname.replace(new RegExp(`^${basePath}`), '') || '/';
      router.replace(newSearch ? `${cleanPath}?${newSearch}` : cleanPath);
    }
  }, [searchParams, addDataSource, settings.dataSources, router]);

  return null;
}

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
    <div className={`mx-auto flex min-h-screen ${!currentSubject ? 'max-w-[1200px]' : 'max-w-[1000px]'} flex-col px-2 md:px-5 py-2 md:py-4 relative z-10 pointer-events-auto ${!currentSubject ? 'landing-page-active' : ''}`} data-theme="default">
      <div className="landing-background" />
      <Suspense fallback={null}>
        <SourceHandler />
      </Suspense>
      <div className="shrink-0">
        <Header />
      </div>

      <div className="flex flex-1 flex-col py-2 md:py-4 min-h-0">
        {error ? (
          <div className="flex-1 flex flex-col justify-center">
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
          </div>
        ) : !currentSubject ? (
          <div className="pointer-events-auto flex-1 flex flex-col">
            <LandingScreen />
          </div>
        ) : (
          quizQueue.length > 0 ? (
            <div className="flex flex-1 flex-col justify-center gap-10 py-4">
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
        )}
      </div>
      <div className="pointer-events-auto shrink-0">
        <Footer />
      </div>
    </div>
  );
}

