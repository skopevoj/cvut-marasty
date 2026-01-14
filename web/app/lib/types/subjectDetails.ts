export interface SubjectDetails {
    code: string;
    primaryColor: string;
    secondaryColor: string;
    topics?: {
        id: string;
        name: string;
    }[];
    topicMap?: Record<string, string>;
}
