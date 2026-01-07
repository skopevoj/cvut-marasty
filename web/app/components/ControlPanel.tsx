'use client';

import { useQuiz } from "../lib/QuizContext";
import { Button } from "./Button";

export function ControlPanel() {
    const { currentQuestionIndex, quizQueue, nextQuestion, prevQuestion, currentSubject, evaluate } = useQuiz();

    if (!currentSubject || quizQueue.length === 0) return null;

    return (
        <footer className="flex items-center justify-between rounded-[24px] border border-border-color bg-surface px-6 py-4">
            <div className="flex gap-3">
                <Button variant="icon">🔀</Button>
            </div>

            <div className="flex items-center gap-4 rounded-xl bg-black/20 px-3 py-1">
                <Button
                    variant="icon"
                    className="h-10 w-10 text-[20px]"
                    onClick={prevQuestion}
                    disabled={currentQuestionIndex === 0}
                >
                    ‹
                </Button>
                <div className="text-[14px] font-medium text-text-secondary">
                    {currentQuestionIndex + 1} / {quizQueue.length}
                </div>
                <Button
                    variant="icon"
                    className="h-10 w-10 text-[20px]"
                    onClick={nextQuestion}
                    disabled={currentQuestionIndex === quizQueue.length - 1}
                >
                    ›
                </Button>
            </div>

            <Button onClick={evaluate} variant="primary">Vyhodnotit</Button>
        </footer>
    );
}
