"use client";

import { useMemo } from "react";
import { useQuizStore } from "../../lib/stores";
import { useCurrentQuestion, useQuizActions } from "../../lib/hooks";
import { useQuestionStats } from "../../lib/hooks/useQuestionStats";
import TextRenderer from "../ui/TextRenderer";

export function OpenQuestion() {
  const userTextAnswer = useQuizStore((s) => s.userTextAnswer);
  const showResults = useQuizStore((s) => s.showResults);
  const showStats = useQuizStore((s) => s.showStats);
  const { question: currentQuestion } = useCurrentQuestion();
  const { setTextAnswer } = useQuizActions();

  const { stats, loading } = useQuestionStats(currentQuestion?.id || null, [
    "open-answer",
  ]);

  if (!currentQuestion) return null;

  const correctAnswers = useMemo(() => {
    return (currentQuestion.answers || [])
      .filter((a) => a.isCorrect)
      .map((a) => (a.text || "").trim());
  }, [currentQuestion]);

  const isCorrect =
    showResults &&
    correctAnswers.some((c) => c === (userTextAnswer || "").trim());

  return (
    <div className="mt-4 space-y-3">
      {showStats && (
        <div className="flex items-center justify-end gap-2 text-[10px] uppercase tracking-widest text-[var(--fg-muted)] font-bold mb-1 px-1">
          <span>Globální úspěšnost:</span>
          {loading ? (
            <div className="w-8 h-3 bg-[var(--fg-muted)]/10 animate-pulse rounded" />
          ) : (
            <span className="text-[var(--subject-primary)] font-black">
              {stats?.answerStats[0]
                ? `${Math.round(stats.answerStats[0].accuracy * 100)}%`
                : "0%"}
            </span>
          )}
        </div>
      )}
      <input
        type="text"
        className={`w-full rounded-xl border px-5 py-4 text-text-primary outline-none transition-all placeholder:text-text-secondary disabled:cursor-not-allowed ${
          showResults
            ? isCorrect
              ? "border-green-500 bg-green-500/[0.05] border-2"
              : "border-red-500 bg-red-500/[0.05] border-2"
            : "border-border-color bg-[var(--fg-primary)]/[0.03] focus:border-[var(--subject-primary)] focus:bg-[var(--fg-primary)]/[0.05] focus:shadow-[0_0_20px_color-mix(in_srgb,var(--subject-primary)_20%,transparent)]"
        }`}
        placeholder="Zde napište odpověď..."
        value={userTextAnswer}
        onChange={(e) => setTextAnswer(e.target.value)}
        disabled={showResults}
      />
      {showResults && (
        <div className="flex items-center gap-2 text-sm font-medium text-text-primary">
          {isCorrect ? (
            <>
              {/* <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[var(--fg-primary)]/[0.1] text-[10px]">✓</span>
                            <span>Správně</span> */}
            </>
          ) : (
            <>
              <span>Správná odpověď: </span>
              <TextRenderer text={correctAnswers[0] ?? ""} />
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default OpenQuestion;
