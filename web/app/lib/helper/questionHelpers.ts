import { Question } from "../types/question";
import { SubjectDetails } from "../types/subjectDetails";

export function getQuestionTopics(question: Question | null) {
    if (!question) return [];
    return question.topics || [];
}

export function getDisplayedPhoto(question: Question | null, showQuizPhoto: boolean) {
    if (!question) return null;
    if (showQuizPhoto && question.quizPhoto) {
        return question.quizPhoto;
    }
    return question.photo;
}

export function getTopicMap(currentSubjectDetails: SubjectDetails | null) {
    if (!currentSubjectDetails || !currentSubjectDetails.topics) return {};
    return currentSubjectDetails.topics.reduce((acc: Record<string, string>, topic) => {
        acc[topic.id] = topic.name;
        return acc;
    }, {});
}
