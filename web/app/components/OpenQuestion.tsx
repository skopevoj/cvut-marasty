"use client";

import { useMemo } from "react";
import { useQuiz } from "../lib/QuizContext";

export function OpenQuestion() {
    const { currentQuestion, userTextAnswer, setTextAnswer, showResults } = useQuiz();
    if (!currentQuestion) return null;

    const correctAnswers = useMemo(() => {
        return (currentQuestion.answers || [])
            .filter((a: any) => a.isCorrect || a.is_correct)
            .map((a) => (a.text || "").trim());
    }, [currentQuestion]);

    const isCorrect = showResults && correctAnswers.some(c => c === (userTextAnswer || "").trim());

    return (
        <div className={`open-answer ${showResults ? (isCorrect ? "correct" : "incorrect") : ""}`}>
            <input
                type="text"
                className="open-answer-input"
                placeholder="Type your answer here..."
                value={userTextAnswer}
                onChange={(e) => setTextAnswer(e.target.value)}
                disabled={showResults}
            />
            {showResults && (
                <div className="open-answer-feedback">
                    {isCorrect ? "Correct" : `Correct answer: ${correctAnswers[0] ?? ""}`}
                </div>
            )}
        </div>
    );
}

export default OpenQuestion;
