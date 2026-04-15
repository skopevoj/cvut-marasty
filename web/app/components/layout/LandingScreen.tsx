"use client";

import { useState, useEffect } from "react";
import { useDataStore, useSettingsStore } from "../../lib/stores";
import { selectSubject } from "../../lib/actions/subjectActions";
import { Contributors } from "./Contributors";
import { AddSourceModal } from "./AddSourceModal";
import { ArrowRight, BookOpen, Upload, Users, MessageSquare, Brain, Zap } from "lucide-react";

interface FunStats {
  totalAttempts: number;
  totalUsers: number;
  totalQuestions: number;
  totalComments: number;
  attemptsToday: number;
}

function useFunStats() {
  const backendUrl = useSettingsStore((s) => s.backendUrl);
  const [stats, setStats] = useState<FunStats | null>(null);

  useEffect(() => {
    if (!backendUrl) return;
    const baseUrl = backendUrl.endsWith("/") ? backendUrl : `${backendUrl}/`;
    fetch(`${baseUrl}fun-stats`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => data && setStats(data))
      .catch(() => {});
  }, [backendUrl]);

  return stats;
}

function formatNumber(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return n.toString();
}

function StatCard({ icon: Icon, value, label }: { icon: any; value: string; label: string }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 card">
      <Icon size={18} className="text-[var(--subject-primary)] shrink-0" />
      <div>
        <div className="font-mono text-lg font-bold text-[var(--fg-primary)] leading-none">{value}</div>
        <div className="text-[11px] text-[var(--fg-muted)] mt-0.5">{label}</div>
      </div>
    </div>
  );
}

export function LandingScreen() {
  const subjects = useDataStore((s) => s.subjects);
  const settings = useSettingsStore();
  const funStats = useFunStats();
  const [isAddSourceOpen, setIsAddSourceOpen] = useState(false);
  const [url, setUrl] = useState("");

  const handleAddUrl = () => {
    if (!url) return;
    try {
      const urlObj = new URL(url);
      settings.addDataSource({
        name: urlObj.hostname || "Vzdálený zdroj",
        type: "url",
        url: url,
      });
      setUrl("");
    } catch (err) {
      alert("Neplatná URL adresa");
    }
  };

  const noSources = settings.dataSources.length === 0;
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

  return (
    <div className="flex flex-1 flex-col items-center justify-between py-2 md:py-4 px-4">
      <div className="flex-1 flex flex-col items-center justify-center w-full max-w-4xl py-6">
        {/* Hero */}
        <div className="w-full max-w-md mx-auto mb-6 md:mb-10">
          <img
            src={`${basePath}${settings.theme === "light" || settings.theme === "catppuccin-latte" || settings.theme === "tokyo-night-light" ? "/banner_light.png" : "/banner_dark.png"}`}
            alt="Příprava na rozstřely"
            className="w-full"
          />
        </div>

        {/* Fun stats — always show if backend available */}
        {funStats && (
          <div className="grid grid-cols-3 sm:grid-cols-3 gap-2 w-full max-w-2xl mb-8">
            <StatCard icon={Brain} value={formatNumber(funStats.totalAttempts)} label="odpovědí celkem" />
            <StatCard icon={Zap} value={formatNumber(funStats.attemptsToday)} label="odpovědí dnes" />
            {/* <StatCard icon={Users} value={formatNumber(funStats.totalUsers)} label="uživatelů" /> */}
            <StatCard icon={MessageSquare} value={formatNumber(funStats.totalComments)} label="komentářů" />
          </div>
        )}

        {/* Subject grid or URL input */}
        {noSources ? (
          <div className="w-full max-w-lg space-y-2">
            <div className="relative flex items-center">
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com/questions.json"
                className="w-full bg-[var(--surface-color)] border border-[var(--border-default)] rounded-lg px-3 py-2.5 text-sm text-[var(--fg-primary)] placeholder:text-[var(--fg-subtle)] outline-none focus:border-[var(--primary-color)] pr-11"
                onKeyDown={(e) => e.key === "Enter" && handleAddUrl()}
              />
              <button
                onClick={handleAddUrl}
                disabled={!url}
                className="absolute right-1.5 w-8 h-8 flex items-center justify-center rounded-md bg-[var(--primary-color)] text-white disabled:opacity-30"
                title="Přidat URL"
              >
                <ArrowRight size={16} />
              </button>
            </div>
            <p className="text-xs text-[var(--fg-muted)] px-1">
              Vložte URL z GitHub repository nebo jiného veřejného odkazu.
            </p>
          </div>
        ) : subjects.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 w-full max-w-3xl">
            {subjects.map((subject) => (
              <button
                key={subject.code || subject.id}
                onClick={() => selectSubject(subject.code || "")}
                className="card px-3 py-4 flex flex-col items-center gap-1.5 group hover:bg-[var(--bg-surface-hover)] transition-colors"
              >
                <BookOpen
                  size={20}
                  className="text-[var(--fg-muted)] group-hover:text-[var(--subject-primary)] transition-colors"
                />
                <span className="text-sm font-bold font-mono text-[var(--fg-primary)]">
                  {(subject.code || "N/A").toUpperCase()}
                </span>
                {subject.name && (
                  <span className="text-[11px] text-[var(--fg-muted)] text-center line-clamp-2 leading-tight">
                    {subject.name}
                  </span>
                )}
              </button>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <p className="text-[var(--fg-muted)]">Žádné předměty k dispozici</p>
            <button
              onClick={() => setIsAddSourceOpen(true)}
              className="text-sm text-[var(--fg-muted)] hover:text-[var(--fg-primary)] transition-colors flex items-center gap-2"
            >
              <Upload size={16} />
              Přidat další zdroj
            </button>
          </div>
        )}
      </div>

      {/* Footer area */}
      <div className="w-full max-w-4xl">
        <Contributors />
      </div>

      <AddSourceModal
        isOpen={isAddSourceOpen}
        onClose={() => setIsAddSourceOpen(false)}
      />
    </div>
  );
}
