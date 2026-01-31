"use client";

import { useQuizStore, useDataStore, useFilterStore } from "../../lib/stores";
import {
  useNavigation,
  useQuizActions,
  useCurrentQuestion,
} from "../../lib/hooks";
import { SortType } from "../../lib/types/enums";
import { ShuffleButton } from "./ShuffleButton";
import { Pagination } from "./Pagination";
import { EvaluateButton } from "./EvaluateButton";
import { WhiteboardControls } from "./WhiteboardControls";

export function ControlPanel() {
  const currentQuestionIndex = useQuizStore((s) => s.currentIndex);
  const quizQueue = useQuizStore((s) => s.queue);
  const showResults = useQuizStore((s) => s.showResults);
  const currentSubject = useDataStore((s) => s.currentSubject);
  const sortType = useFilterStore((s) => s.sortType);
  const { shuffledAnswers } = useCurrentQuestion();
  const { next, prev, shuffle } = useNavigation();
  const { evaluate } = useQuizActions();

  if (!currentSubject || quizQueue.length === 0) return null;

  return (
    <footer className="glass-card-themed rounded-3xl p-1 transition-all duration-300 md:p-3">
      <div className="flex items-center justify-between gap-1 md:gap-4">
        {/* Left side: Shuffle + Whiteboard */}
        <div className="flex flex-1 min-w-0 items-center gap-1 md:gap-2">
          {sortType === SortType.RANDOM && (
            <ShuffleButton onClick={shuffle} disabled={quizQueue.length <= 1} />
          )}
          <WhiteboardControls />
        </div>

        {/* Center: Pagination */}
        <div className="flex-initial">
          <Pagination
            currentIndex={currentQuestionIndex}
            total={quizQueue.length}
            onPrev={prev}
            onNext={next}
          />
        </div>

        {/* Right side: Evaluate */}
        <div className="flex flex-1 min-w-0 items-center justify-end">
          <EvaluateButton
            onClick={showResults ? next : () => evaluate(shuffledAnswers)}
            disabled={
              showResults && currentQuestionIndex === quizQueue.length - 1
            }
            showResults={showResults}
          />
        </div>
      </div>
    </footer>
  );
}
