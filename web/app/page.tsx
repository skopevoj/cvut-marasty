"use client";

import { useSettingsStore, useDataStore, useQuizStore } from "./lib/stores";
import { Header } from "./components/header/Header";
import { QuestionCard } from "./components/question-card/QuestionCard";
import { QuestionHistory } from "./components/quiz/QuestionHistory";
import { ControlPanel } from "./components/control-panel/ControlPanel";
import { Footer } from "./components/layout/Footer";
import { LandingScreen } from "./components/layout/LandingScreen";
import { LoadingScreen } from "./components/layout/LoadingScreen";
import { PeerNotifications } from "./components/peer/PeerNotifications";
import { PeerCursors } from "./components/peer/PeerCursors";
import { Background } from "./components/Background";
import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, Suspense } from "react";

function SourceHandler() {
  const searchParams = useSearchParams();
  const { addDataSource, dataSources } = useSettingsStore();
  const router = useRouter();

  useEffect(() => {
    const sourceUrl = searchParams.get("addSource");
    if (sourceUrl) {
      // Check if already exists
      const exists = dataSources.some((s) => s.url === sourceUrl);
      if (!exists) {
        try {
          const hostname = new URL(sourceUrl).hostname || "Remote Source";
          addDataSource({
            name: hostname,
            type: "url",
            url: sourceUrl,
          });
        } catch (e) {
          console.error("Invalid URL in addSource parameter");
        }
      }

      // Remove the param from URL
      const params = new URLSearchParams(searchParams.toString());
      params.delete("addSource");
      const newSearch = params.toString();

      const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";
      const cleanPath =
        window.location.pathname.replace(new RegExp(`^${basePath}`), "") || "/";
      router.replace(newSearch ? `${cleanPath}?${newSearch}` : cleanPath);
    }
  }, [searchParams, addDataSource, dataSources, router]);

  return null;
}

export default function Home() {
  const settings = useSettingsStore();
  const { subjects, currentSubject, loading } = useDataStore();
  const quizQueue = useQuizStore((s) => s.queue);

  const { isLoading, error } = loading;
  const showSetup = settings.dataSources.length === 0;

  return (
    <div
      className={`mx-auto flex min-h-screen max-w-[1000px] flex-col px-2 md:px-5 py-2 md:py-4 relative ${!currentSubject ? "landing-page-active" : ""}`}
      data-theme="default"
    >
      <div className="landing-background" />
      <Background />
      <Suspense fallback={null}>
        <SourceHandler />
      </Suspense>
      <div className="relative z-30 shrink-0">
        <Header />
      </div>

      <div className="relative z-20 flex flex-1 flex-col min-h-0 py-2 md:py-4 pointer-events-none">
        {isLoading ? (
          <LoadingScreen />
        ) : error ? (
          <div className="flex-1 flex flex-col justify-center">
            <div className="quiz-container text-center py-10 pointer-events-auto">
              <div className="text-red-500 mb-4 font-medium">
                Chyba při načítání dat
              </div>
              <div className="text-text-secondary text-sm mb-6">{error}</div>
              <p className="mb-6 text-sm text-text-secondary italic">
                Zkontrolujte připojení nebo nastavení CORS u externích zdrojů.
              </p>
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
        ) : quizQueue.length > 0 ? (
          <div className="flex flex-1 flex-col justify-center py-4">
            <div>
              <div className="relative z-30">
                <QuestionHistory />
              </div>
            </div>
            <div className="relative z-20">
              <div className="relative z-20">
                <QuestionCard />
              </div>
            </div>
            <div className="relative z-20 mt-6">
              <ControlPanel />
            </div>
          </div>
        ) : (
          <div className="text-center text-text-secondary pointer-events-auto">
            Žádné otázky neodpovídají vašemu výběru
          </div>
        )}
      </div>
      <div className="shrink-0 relative z-20">
        <Footer />
      </div>
      <PeerNotifications />
      <PeerCursors />
    </div>
  );
}
