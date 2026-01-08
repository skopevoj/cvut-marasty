'use client';

import { useQuiz } from "../lib/QuizContext";
import { ShuffleButton } from "./control-panel/ShuffleButton";
import { Pagination } from "./control-panel/Pagination";
import { EvaluateButton } from "./control-panel/EvaluateButton";

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
        <footer className="glass-card-themed rounded-3xl p-2.5 transition-all duration-300 md:p-4">
            <div className="flex items-center justify-between gap-2 md:gap-3">
                <div className="flex items-center gap-1.5 md:gap-2">
                    {sortType === 'random' && (
                        <ShuffleButton
                            onClick={shuffleQueue}
                            disabled={quizQueue.length <= 1}
                        />
                    )}
                </div>

                <Pagination
                    currentIndex={currentQuestionIndex}
                    total={quizQueue.length}
                    onPrev={prevQuestion}
                    onNext={nextQuestion}
                />

                <EvaluateButton
                    onClick={showResults ? nextQuestion : evaluate}
                    disabled={showResults && currentQuestionIndex === quizQueue.length - 1}
                    showResults={showResults}
                />
            </div>
        </footer>
    );
}

