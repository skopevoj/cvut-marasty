'use client';

interface BadgeListProps {
    topics: string[];
    topicMap: any;
    questionId: string;
}

export function BadgeList({ topics, topicMap, questionId }: BadgeListProps) {
    return (
        <div className="absolute top-4 left-4 z-10 flex flex-wrap items-center gap-1.5">
            {topics.map((topicId) => (
                <span
                    key={topicId}
                    className="rounded-lg border px-2.5 py-1 text-xs font-medium transition-all duration-200"
                    style={{
                        background: 'var(--subject-bg)',
                        color: 'var(--subject-primary)',
                        border: '1px solid var(--subject-border)',
                    }}
                >
                    {topicMap[topicId] || topicId}
                </span>
            ))}
            <span className="ml-2 font-mono text-[10px] tracking-wider text-[var(--fg-subtle)]">
                #{questionId || 'N/A'}
            </span>
        </div>
    );
}
