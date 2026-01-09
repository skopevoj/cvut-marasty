import { Question } from "./types/question";
import { Subject } from "./types/subject";

export function getTopicMap(currentSubjectDetails: any) {
    if (!currentSubjectDetails || !currentSubjectDetails.topics) return {};
    return currentSubjectDetails.topics.reduce((acc: any, topic: any) => {
        acc[topic.id] = topic.name;
        return acc;
    }, {});
}

export function getAvailableTopics(questions: Question[], currentSubject: Subject | null, topicMap: any) {
    if (!currentSubject) return [];
    const topicIds = new Set<string>();

    questions
        .filter(question => question.subjectCode === currentSubject.code)
        .forEach(question => {
            question.topics.forEach(topicId => topicIds.add(topicId));
        });

    return Array.from(topicIds).map(id => ({
        id,
        name: String(topicMap[id] || id)
    }));
}

export function filterSearchResults(questions: Question[], currentSubject: Subject | null, searchQuery: string) {
    if (!searchQuery.trim() || !currentSubject) return [];
    const query = searchQuery.toLowerCase();

    return questions
        .filter(question => question.subjectCode === currentSubject.code)
        .filter(question => {
            const idMatch = (question.id || "").toLowerCase().includes(query);
            const textMatch = (question.question || "").toLowerCase().includes(query);
            const answerMatch = (question.answers || []).some((answer: any) =>
                (answer.text || "").toLowerCase().includes(query)
            );
            return idMatch || textMatch || answerMatch;
        })
        .slice(0, 10);
}
