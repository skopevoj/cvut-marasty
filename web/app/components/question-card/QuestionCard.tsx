"use client";

import { useState, useMemo } from "react";
import { useQuizStore, useDataStore } from "../../lib/stores";
import { useCurrentQuestion } from "../../lib/hooks";
import { QuestionType } from "../../lib/types/enums";
import MultiChoiceQuestion from "./MultiChoiceQuestion";
import OpenQuestion from "./OpenQuestion";
import YesNoQuestion from "./YesNoQuestion";
import { BadgeList } from "./BadgeList";
import { QuestionActions } from "./QuestionActions";
import { QuestionContent } from "./QuestionContent";
import { QuestionComments } from "./QuestionComments";
import * as helpers from "../../lib/helper/questionHelpers";
import { getTopicMap } from "../../lib/helper/headerHelpers";

export function QuestionCard() {
  const showOriginalText = useQuizStore((s) => s.showOriginalText);
  const toggleOriginalText = useQuizStore((s) => s.toggleOriginalText);
  const currentSubject = useDataStore((s) => s.currentSubject);
  const currentSubjectDetails = useDataStore((s) => s.currentSubjectDetails);
  const { question: currentQuestion } = useCurrentQuestion();
  const [showQuizPhoto, setShowQuizPhoto] = useState(false);

  if (!currentQuestion) return null;

  const questionHash = currentQuestion.id;

  const topicMap = useMemo(() => {
    return getTopicMap(currentSubjectDetails);
  }, [currentSubjectDetails]);

  const topics = useMemo(() => {
    return helpers.getQuestionTopics(currentQuestion);
  }, [currentQuestion]);

  const photoUrl = useMemo(() => {
    return helpers.getDisplayedPhoto(currentQuestion, showQuizPhoto);
  }, [currentQuestion, showQuizPhoto]);

  const questionType = (
    currentQuestion.questionType || QuestionType.MULTICHOICE
  ).toLowerCase();

  return (
    <main className="card relative p-4 md:p-6">
      <BadgeList
        topics={topics}
        topicMap={topicMap}
        questionId={currentQuestion.id || ""}
      />

      <QuestionActions
        questionId={currentQuestion.id || ""}
        hasQuizPhoto={!!(currentQuestion.quizPhoto || currentQuestion.photo)}
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
          <div className="mb-2 text-[10px] uppercase tracking-wider text-[var(--fg-muted)]">
            Původní text:
          </div>
          {currentQuestion.originalText}
        </div>
      )}

      {questionType === QuestionType.YESNO ? (
        <YesNoQuestion />
      ) : questionType === QuestionType.OPEN ? (
        <OpenQuestion />
      ) : (
        <MultiChoiceQuestion />
      )}

      <QuestionComments questionHash={questionHash} />
    </main>
  );
}
