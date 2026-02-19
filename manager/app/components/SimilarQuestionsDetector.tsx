'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { Subject, Question } from '../types';
import { ArrowLeft, Copy, Trash2, CheckSquare, Square, ChevronDown, ChevronUp, Loader2, Info } from 'lucide-react';
import { LatexRenderer } from './LatexRenderer';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
    subjects: Subject[];
    folderPath: string;
    onBack: () => void;
    onRefresh: () => void;
}

interface QEntry {
    question: Question;
    subject: Subject;
}

interface PairScore {
    i: number;
    j: number;
    sim: number;
}

interface SimilarGroup {
    id: string;
    entries: QEntry[];
    maxSimilarity: number;
}

// ─── Similarity helpers ──────────────────────────────────────────────────────

const STOP_WORDS = new Set([
    'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'has', 'have', 'had',
    'and', 'or', 'not', 'for', 'with', 'that', 'this', 'from', 'which', 'what',
    'je', 'jsou', 'se', 'na', 'do', 'co', 'to', 'jak', 'pro', 'při', 'nebo',
    'ze', 'za', 've', 'po', 'od', 'jako', 'kde', 'že', 'ten', 'tato', 'tyto',
]);

function normalizeText(text: string): string {
    return text
        // Inside LaTeX math blocks: replace \commands with their name (no backslash)
        // so \cap → "cap", \cup → "cup", \exists → "exists", \forall → "forall" etc.
        .replace(/\$\$[\s\S]*?\$\$/g, m => m.replace(/\\([a-zA-Z]+)/g, ' $1 '))
        .replace(/\$[^$]*?\$/g, m => m.replace(/\\([a-zA-Z]+)/g, ' $1 '))
        // Outside math: same treatment for remaining \cmd{...} and bare \cmd
        .replace(/\\([a-zA-Z]+)\{([^}]*)\}/g, ' $1 $2 ')
        .replace(/\\([a-zA-Z]+)/g, ' $1 ')
        .toLowerCase()
        .replace(/[^\w\s]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

function getWords(text: string): Set<string> {
    const words = normalizeText(text).split(' ').filter(w => w.length > 2 && !STOP_WORDS.has(w));
    return new Set(words);
}

function jaccard(a: Set<string>, b: Set<string>): number {
    if (a.size === 0 && b.size === 0) return 1;
    if (a.size === 0 || b.size === 0) return 0;
    let intersection = 0;
    for (const w of a) if (b.has(w)) intersection++;
    return intersection / (a.size + b.size - intersection);
}

/** Expensive O(n²) step — only runs when the entry list changes. */
function computeAllPairs(entries: QEntry[]): PairScore[] {
    const n = entries.length;

    // Word sets of the question stem only
    const questionSets = entries.map(e => getWords(e.question.question));

    // Word sets of ALL answers (correct + wrong) — gives more signal than correct-only
    // and distinguishes questions whose answers differ in LaTeX symbols.
    const answerSets = entries.map(e =>
        getWords((e.question.answers || []).map(a => a.text).join(' '))
    );
    // Whether each entry actually has answer choices (false = open/text question)
    const hasAnswers = entries.map(e => (e.question.answers || []).length > 0);

    const pairs: PairScore[] = [];
    for (let i = 0; i < n; i++) {
        for (let j = i + 1; j < n; j++) {
            const qSim = jaccard(questionSets[i], questionSets[j]);
            if (qSim === 0) continue; // fast-path

            let sim: number;
            if (!hasAnswers[i] && !hasAnswers[j]) {
                // Open questions — compare text only
                sim = qSim;
            } else if (hasAnswers[i] && hasAnswers[j]) {
                const aSim = jaccard(answerSets[i], answerSets[j]);
                // If all answer text is pure short-symbol LaTeX (e.g. "$A$", "$B$"),
                // both word sets end up empty → jaccard(∅,∅)=1 would give a false 100%.
                // In that case fall back to qSim alone (can't compare answers meaningfully).
                if (answerSets[i].size === 0 && answerSets[j].size === 0) {
                    sim = qSim;
                } else {
                    sim = qSim * aSim;
                }
            } else {
                // One has answers, the other doesn't — treat as incomparable
                sim = 0;
            }

            if (sim > 0) pairs.push({ i, j, sim });
        }
    }
    return pairs;
}

/** Fast O(pairs_above_thresh + n) step — runs on every threshold change. */
function groupByThreshold(pairs: PairScore[], entries: QEntry[], thresholdPct: number): SimilarGroup[] {
    const n = entries.length;
    const thresh = thresholdPct / 100;

    const parent = Array.from({ length: n }, (_, i) => i);
    const pairSim: Record<string, number> = {};

    function find(x: number): number {
        if (parent[x] !== x) parent[x] = find(parent[x]);
        return parent[x];
    }
    function union(x: number, y: number) { parent[find(x)] = find(y); }

    for (const { i, j, sim } of pairs) {
        if (sim >= thresh) {
            union(i, j);
            pairSim[`${i}-${j}`] = sim;
        }
    }

    const map = new Map<number, number[]>();
    for (let i = 0; i < n; i++) {
        const root = find(i);
        if (!map.has(root)) map.set(root, []);
        map.get(root)!.push(i);
    }

    const groups: SimilarGroup[] = [];
    for (const indices of map.values()) {
        if (indices.length < 2) continue;
        let maxSim = 0;
        for (let a = 0; a < indices.length; a++) {
            for (let b = a + 1; b < indices.length; b++) {
                const key = `${indices[a]}-${indices[b]}`;
                if (pairSim[key] !== undefined) maxSim = Math.max(maxSim, pairSim[key]);
            }
        }
        groups.push({
            id: indices.join('-'),
            entries: indices.map(i => entries[i]),
            maxSimilarity: maxSim,
        });
    }
    return groups.sort((a, b) => b.maxSimilarity - a.maxSimilarity);
}

// ─── Group Card ──────────────────────────────────────────────────────────────

type GroupMode = 'view' | 'select';

function GroupCard({
    group,
    groupIndex,
    folderPath,
    onDeleted,
}: {
    group: SimilarGroup;
    groupIndex: number;
    folderPath: string;
    onDeleted: (deletedIds: string[]) => void;
}) {
    const [mode, setMode] = useState<GroupMode>('view');
    const [expanded, setExpanded] = useState(true);
    const [kept, setKept] = useState<Set<string>>(() => new Set(group.entries.map(e => e.question.id)));
    const [deleting, setDeleting] = useState(false);
    const [dismissed, setDismissed] = useState(false);

    if (dismissed) return null;

    // ── helpers ──────────────────────────────────────────────────────────────

    async function saveQuestionTopics(entry: QEntry, mergedTopics: string[]) {
        await fetch('/api/fs', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'saveQuestion',
                folderPath,
                data: {
                    subjectCode: entry.subject.code,
                    questionId: entry.question.id,
                    questionData: {
                        question: entry.question.question,
                        questionType: entry.question.questionType,
                        topics: mergedTopics,
                        answers: entry.question.answers,
                        originalText: entry.question.originalText,
                    },
                },
            }),
        });
    }

    async function deleteQuestion(entry: QEntry) {
        await fetch('/api/fs', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'deleteQuestion',
                folderPath,
                data: { subjectCode: entry.subject.code, questionId: entry.question.id },
            }),
        });
    }

    /** Merge topics from `deleted` into each of `keptEntries` (same-subject only). */
    async function mergeAndSave(keptEntries: QEntry[], deletedEntries: QEntry[]) {
        for (const kept of keptEntries) {
            const sameSubjectDeleted = deletedEntries.filter(d => d.subject.code === kept.subject.code);
            if (sameSubjectDeleted.length === 0) continue;

            const merged = [
                ...new Set([
                    ...(kept.question.topics || []),
                    ...sameSubjectDeleted.flatMap(d => d.question.topics || []),
                ]),
            ];
            const original = kept.question.topics || [];
            if (merged.length !== original.length || merged.some(t => !original.includes(t))) {
                await saveQuestionTopics(kept, merged);
            }
        }
    }

    // ── actions ──────────────────────────────────────────────────────────────

    async function handleKeepAll() {
        setDismissed(true);
    }

    async function handleKeepFirst() {
        const keptEntry = group.entries[0];
        const toDelete = group.entries.slice(1);
        setDeleting(true);
        try {
            await mergeAndSave([keptEntry], toDelete);
            await Promise.all(toDelete.map(deleteQuestion));
            onDeleted(toDelete.map(e => e.question.id));
            setDismissed(true);
        } catch {
            alert('Failed to delete some questions');
        } finally {
            setDeleting(false);
        }
    }

    async function handleDeleteUnkept() {
        const keptEntries = group.entries.filter(e => kept.has(e.question.id));
        const toDelete = group.entries.filter(e => !kept.has(e.question.id));
        if (toDelete.length === 0) { setMode('view'); return; }
        setDeleting(true);
        try {
            await mergeAndSave(keptEntries, toDelete);
            await Promise.all(toDelete.map(deleteQuestion));
            onDeleted(toDelete.map(e => e.question.id));
            setDismissed(true);
        } catch {
            alert('Failed to delete some questions');
        } finally {
            setDeleting(false);
        }
    }

    function toggleKept(id: string) {
        setKept(prev => {
            const next = new Set(prev);
            if (next.has(id)) {
                if (next.size === 1) return prev;
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    }

    const simPct = Math.round(group.maxSimilarity * 100);

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97 }}
            className="bg-card border border-border rounded-xl overflow-hidden"
        >
            {/* Group header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-card/80">
                <div className="flex items-center gap-3 flex-wrap">
                    <button
                        onClick={() => setExpanded(v => !v)}
                        className="p-1 hover:bg-accent rounded transition-colors"
                    >
                        {expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                    </button>
                    <span className="text-sm font-semibold text-foreground">Group {groupIndex + 1}</span>
                    <span className="px-2 py-0.5 text-xs rounded bg-secondary text-secondary-foreground font-mono">
                        {group.entries.length} questions
                    </span>
                    <span
                        className="px-2 py-0.5 text-xs rounded font-mono font-bold"
                        style={{
                            background: simPct >= 80 ? 'rgba(239,68,68,0.15)' : simPct >= 60 ? 'rgba(245,158,11,0.15)' : 'rgba(59,130,246,0.15)',
                            color: simPct >= 80 ? 'rgb(239,68,68)' : simPct >= 60 ? 'rgb(245,158,11)' : 'rgb(59,130,246)',
                        }}
                    >
                        {simPct}% similar
                    </span>
                    <div className="flex gap-1 flex-wrap">
                        {[...new Set(group.entries.map(e => e.subject.code))].map(code => (
                            <span key={code} className="px-1.5 py-0.5 text-xs bg-accent rounded font-mono text-muted-foreground">{code}</span>
                        ))}
                    </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0">
                    {mode === 'view' ? (
                        <>
                            <button
                                onClick={handleKeepAll}
                                className="px-3 py-1 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-all"
                            >
                                Keep All
                            </button>
                            <button
                                onClick={handleKeepFirst}
                                disabled={deleting}
                                className="px-3 py-1 text-xs font-medium text-destructive hover:bg-destructive/10 rounded-lg transition-all disabled:opacity-50 flex items-center gap-1"
                                title="Delete all but the first question; merges its categories into the first"
                            >
                                {deleting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                                Keep First Only
                            </button>
                            <button
                                onClick={() => { setMode('select'); setExpanded(true); }}
                                className="px-3 py-1 text-xs font-medium bg-primary/10 text-primary hover:bg-primary/20 rounded-lg transition-all flex items-center gap-1"
                            >
                                <CheckSquare className="w-3 h-3" />
                                Keep Some
                            </button>
                        </>
                    ) : (
                        <>
                            <span className="text-xs text-muted-foreground">
                                {kept.size} kept · {group.entries.length - kept.size} to delete
                            </span>
                            <button
                                onClick={() => setMode('view')}
                                className="px-3 py-1 text-xs font-medium text-muted-foreground hover:bg-accent rounded-lg transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDeleteUnkept}
                                disabled={deleting || group.entries.length === kept.size}
                                className="px-3 py-1 text-xs font-medium text-destructive hover:bg-destructive/10 rounded-lg transition-all disabled:opacity-50 flex items-center gap-1"
                            >
                                {deleting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                                Delete Unchecked
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* Questions */}
            <AnimatePresence initial={false}>
                {expanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.15 }}
                        className="overflow-hidden"
                    >
                        <div className="p-3 grid gap-2">
                            {group.entries.map((entry, idx) => {
                                const isKept = kept.has(entry.question.id);
                                const topicNames = (entry.question.topics || [])
                                    .map(tid => entry.subject.topics?.find(t => t.id === tid)?.name)
                                    .filter((n): n is string => !!n);

                                return (
                                    <div
                                        key={entry.question.id}
                                        className={`rounded-lg border p-3 transition-all ${
                                            mode === 'select'
                                                ? isKept
                                                    ? 'border-primary/40 bg-primary/5'
                                                    : 'border-destructive/30 bg-destructive/5 opacity-60'
                                                : 'border-border bg-background/30'
                                        }`}
                                    >
                                        <div className="flex items-start gap-3">
                                            {mode === 'select' && (
                                                <button
                                                    onClick={() => toggleKept(entry.question.id)}
                                                    className="mt-0.5 shrink-0 text-primary"
                                                >
                                                    {isKept
                                                        ? <CheckSquare className="w-4 h-4" />
                                                        : <Square className="w-4 h-4 text-muted-foreground" />
                                                    }
                                                </button>
                                            )}
                                            <div className="flex-1 min-w-0">
                                                {/* Meta row */}
                                                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                                                    {idx === 0 && mode === 'view' && (
                                                        <span className="px-1.5 py-0.5 text-[10px] bg-primary/10 text-primary rounded font-medium">first</span>
                                                    )}
                                                    <span className="text-xs font-mono text-muted-foreground">{entry.question.id}</span>
                                                    <span className="px-1.5 py-0.5 bg-secondary text-secondary-foreground text-[10px] rounded font-mono">
                                                        {entry.question.questionType}
                                                    </span>
                                                    <span className="text-[10px] text-muted-foreground px-1.5 py-0.5 bg-accent/50 rounded">
                                                        {entry.subject.name}
                                                    </span>
                                                    {/* Categories */}
                                                    {topicNames.map(name => (
                                                        <span key={name} className="text-[10px] px-1.5 py-0.5 bg-primary/10 text-primary rounded">
                                                            {name}
                                                        </span>
                                                    ))}
                                                </div>

                                                {/* Question text */}
                                                <div className="text-sm text-foreground mb-2">
                                                    <LatexRenderer content={entry.question.question} />
                                                </div>

                                                {/* Answers */}
                                                {entry.question.answers && entry.question.answers.length > 0 && (
                                                    <div className="grid gap-0.5">
                                                        {entry.question.answers.map((ans, ai) => (
                                                            <div
                                                                key={ai}
                                                                className={`flex items-start gap-1.5 text-xs px-2 py-1 rounded ${
                                                                    ans.isCorrect
                                                                        ? 'bg-green-500/10 text-green-600 dark:text-green-400'
                                                                        : 'text-muted-foreground'
                                                                }`}
                                                            >
                                                                <span className="mt-0.5 shrink-0 font-mono">{ans.isCorrect ? '✓' : '·'}</span>
                                                                <LatexRenderer content={ans.text} />
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}

// ─── How-it-works panel ──────────────────────────────────────────────────────

function HowItWorks({ threshold }: { threshold: number }) {
    const [open, setOpen] = useState(false);
    return (
        <div className="border border-border rounded-xl overflow-hidden text-sm">
            <button
                onClick={() => setOpen(v => !v)}
                className="w-full flex items-center gap-2 px-4 py-2.5 text-xs font-medium text-muted-foreground hover:bg-accent/50 transition-colors text-left"
            >
                <Info className="w-3.5 h-3.5 shrink-0" />
                How is similarity calculated?
                <ChevronDown className={`w-3.5 h-3.5 ml-auto transition-transform ${open ? 'rotate-180' : ''}`} />
            </button>
            <AnimatePresence initial={false}>
                {open && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.15 }}
                        className="overflow-hidden"
                    >
                        <div className="px-4 pb-4 pt-1 space-y-2 text-xs text-muted-foreground border-t border-border bg-accent/10">
                            <p>
                                Similarity is measured using the <span className="font-semibold text-foreground">Jaccard index</span> on word sets.
                                For two questions A and B:
                            </p>
                            <div className="font-mono bg-background border border-border rounded-lg px-3 py-2 text-[11px] text-foreground text-center">
                                similarity = |A ∩ B| / |A ∪ B|
                            </div>
                            <p>
                                That is: <em>shared words</em> divided by <em>all unique words across both questions</em>.
                                A score of 100% means the questions use exactly the same words; 0% means they share none.
                            </p>
                            <p>
                                Both the <span className="font-semibold text-foreground">question text and all answer texts</span> are
                                concatenated before comparison, so questions like <em>"Select the true statement"</em> are distinguished
                                by their answer content rather than their identical stems.
                            </p>
                            <p>Before comparing, the combined text is pre-processed:</p>
                            <ul className="list-disc list-inside space-y-0.5 pl-1">
                                <li>LaTeX math expressions (<code className="text-[10px]">$…$</code>, <code className="text-[10px]">$$…$$</code>) are replaced with a <code className="text-[10px]">MATH</code> token</li>
                                <li>Common Czech and English stopwords are removed (<em>je, jsou, se, the, is…</em>)</li>
                                <li>Punctuation and short words (≤2 chars) are ignored</li>
                                <li>Text is lowercased</li>
                            </ul>
                            <p>
                                The current threshold of <span className="font-semibold text-foreground">{threshold}%</span> means only question pairs
                                with a Jaccard score ≥ {threshold/100} are considered similar.
                                Questions above this threshold are then clustered into groups
                                using <span className="font-semibold text-foreground">Union-Find</span> — so if A≈B and B≈C, all three end up in one group
                                even if A and C are not directly similar to each other.
                            </p>
                            <p className="text-[10px] opacity-70">
                                Note: all pairwise scores are computed once on load. Adjusting the threshold only
                                re-filters existing scores, so the slider is instant.
                            </p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

// ─── Main component ──────────────────────────────────────────────────────────

export function SimilarQuestionsDetector({ subjects, folderPath, onBack, onRefresh }: Props) {
    // sliderValue updates immediately for display; threshold is debounced for grouping
    const [sliderValue, setSliderValue] = useState(70);
    const [threshold, setThreshold] = useState(70);
    const [deletedIds, setDeletedIds] = useState<Set<string>>(new Set());

    // Debounce threshold: only regroup after slider settles for 250 ms
    useEffect(() => {
        const t = setTimeout(() => setThreshold(sliderValue), 250);
        return () => clearTimeout(t);
    }, [sliderValue]);

    const allEntries = useMemo<QEntry[]>(() => {
        const entries: QEntry[] = [];
        for (const subject of subjects) {
            for (const question of subject.questions || []) {
                if (!deletedIds.has(question.id)) {
                    entries.push({ question, subject });
                }
            }
        }
        return entries;
    }, [subjects, deletedIds]);

    // Expensive step: only runs when entry list changes (mount + after deletions)
    const allPairs = useMemo(() => computeAllPairs(allEntries), [allEntries]);

    // Cheap step: just filters pre-computed pairs, runs on threshold change
    const groups = useMemo(() => groupByThreshold(allPairs, allEntries, threshold), [allPairs, allEntries, threshold]);

    const handleDeleted = useCallback((ids: string[]) => {
        setDeletedIds(prev => {
            const next = new Set(prev);
            ids.forEach(id => next.add(id));
            return next;
        });
        onRefresh();
    }, [onRefresh]);

    const totalQuestions = allEntries.length;
    const inGroups = groups.reduce((sum, g) => sum + g.entries.length, 0);
    const isPending = sliderValue !== threshold;

    const sliderColor = sliderValue >= 80 ? 'rgb(239,68,68)' : sliderValue >= 60 ? 'rgb(245,158,11)' : 'rgb(59,130,246)';

    return (
        <div className="h-full flex flex-col">
            {/* Header */}
            <div className="flex-shrink-0 border-b border-border bg-card/30 backdrop-blur-sm px-6 py-4">
                <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <button onClick={onBack} className="p-2 hover:bg-accent rounded-lg transition-colors">
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <div>
                            <h2 className="text-lg font-semibold flex items-center gap-2">
                                <Copy className="w-4 h-4 text-primary" />
                                Similar Questions
                            </h2>
                            <p className="text-xs text-muted-foreground">
                                {totalQuestions} questions scanned
                                {isPending ? (
                                    <span className="ml-1 opacity-50">· computing…</span>
                                ) : (
                                    <span> · <span className="font-medium text-foreground">{groups.length}</span> group{groups.length !== 1 ? 's' : ''} · <span className="font-medium text-foreground">{inGroups}</span> questions involved</span>
                                )}
                            </p>
                        </div>
                    </div>

                    {/* Threshold slider */}
                    <div className="flex items-center gap-3 bg-accent/30 border border-border rounded-xl px-4 py-2.5">
                        <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">Similarity threshold</span>
                        <input
                            type="range"
                            min={10}
                            max={100}
                            step={5}
                            value={sliderValue}
                            onChange={e => setSliderValue(Number(e.target.value))}
                            className="w-32 accent-primary cursor-pointer"
                        />
                        <span className="text-sm font-bold font-mono w-10 text-right flex items-center gap-1" style={{ color: sliderColor }}>
                            {sliderValue}%
                            {isPending && <Loader2 className="w-3 h-3 animate-spin opacity-50" />}
                        </span>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-auto p-6">
                <div className="max-w-4xl mx-auto space-y-4">
                    <HowItWorks threshold={threshold} />

                    {groups.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-48 text-center">
                            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
                                <Copy className="w-7 h-7 text-primary" />
                            </div>
                            <p className="text-base font-medium text-foreground mb-1">No similar questions found</p>
                            <p className="text-sm text-muted-foreground">
                                No pairs reached ≥{threshold}% similarity. Try lowering the threshold.
                            </p>
                        </div>
                    ) : (
                        <AnimatePresence mode="popLayout">
                            {groups.map((group, i) => (
                                <GroupCard
                                    key={group.id}
                                    group={group}
                                    groupIndex={i}
                                    folderPath={folderPath}
                                    onDeleted={handleDeleted}
                                />
                            ))}
                        </AnimatePresence>
                    )}
                </div>
            </div>
        </div>
    );
}
