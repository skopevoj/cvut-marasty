
'use client';

import { useQuiz } from "../lib/QuizContext";
import MultiChoiceQuestion from "./MultiChoiceQuestion";
import OpenQuestion from "./OpenQuestion";

export function QuestionCard() {
    const { currentQuestion } = useQuiz();

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
            {(() => {
                const qType = (currentQuestion.questionType || currentQuestion.question_type || 'multichoice').toLowerCase();
                return qType === 'open' ? <OpenQuestion /> : <MultiChoiceQuestion />;
            })()}

        </main>
    );
}
