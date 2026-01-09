'use client';

import { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Question, Answer } from '../../lib/types/question';
import Latex from '../ui/Latex';
import { Check, X, AlertTriangle, Send } from 'lucide-react';

interface SuggestEditModalProps {
    isOpen: boolean;
    onClose: () => void;
    question: Question;
}

const REASONS = [
    "Chyba v zadání",
    "Chybná správná odpověď",
    "Chybějící odpověď",
    "Typografická chyba / Překlep",
    "Obrázek neodpovídá zadání",
    "Jiné"
];

export function SuggestEditModal({ isOpen, onClose, question }: SuggestEditModalProps) {
    const [reason, setReason] = useState(REASONS[0]);
    const [note, setNote] = useState('');
    const [suggestedQuestion, setSuggestedQuestion] = useState(question.question);
    const [suggestedAnswers, setSuggestedAnswers] = useState<Answer[]>([...question.answers]);

    const handleAnswerTextChange = (index: number, text: string) => {
        const newAnswers = [...suggestedAnswers];
        newAnswers[index] = { ...newAnswers[index], text };
        setSuggestedAnswers(newAnswers);
    };

    const handleToggleCorrect = (index: number) => {
        const newAnswers = [...suggestedAnswers];
        newAnswers[index] = { ...newAnswers[index], isCorrect: !newAnswers[index].isCorrect };
        setSuggestedAnswers(newAnswers);
    };

    const generateGithubUrl = () => {
        const title = encodeURIComponent(`[${question.subjectCode}] [${question.id}] ${reason}`);

        let body = `### Identifikace\n- **ID otázky:** ${question.id}\n- **Předmět:** ${question.subjectCode}\n- **Důvod:** ${reason}\n`;

        if (note.trim()) {
            body += `- **Poznámka:** ${note.trim()}\n`;
        }

        body += `\n`;

        // 1. Original Complete State
        body += `### Původní stav\n`;
        body += `#### Zadání\n${question.question}\n\n`;
        body += `#### Odpovědi\n`;
        question.answers.forEach((ans, i) => {
            body += `- ${ans.isCorrect ? '$\\checkmark$' : '$\\times$'} ${ans.text}\n`;
        });
        body += `\n---\n\n`;

        // 2. Proposed Complete State
        body += `### Navrhovaný stav\n`;
        body += `#### Zadání\n${suggestedQuestion}\n\n`;
        body += `#### Odpovědi\n`;
        suggestedAnswers.forEach((ans, i) => {
            // Find match by index property if available, otherwise array position
            const original = (ans.index !== undefined)
                ? question.answers.find(a => a.index === ans.index)
                : question.answers[i];

            const originalCorrect = original ? Boolean(original.isCorrect) : false;
            const proposedCorrect = Boolean(ans.isCorrect);

            const hasStatusChanged = originalCorrect !== proposedCorrect;
            const hasTextChanged = (original?.text?.trim() || '') !== (ans.text?.trim() || '');

            const marker = ans.isCorrect ? '$\\checkmark$' : '$\\times$';
            const diffInfo = (hasStatusChanged || hasTextChanged) ? ' **(ZMĚNĚNO)**' : '';

            body += `- ${marker} ${ans.text}${diffInfo}\n`;
        });

        const url = `https://github.com/skopevoj/cvut-marasty/issues/new?title=${title}&body=${encodeURIComponent(body)}`;
        return url;
    };

    const handleSubmit = () => {
        window.open(generateGithubUrl(), '_blank');
        onClose();
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Navrhnout úpravu otázky"
            maxWidth="max-w-3xl"
        >
            <div className="flex flex-col gap-6">
                {/* Reason Selection */}
                <div>
                    <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-[var(--fg-muted)]">
                        Důvod nahlášení
                    </label>
                    <select
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        className="w-full rounded-xl border border-[var(--fg-primary)]/10 bg-[var(--fg-primary)]/5 p-3 text-sm focus:border-[var(--subject-primary)] focus:outline-none"
                    >
                        {REASONS.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                </div>

                {/* Note Field */}
                <div>
                    <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-[var(--fg-muted)]">
                        Poznámka (volitelné)
                    </label>
                    <textarea
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        placeholder="Zadejte doplňující informace k úpravě..."
                        className="w-full rounded-xl border border-[var(--fg-primary)]/10 bg-[var(--fg-primary)]/5 p-3 text-sm focus:border-[var(--subject-primary)] focus:outline-none"
                        rows={2}
                    />
                </div>

                {/* Question Text */}
                <div>
                    <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-[var(--fg-muted)]">
                        Zadání otázky
                    </label>
                    <textarea
                        value={suggestedQuestion}
                        onChange={(e) => setSuggestedQuestion(e.target.value)}
                        className="mb-3 w-full rounded-xl border border-[var(--fg-primary)]/10 bg-[var(--fg-primary)]/5 p-3 text-sm focus:border-[var(--subject-primary)] focus:outline-none"
                        rows={3}
                    />
                    <div className="rounded-xl border border-[var(--fg-primary)]/10 bg-[var(--modal-bg)]/20 p-4">
                        <div className="mb-2 text-[10px] font-bold uppercase tracking-widest text-[var(--fg-muted)]">Náhled zadání</div>
                        <Latex tex={suggestedQuestion} className="text-sm" />
                    </div>
                </div>

                {/* Answers */}
                <div>
                    <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-[var(--fg-muted)]">
                        Odpovědi
                    </label>
                    <div className="flex flex-col gap-3">
                        {suggestedAnswers.map((answer, index) => (
                            <div key={index} className="flex flex-col gap-2 rounded-2xl border border-[var(--fg-primary)]/5 bg-[var(--fg-primary)]/[0.02] p-4 transition-all hover:bg-[var(--fg-primary)]/[0.04]">
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={() => handleToggleCorrect(index)}
                                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-all ${answer.isCorrect
                                            ? "bg-green-500/20 text-green-500 border border-green-500/30"
                                            : "bg-red-500/10 text-red-400 border border-red-500/20 opacity-50 hover:opacity-100"
                                            }`}
                                        title={answer.isCorrect ? "Správná odpověď" : "Špatná odpověď"}
                                    >
                                        {answer.isCorrect ? <Check size={16} /> : <X size={16} />}
                                    </button>
                                    <input
                                        type="text"
                                        value={answer.text}
                                        onChange={(e) => handleAnswerTextChange(index, e.target.value)}
                                        className="flex-1 bg-transparent text-sm outline-none focus:text-[var(--fg-primary)]"
                                        placeholder="Text odpovědi..."
                                    />
                                </div>
                                <div className="mt-1 flex items-center gap-2 border-t border-[var(--fg-primary)]/5 pt-2">
                                    <div className="text-[9px] font-bold uppercase tracking-widest text-[var(--fg-muted)]">Náhled:</div>
                                    <Latex tex={answer.text} className="text-xs italic opacity-80" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Submit Button */}
                <div className="mt-4 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="rounded-xl px-6 py-3 text-sm font-medium text-[var(--fg-muted)] transition-colors hover:bg-[var(--fg-primary)]/5 hover:text-[var(--fg-primary)]"
                    >
                        Zrušit
                    </button>
                    <button
                        onClick={handleSubmit}
                        className="flex items-center gap-2 rounded-xl bg-[var(--subject-primary)] px-6 py-3 text-sm font-bold text-[var(--fg-primary)] transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-[var(--subject-primary)]/20"
                    >
                        <Send size={16} />
                        Odeslat návrh na GitHub
                    </button>
                </div>
            </div>
        </Modal>
    );
}
