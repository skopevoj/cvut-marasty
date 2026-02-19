"use client";

import { useQuizStore } from "../../lib/stores";
import { useCurrentQuestion, useQuizActions } from "../../lib/hooks";
import { AnswerState } from "../../lib/types/enums";
import { evaluate as evaluateAction } from "../../lib/actions/quizActions";

export function YesNoQuestion() {
  const userAnswers = useQuizStore((s) => s.userAnswers);
  const showResults = useQuizStore((s) => s.showResults);
  const { question: currentQuestion } = useCurrentQuestion();
  const { setAnswer } = useQuizActions();

  if (!currentQuestion) return null;

  // Answers are stored as: index 0 = Ano (Yes), index 1 = Ne (No)
  // The answer with isCorrect=true in the question data is the correct one.
  const answers = currentQuestion.answers || [];
  const yesAnswer = answers.find((a) => a.text === "Ano") ?? answers[0];
  const noAnswer = answers.find((a) => a.text === "Ne") ?? answers[1];

  const yesIndex = yesAnswer?.index ?? 0;
  const noIndex = noAnswer?.index ?? 1;

  const isYesCorrect = !!yesAnswer?.isCorrect;

  const userSelectedYes = userAnswers[yesIndex] === AnswerState.CORRECT;
  const userSelectedNo = userAnswers[noIndex] === AnswerState.CORRECT;

  function handleSelect(choice: "yes" | "no") {
    if (showResults) return;

    const yesState = choice === "yes" ? AnswerState.CORRECT : AnswerState.INCORRECT;
    const noState = choice === "no" ? AnswerState.CORRECT : AnswerState.INCORRECT;

    // Set both answers synchronously (updates the Zustand store immediately)
    setAnswer(yesIndex, yesState);
    setAnswer(noIndex, noState);

    // Use standalone evaluate (reads fresh state via getState()) to auto-evaluate
    const indexedAnswers = answers.map((a, i) => ({ ...a, index: a.index ?? i }));
    evaluateAction(indexedAnswers);
  }

  function getButtonClass(isYes: boolean) {
    const isThisCorrect = isYes ? isYesCorrect : !isYesCorrect;
    const userSelectedThis = isYes ? userSelectedYes : userSelectedNo;

    let base =
      "flex-1 py-6 rounded-2xl border-2 text-xl font-bold transition-all duration-300 disabled:cursor-not-allowed";

    if (!showResults) {
      if (userSelectedThis) {
        return `${base} border-[var(--subject-primary)] bg-[var(--subject-primary)]/10 text-[var(--subject-primary)]`;
      }
      return `${base} border-[var(--border-default)] bg-[var(--fg-primary)]/[0.03] text-[var(--fg-primary)] hover:border-[var(--subject-primary)]/50 hover:bg-[var(--fg-primary)]/[0.06]`;
    }

    // Show results
    if (isThisCorrect) {
      return `${base} border-green-500 bg-green-500/10 text-green-500`;
    }
    if (userSelectedThis && !isThisCorrect) {
      return `${base} border-red-500 bg-red-500/10 text-red-500`;
    }
    return `${base} border-[var(--border-default)] bg-[var(--fg-primary)]/[0.03] text-[var(--fg-muted)] opacity-50`;
  }

  return (
    <div className="mt-6 flex gap-4">
      <button
        className={getButtonClass(true)}
        onClick={() => handleSelect("yes")}
        disabled={showResults}
        aria-label="Ano"
      >
        Ano
      </button>
      <button
        className={getButtonClass(false)}
        onClick={() => handleSelect("no")}
        disabled={showResults}
        aria-label="Ne"
      >
        Ne
      </button>
    </div>
  );
}

export default YesNoQuestion;
