import { Question } from "../types/question";
import { SubjectDetails } from "../types/subjectDetails";

export function getQuestionTopics(question: Question | null) {
    if (!question) return [];
    return question.topics || [];
}

export function getDisplayedPhoto(question: Question | null, showQuizPhoto: boolean) {
    if (!question) return null;

    // If we want to show the detail/quiz photo
    if (showQuizPhoto) {
        return question.quizPhoto || question.quizPhoto || question.photo;
    }

    // Otherwise show the base photo, but NOT the quiz/generic image if it's meant to be toggled
    return question.photo;
}

export function getTopicMap(currentSubjectDetails: SubjectDetails | null) {
    if (!currentSubjectDetails) return {};

    // If we have a direct topicMap (object structure)
    if (currentSubjectDetails.topicMap) {
        return currentSubjectDetails.topicMap;
    }

    // Fallback to array structure
    if (currentSubjectDetails.topics) {
        return currentSubjectDetails.topics.reduce((acc: Record<string, string>, topic) => {
            acc[topic.id] = topic.name;
            return acc;
        }, {});
    }

    return {};
}
