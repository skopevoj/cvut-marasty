'use client';

import { Subject } from '../types';

interface SubjectListProps {
    subjects: Subject[];
    folderPath: string;
    onSubjectSelect: (subject: Subject) => void;
    onRefresh: () => void;
}

export function SubjectList({ subjects, folderPath, onSubjectSelect, onRefresh }: SubjectListProps) {
    async function handleAddSubject() {
        const code = prompt('Enter subject code (e.g., "ma1", "dml"):');
        if (!code) return;

        const name = prompt('Enter subject name:');
        if (!name) return;

        const newSubject = {
            name,
            code,
            description: `Description for ${name}`,
            primaryColor: '#3b82f6',
            secondaryColor: '#1e40af',
            topics: [],
        };

        try {
            await fetch('/api/fs', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'saveSubject',
                    folderPath,
                    data: { subjectCode: code, subjectData: newSubject },
                }),
            });
            onRefresh();
        } catch (error) {
            console.error('Error creating subject:', error);
        }
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-foreground">Subjects</h2>
                <button
                    onClick={handleAddSubject}
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                >
                    Add Subject
                </button>
            </div>

            {subjects.length === 0 ? (
                <div className="text-center py-12 bg-card rounded-lg border">
                    <p className="text-muted-foreground">No subjects found. Add your first subject!</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {subjects.map((subject) => (
                        <div
                            key={subject.code}
                            className="bg-card rounded-lg border shadow-sm hover:shadow-md transition-all cursor-pointer p-6 hover:border-primary/50"
                            onClick={() => onSubjectSelect(subject)}
                            style={{
                                borderTop: `4px solid ${subject.primaryColor}`,
                            }}
                        >
                            <h3 className="text-lg font-semibold mb-2 text-foreground">{subject.name}</h3>
                            <p className="text-sm text-muted-foreground mb-3 font-mono">{subject.code}</p>
                            <p className="text-sm text-muted-foreground mb-4">{subject.description}</p>
                            <div className="flex justify-between text-sm">
                                <span className="text-foreground/70">
                                    {subject.topics?.length || 0} topics
                                </span>
                                <span className="text-foreground/70">
                                    {subject.questions?.length || 0} questions
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
