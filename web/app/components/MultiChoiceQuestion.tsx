"use client";

import { useQuiz } from "../lib/QuizContext";

export function MultiChoiceQuestion() {
    const { currentQuestion, userAnswers, setAnswerState, showResults } = useQuiz();
    if (!currentQuestion) return null;

    return (
        <div className="answers-list">
            {currentQuestion.answers.map((answer, i) => {
                const answerState = userAnswers[i] || 0;
                const isSelected = answerState > 0;
                const isCorrect = (answer as any).isCorrect || (answer as any).is_correct;

                let statusClass = "";
                if (showResults) {
                    if (isCorrect) statusClass = "correct";
                    else if (isSelected) statusClass = "incorrect";
                }

                return (
                    <div key={i} className={`answer-item ${statusClass}`}>
                        {(
                            <div className="answer-buttons" aria-label="Answer state">
                                <button
                                    className={`answer-btn ${answerState === 1 ? "active" : ""}`}
                                    onClick={() => setAnswerState(i, answerState === 1 ? 0 : 1)}
                                    aria-label="Mark as correct"
                                >
                                    ✓
                                </button>
                                <button
                                    className={`answer-btn ${answerState === 2 ? "active" : ""}`}
                                    onClick={() => setAnswerState(i, answerState === 2 ? 0 : 2)}
                                    aria-label="Mark as maybe"
                                >
                                    −
                                </button>
                                <button
                                    className={`answer-btn ${answerState === 3 ? "active" : ""}`}
                                    onClick={() => setAnswerState(i, answerState === 3 ? 0 : 3)}
                                    aria-label="Mark as incorrect"
                                >
                                    ✕
                                </button>
                            </div>
                        )}
                        <div className="answer-text">{answer.text}</div>
                        {showResults && (
                            <div className="answer-result">
                                <span className="icon">{isCorrect ? "✓" : "✕"}</span>
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}

export default MultiChoiceQuestion;
