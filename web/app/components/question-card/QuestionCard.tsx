

'use client';

import { useState, useMemo } from "react";
import { useQuiz } from "../../lib/context/QuizContext";
import MultiChoiceQuestion from "./MultiChoiceQuestion";
import OpenQuestion from "./OpenQuestion";
import { BadgeList } from "./BadgeList";
import { QuestionActions } from "./QuestionActions";
import { QuestionContent } from "./QuestionContent";
import * as helpers from "../../lib/helper/questionHelpers";

export function QuestionCard() {
    const { currentQuestion, currentSubjectDetails, showOriginalText, toggleOriginalText } = useQuiz();
    const [showQuizPhoto, setShowQuizPhoto] = useState(false);

    if (!currentQuestion) return null;

    const topicMap = useMemo(() => {
        return helpers.getTopicMap(currentSubjectDetails);
    }, [currentSubjectDetails]);

    const topics = useMemo(() => {
        return helpers.getQuestionTopics(currentQuestion);
    }, [currentQuestion]);

    const photoUrl = useMemo(() => {
        return helpers.getDisplayedPhoto(currentQuestion, showQuizPhoto);
    }, [currentQuestion, showQuizPhoto]);

    const questionType = (currentQuestion.questionType || 'multichoice').toLowerCase();

    return (
        <main className="glass-card-themed relative overflow-hidden rounded-3xl p-4 transition-all duration-300 md:p-8">
            <div className="absolute top-0 left-0 right-0 h-px opacity-50" style={{
                background: `linear-gradient(90deg, transparent, var(--subject-primary), transparent)`,
            }} />
            <div className="absolute bottom-0 left-0 right-0 h-px opacity-50" style={{
                background: `linear-gradient(90deg, transparent, var(--subject-primary), transparent)`,
            }} />
            <BadgeList
                topics={topics}
                topicMap={topicMap}
                questionId={currentQuestion.id || ''}
            />

            <QuestionActions
                questionId={currentQuestion.id || ''}
                hasQuizPhoto={!!currentQuestion.quizPhoto}
                showQuizPhoto={showQuizPhoto}
                onToggleQuizPhoto={() => setShowQuizPhoto(!showQuizPhoto)}
                hasOriginalText={!!currentQuestion.originalText}
                showOriginalText={showOriginalText}
                onToggleOriginalText={toggleOriginalText}
            />

            <QuestionContent
                questionText={currentQuestion.question}
                photoUrl={photoUrl as string}
            />

            {showOriginalText && currentQuestion.originalText && (
                <div className="mb-6 rounded-2xl border border-dashed border-[var(--border-default)] bg-[var(--bg-secondary)]/30 p-4 font-mono text-xs whitespace-pre-wrap opacity-70">
                    <div className="mb-2 text-[10px] uppercase tracking-wider text-[var(--fg-muted)]">Původní text:</div>
                    {currentQuestion.originalText}
                </div>
            )}

            {questionType === 'open' ? <OpenQuestion /> : <MultiChoiceQuestion />}
        </main>
    );
}

