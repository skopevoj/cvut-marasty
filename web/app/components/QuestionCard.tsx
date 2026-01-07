'use client';

import { useQuiz } from "../lib/QuizContext";

export function QuestionCard() {
    const { currentQuestion, userAnswers, setAnswerState, showResults } = useQuiz();

    if (!currentQuestion) return null;

    return (
        <main className="question-card">
            <div className="question-meta">
                <span className="tag text-secondary">{currentQuestion.topic}</span>
                <div className="meta-actions">
                    <span className="text-secondary" style={{ marginRight: '12px' }}>#{currentQuestion.id || 'N/A'}</span>
                </div>
            </div>

            <div className="question-text">
                {currentQuestion.question}
            </div>
            <div className="answers-list">
                {currentQuestion.answers.map((answer, i) => {
                    const answerState = userAnswers[i] || 0;
                    const isSelected = answerState > 0;
                    const isCorrect = answer.isCorrect || answer.is_correct;

                    let statusClass = '';
                    if (showResults) {
                        if (isCorrect) statusClass = 'correct';
                        else if (isSelected) statusClass = 'incorrect';
                    }

                    return (
                        <div key={i} className={`answer-item ${statusClass}`}>
                            {!showResults && (
                                <div className="answer-buttons">
                                    <button
                                        className={`answer-btn ${answerState === 1 ? 'active' : ''}`}
                                        onClick={() => setAnswerState(i, answerState === 1 ? 0 : 1)}
                                        aria-label="Mark as correct"
                                    >
                                        ✓
                                    </button>
                                    <button
                                        className={`answer-btn ${answerState === 2 ? 'active' : ''}`}
                                        onClick={() => setAnswerState(i, answerState === 2 ? 0 : 2)}
                                        aria-label="Mark as maybe"
                                    >
                                        −
                                    </button>
                                    <button
                                        className={`answer-btn ${answerState === 3 ? 'active' : ''}`}
                                        onClick={() => setAnswerState(i, answerState === 3 ? 0 : 3)}
                                        aria-label="Mark as incorrect"
                                    >
                                        ✕
                                    </button>
                                </div>
                            )}
                            {showResults && (
                                <div className="answer-result">
                                    <span className="icon">{isCorrect ? '✓' : '✕'}</span>
                                </div>
                            )}
                            <div className="answer-text">{answer.text}</div>
                        </div>
                    );
                })}
            </div>

        </main>
    );
}
