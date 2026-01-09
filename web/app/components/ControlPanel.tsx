'use client';

import { useQuiz } from "../lib/context/QuizContext";
import { ShuffleButton } from "./control-panel/ShuffleButton";
import { Pagination } from "./control-panel/Pagination";
import { EvaluateButton } from "./control-panel/EvaluateButton";
import { WhiteboardControls } from "./control-panel/WhiteboardControls";

export function ControlPanel() {
    const {
        currentQuestionIndex,
        quizQueue,
        nextQuestion,
        prevQuestion,
        currentSubject,
        evaluate,
        showResults,
        shuffleQueue,
        sortType
    } = useQuiz();

    if (!currentSubject || quizQueue.length === 0) return null;

    return (
        <footer className="glass-card-themed rounded-3xl p-2 transition-all duration-300 md:p-4">
            <div className="flex items-center justify-between gap-1 md:gap-4">
                {/* Left side: Shuffle + Whiteboard */}
                <div className="flex flex-1 min-w-0 items-center gap-1 md:gap-2">
                    {sortType === 'random' && (
                        <ShuffleButton
                            onClick={shuffleQueue}
                            disabled={quizQueue.length <= 1}
                        />
                    )}
                    <WhiteboardControls />
                </div>

                {/* Center: Pagination */}
                <div className="flex-initial">
                    <Pagination
                        currentIndex={currentQuestionIndex}
                        total={quizQueue.length}
                        onPrev={prevQuestion}
                        onNext={nextQuestion}
                    />
                </div>

                {/* Right side: Evaluate */}
                <div className="flex flex-1 min-w-0 items-center justify-end">
                    <EvaluateButton
                        onClick={showResults ? nextQuestion : evaluate}
                        disabled={showResults && currentQuestionIndex === quizQueue.length - 1}
                        showResults={showResults}
                    />
                </div>
            </div>
        </footer>
    );
}

