"use client";

import { useQuizStore } from "../../lib/stores";
import { useCurrentQuestion, useQuizActions } from "../../lib/hooks";
import { AnswerState } from "../../lib/types/enums";
import TextRenderer from "./../ui/TextRenderer";

export function MultiChoiceQuestion() {
  const userAnswers = useQuizStore((s) => s.userAnswers);
  const showResults = useQuizStore((s) => s.showResults);
  const { shuffledAnswers } = useCurrentQuestion();
  const { setAnswer: setAnswerState } = useQuizActions();
  if (!shuffledAnswers || shuffledAnswers.length === 0) return null;

  return (
    <div className="flex flex-col gap-3">
      {shuffledAnswers.map((answer, i) => {
        const answerState = userAnswers[i] || AnswerState.NEUTRAL;
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
            key={i}
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
                    i,
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
                    i,
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
                    i,
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
          </div>
        );
      })}
    </div>
  );
}

export default MultiChoiceQuestion;
