'use client';

import { useSettings } from "../../lib/SettingsContext";
import { BarChart2, Shuffle, PenTool } from "lucide-react";

export function SettingsMenu() {
    const { settings, updateSetting } = useSettings();

    const toggle = (key: keyof typeof settings) => {
        updateSetting(key, !settings[key]);
    };

    return (
        <div className="flex flex-col gap-2">
            <button
                onClick={() => toggle('showStatsBar')}
                className="group flex items-center justify-between rounded-2xl bg-white/[0.03] border border-white/5 p-4 transition-all hover:bg-white/[0.06] hover:border-white/10"
            >
                <div className="flex items-center gap-4">
                    <div className={`flex h-12 w-12 items-center justify-center rounded-xl border transition-colors ${settings.showStatsBar ? 'border-[var(--subject-primary)]/30 bg-[var(--subject-primary)]/10 text-[var(--subject-primary)]' : 'border-white/5 bg-white/5 text-[var(--fg-muted)]'}`}>
                        <BarChart2 size={24} />
                    </div>
                    <div className="flex flex-col items-start">
                        <span className="text-base font-semibold text-[var(--fg-primary)]">Statistiky</span>
                        <span className="text-sm text-[var(--fg-muted)]">Zobrazovat úspěšnost u otázek</span>
                    </div>
                </div>
                <div className={`h-6 w-11 rounded-full px-1 flex items-center transition-all duration-300 ${settings.showStatsBar ? 'bg-[var(--subject-primary)]' : 'bg-white/10'}`}>
                    <div className={`h-4 w-4 rounded-full bg-white transition-all duration-300 ${settings.showStatsBar ? 'translate-x-5' : 'translate-x-0'}`} />
                </div>
            </button>

            <button
                onClick={() => toggle('shuffleAnswers')}
                className="group flex items-center justify-between rounded-2xl bg-white/[0.03] border border-white/5 p-4 transition-all hover:bg-white/[0.06] hover:border-white/10"
            >
                <div className="flex items-center gap-4">
                    <div className={`flex h-12 w-12 items-center justify-center rounded-xl border transition-colors ${settings.shuffleAnswers ? 'border-[var(--subject-primary)]/30 bg-[var(--subject-primary)]/10 text-[var(--subject-primary)]' : 'border-white/5 bg-white/5 text-[var(--fg-muted)]'}`}>
                        <Shuffle size={24} />
                    </div>
                    <div className="flex flex-col items-start">
                        <span className="text-base font-semibold text-[var(--fg-primary)]">Míchání</span>
                        <span className="text-sm text-[var(--fg-muted)]">Náhodné pořadí odpovědí</span>
                    </div>
                </div>
                <div className={`h-6 w-11 rounded-full px-1 flex items-center transition-all duration-300 ${settings.shuffleAnswers ? 'bg-[var(--subject-primary)]' : 'bg-white/10'}`}>
                    <div className={`h-4 w-4 rounded-full bg-white transition-all duration-300 ${settings.shuffleAnswers ? 'translate-x-5' : 'translate-x-0'}`} />
                </div>
            </button>

            <button
                onClick={() => toggle('whiteboardEnabled')}
                className="group flex items-center justify-between rounded-2xl bg-white/[0.03] border border-white/5 p-4 transition-all hover:bg-white/[0.06] hover:border-white/10"
            >
                <div className="flex items-center gap-4">
                    <div className={`flex h-12 w-12 items-center justify-center rounded-xl border transition-colors ${settings.whiteboardEnabled ? 'border-[var(--subject-primary)]/30 bg-[var(--subject-primary)]/10 text-[var(--subject-primary)]' : 'border-white/5 bg-white/5 text-[var(--fg-muted)]'}`}>
                        <PenTool size={24} />
                    </div>
                    <div className="flex flex-col items-start">
                        <span className="text-base font-semibold text-[var(--fg-primary)]">Kreslicí plátno</span>
                        <span className="text-sm text-[var(--fg-muted)]">Kreslení v pozadí (pouze desktop)</span>
                    </div>
                </div>
                <div className={`h-6 w-11 rounded-full px-1 flex items-center transition-all duration-300 ${settings.whiteboardEnabled ? 'bg-[var(--subject-primary)]' : 'bg-white/10'}`}>
                    <div className={`h-4 w-4 rounded-full bg-white transition-all duration-300 ${settings.whiteboardEnabled ? 'translate-x-5' : 'translate-x-0'}`} />
                </div>
            </button>
        </div>
    );
}
