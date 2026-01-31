"use client";

import { useMemo } from "react";
import { useQuizStore } from "../../lib/stores";
import { useCurrentQuestion, useQuizActions } from "../../lib/hooks";
import { useQuestionStats } from "../../lib/hooks/useQuestionStats";
import { AnswerState } from "../../lib/types/enums";
import TextRenderer from "./../ui/TextRenderer";
import { getAnswerHash } from "../../lib/utils/hashing";

export function MultiChoiceQuestion() {
  const userAnswers = useQuizStore((s) => s.userAnswers);
  const showResults = useQuizStore((s) => s.showResults);
  const showStats = useQuizStore((s) => s.showStats);
  const { shuffledAnswers, question } = useCurrentQuestion();
  const { setAnswer: setAnswerState } = useQuizActions();

  const answerHashesMap = useMemo(() => {
    const map: Record<number, string> = {};
    (shuffledAnswers || []).forEach((a, i) => {
      const idx = a.index ?? i;
      map[idx] = getAnswerHash(a.text);
    });
    return map;
  }, [shuffledAnswers]);

  const answerHashesArray = useMemo(
    () => Object.values(answerHashesMap),
    [answerHashesMap],
  );

  const { stats, loading } = useQuestionStats(
    question?.id || null,
    answerHashesArray,
  );

  if (!shuffledAnswers || shuffledAnswers.length === 0) return null;

  return (
    <div className="flex flex-col gap-3">
      {shuffledAnswers.map((answer) => {
        const index = answer.index ?? 0;
        const answerState = userAnswers[index] || AnswerState.NEUTRAL;
        const isCorrect = answer.isCorrect;
        const isUserCorrect =
          (answerState === AnswerState.CORRECT && isCorrect) ||
          (answerState === AnswerState.INCORRECT && !isCorrect);

        let statusClass = "bg-text-primary/[0.06] border-text-primary/[0.06]";
        if (showResults) {
          statusClass = isUserCorrect
            ? "bg-success/20 border-success/40 border-1"
            : "bg-error/20 border-error/40 border-1";
        } else if (answerState !== AnswerState.NEUTRAL) {
          statusClass = "border-text-primary/[0.06] bg-text-primary/[0.06]";
        }

        const activePosition =
          answerState === AnswerState.CORRECT
            ? 0
            : answerState === AnswerState.INCORRECT
              ? 2
              : 1;

        return (
          <div
            key={`answer-${index}`}
            className={`flex items-start md:items-center justify-between gap-2 md:gap-3 rounded-2xl border p-2 transition-all duration-300 ${statusClass}`}
          >
            <div
              className="glass-tristate-container shrink-0"
              aria-label="Answer state"
            >
              <div
                className="glass-tristate-slider"
                data-position={activePosition}
              />
              <button
                className={`glass-tristate-button ${answerState === AnswerState.CORRECT ? "active" : ""}`}
                onClick={() =>
                  setAnswerState(
                    index,
                    answerState === AnswerState.CORRECT
                      ? AnswerState.NEUTRAL
                      : AnswerState.CORRECT,
                  )
                }
                aria-label="Mark as correct"
              >
                ✓
              </button>
              <button
                className={`glass-tristate-button ${answerState === AnswerState.REVEALED || answerState === AnswerState.NEUTRAL ? "active" : ""}`}
                onClick={() =>
                  setAnswerState(
                    index,
                    answerState === AnswerState.REVEALED
                      ? AnswerState.NEUTRAL
                      : AnswerState.REVEALED,
                  )
                }
                aria-label="Mark as neutral"
              >
                −
              </button>
              <button
                className={`glass-tristate-button ${answerState === AnswerState.INCORRECT ? "active" : ""}`}
                onClick={() =>
                  setAnswerState(
                    index,
                    answerState === AnswerState.INCORRECT
                      ? AnswerState.NEUTRAL
                      : AnswerState.INCORRECT,
                  )
                }
                aria-label="Mark as incorrect"
              >
                ✕
              </button>
            </div>
            <div className="flex-1 px-1 py-1 md:px-2 md:py-0">
              <TextRenderer text={answer.text} />
            </div>

            {/* {showStats && (
              <div className="flex flex-col items-end gap-0.5 shrink-0 px-2 border-l border-[var(--border-default)] min-w-[60px]">
                {loading ? (
                  <div className="w-8 h-4 bg-[var(--fg-muted)]/10 animate-pulse rounded" />
                ) : (
                  <>
                    <span className="text-[14px] font-bold text-[var(--fg-primary)]">
                      {stats?.answerStats.find(
                        (as) => as.answerHash === answerHashesMap[index],
                      )
                        ? `${Math.round(
                            (stats.answerStats.find(
                              (as) => as.answerHash === answerHashesMap[index],
                            )?.accuracy || 0) * 100,
                          )}%`
                        : "0%"}
                    </span>
                    <span className="text-[9px] uppercase tracking-wider text-[var(--fg-muted)] font-medium">
                      úspěšnost
                    </span>
                  </>
                )}
              </div>
            )} */}
          </div>
        );
      })}
    </div>
  );
}

export default MultiChoiceQuestion;
