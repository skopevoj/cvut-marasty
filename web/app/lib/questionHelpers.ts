export function getQuestionTopics(question: any) {
    if (!question) return [];
    return question.topics || (question.topic ? [question.topic] : []);
}

export function getDisplayedPhoto(question: any, showQuizPhoto: boolean) {
    if (!question) return null;
    if (showQuizPhoto && question.quizPhoto) {
        return question.quizPhoto;
    }
    return question.photo;
}

export function getTopicMap(currentSubjectDetails: any) {
    if (!currentSubjectDetails || !currentSubjectDetails.topics) return {};
    return currentSubjectDetails.topics.reduce((acc: any, topic: any) => {
        acc[topic.id] = topic.name;
        return acc;
    }, {});
}
