'use client';

import { useMemo } from 'react';
import { useQuiz } from "../../lib/context/QuizContext";
import { useStats } from "../../lib/context/StatsContext";
import { statsHelper } from "../../lib/helper/statsHelper";
import * as helpers from "../../lib/helper/headerHelpers";

export function StatsModal() {
    const { attempts } = useStats();
    const { currentSubject, questions, currentSubjectDetails } = useQuiz();

    const topicMap = useMemo(() => {
        return helpers.getTopicMap(currentSubjectDetails);
    }, [currentSubjectDetails]);

    // Graph Data: Last 7 days
    const graphData = useMemo(() => {
        const days = [];
        const now = new Date();
        now.setHours(0, 0, 0, 0);

        for (let i = 6; i >= 0; i--) {
            const date = new Date(now);
            date.setDate(date.getDate() - i);
            const nextDate = new Date(date);
            nextDate.setHours(23, 59, 59, 999);

            const dayAttempts = attempts.filter(a =>
                a.timestamp >= date.getTime() &&
                a.timestamp <= nextDate.getTime() &&
                (!currentSubject || a.subjectCode === currentSubject.code)
            );

            const correct = dayAttempts.filter(a => {
                const q = questions.find(question => question.id === a.questionId);
                return statsHelper.isAttemptCorrect(a, q || null);
            }).length;

            days.push({
                date: date.toLocaleDateString('cs-CZ', { weekday: 'short' }),
                total: dayAttempts.length,
                correct: correct,
                incorrect: dayAttempts.length - correct
            });
        }
        return days;
    }, [attempts, currentSubject, questions]);

    // Categories Data
    const categoriesData = useMemo(() => {
        if (!currentSubject) return [];

        const subjectAttempts = attempts.filter(a => a.subjectCode === currentSubject.code);
        const topics = helpers.getAvailableTopics(questions, currentSubject, topicMap);

        return topics.map(topic => {
            const topicAttempts = subjectAttempts.filter(a =>
                a.topics?.includes(topic.id) || a.topic === topic.id
            );

            if (topicAttempts.length === 0) return { ...topic, percentage: 0, total: 0 };

            const correct = topicAttempts.filter(a => {
                const q = questions.find(question => question.id === a.questionId);
                return statsHelper.isAttemptCorrect(a, q || null);
            }).length;

            return {
                ...topic,
                total: topicAttempts.length,
                percentage: Math.round((correct / topicAttempts.length) * 100)
            };
        })
            .filter(cat => cat.total > 0)
            .sort((a, b) => b.total - a.total);
    }, [attempts, currentSubject, questions, topicMap]);

    const maxDaily = Math.max(...graphData.map(d => d.total), 5);

    return (
        <div className="flex flex-col gap-8 py-2">
            {/* Chart Area */}
            <div>
                <h3 className="mb-6 text-[10px] font-bold text-text-secondary uppercase tracking-[0.2em]">Aktivita za poslední týden</h3>
                <div className="flex h-40 items-end justify-between gap-2 px-1">
                    {graphData.map((day, i) => (
                        <div key={i} className="flex flex-1 flex-col items-center gap-3">
                            <div className="relative w-full flex flex-col items-center justify-end h-32 group">
                                {/* Tooltip on hover */}
                                <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-bg-surface border border-border-default rounded-lg px-2 py-1 text-[10px] opacity-0 group-hover:opacity-100 transition-all duration-200 whitespace-nowrap z-10 shadow-xl backdrop-blur-md">
                                    <span className="font-bold">{day.total}</span> celkem (<span className="text-success">{day.correct} ✓</span>, <span className="text-error">{day.incorrect} ✕</span>)
                                </div>

                                {/* Bars */}
                                <div className="w-full max-w-[12px] md:max-w-[16px] bg-white/5 rounded-full relative overflow-hidden h-full">
                                    <div className="absolute bottom-0 left-0 right-0 bg-white/10 rounded-full"
                                        style={{ height: `${(day.total / maxDaily) * 100}%` }}>
                                        <div className="absolute bottom-0 left-0 right-0 rounded-full transition-all duration-1000"
                                            style={{
                                                height: day.total > 0 ? `${(day.correct / day.total) * 100}%` : '0%',
                                                backgroundColor: 'var(--subject-primary)',
                                                boxShadow: '0 0 15px var(--subject-primary)'
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>
                            <span className="text-[9px] font-bold text-text-secondary uppercase tracking-tight">{day.date}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Categories Area */}
            <div>
                <h3 className="mb-6 text-[10px] font-bold text-text-secondary uppercase tracking-[0.2em]">Úspěšnost podle kategorií</h3>
                <div className="grid gap-4">
                    {categoriesData.map((cat, i) => (
                        <div key={i} className="space-y-2">
                            <div className="flex justify-between text-[11px] px-1">
                                <span className="font-semibold text-text-primary truncate max-w-[70%]">{cat.name}</span>
                                <div className="flex items-center gap-2">
                                    <span className="text-text-secondary font-medium">{cat.percentage}%</span>
                                    <span className="text-[9px] text-text-secondary opacity-40 tabular-nums">({cat.total})</span>
                                </div>
                            </div>
                            <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
                                <div
                                    className="h-full rounded-full transition-all duration-700"
                                    style={{
                                        width: `${cat.percentage}%`,
                                        backgroundColor: 'var(--subject-primary)',
                                        boxShadow: '0 0 12px var(--subject-primary)'
                                    }}
                                />
                            </div>
                        </div>
                    ))}
                    {categoriesData.length === 0 && (
                        <div className="text-center py-12 bg-white/5 rounded-2xl border border-dashed border-white/10">
                            <p className="text-text-secondary text-xs font-medium">Zatím žádná data pro tento předmět</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
