'use client';

import { useQuiz } from "../lib/QuizContext";
import { Button } from "./Button";

export function ControlPanel() {
    const { currentQuestionIndex, quizQueue, nextQuestion, prevQuestion, currentSubject, evaluate } = useQuiz();

    if (!currentSubject || quizQueue.length === 0) return null;

    return (
        <footer className="control-panel">
            <div className="nav-group">
                <Button variant="icon">🔀</Button>
            </div>

            <div className="nav-btns center-nav">
                <Button
                    variant="icon"
                    className="arrow-btn"
                    onClick={prevQuestion}
                    disabled={currentQuestionIndex === 0}
                >
                    ‹
                </Button>
                <div className="nav-counter">
                    {currentQuestionIndex + 1} / {quizQueue.length}
                </div>
                <Button
                    variant="icon"
                    className="arrow-btn"
                    onClick={nextQuestion}
                    disabled={currentQuestionIndex === quizQueue.length - 1}
                >
                    ›
                </Button>
            </div>

            <Button onClick={evaluate}>Vyhodnotit</Button>
        </footer>
    );
}
