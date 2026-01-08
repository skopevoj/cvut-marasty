'use client';

import { useSettings } from "../../lib/SettingsContext";
import { Settings, BarChart2, Shuffle, Check, X } from "lucide-react";

interface SettingsMenuProps {
    onClose: () => void;
}

export function SettingsMenu({ onClose }: SettingsMenuProps) {
    const { settings, updateSetting } = useSettings();

    const toggle = (key: keyof typeof settings) => {
        updateSetting(key, !settings[key]);
    };

    return (
        <div
            className="absolute top-[54px] right-0 w-64 rounded-3xl border shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-[100] overflow-hidden"
            style={{
                borderColor: 'rgba(255, 255, 255, 0.1)',
                backgroundColor: 'rgba(10, 10, 12, 0.95)',
                backdropFilter: 'saturate(180%) blur(20px)',
                WebkitBackdropFilter: 'saturate(180%) blur(20px)',
            }}
        >
            <div className="p-4 border-b border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-semibold text-[var(--fg-primary)]">
                    <Settings size={16} />
                    <span>Nastavení</span>
                </div>
                <button onClick={onClose} className="text-[var(--fg-muted)] hover:text-[var(--fg-primary)] transition-colors">
                    <X size={18} />
                </button>
            </div>

            <div className="p-2">
                <button
                    onClick={() => toggle('showStatsBar')}
                    className="w-full flex items-center justify-between p-3 rounded-2xl hover:bg-white/5 transition-colors text-left"
                >
                    <div className="flex items-center gap-3">
                        <BarChart2 size={18} className="text-[var(--fg-muted)]" />
                        <span className="text-sm text-[var(--fg-primary)]">Zobrazovat úspěšnost</span>
                    </div>
                    <div className={`w-10 h-6 rounded-full transition-colors flex items-center px-1 ${settings.showStatsBar ? 'bg-[var(--subject-primary)]' : 'bg-white/10'}`}>
                        <div className={`w-4 h-4 rounded-full bg-white transition-transform ${settings.showStatsBar ? 'translate-x-4' : 'translate-x-0'}`} />
                    </div>
                </button>

                <button
                    onClick={() => toggle('shuffleAnswers')}
                    className="w-full flex items-center justify-between p-3 rounded-2xl hover:bg-white/5 transition-colors text-left"
                >
                    <div className="flex items-center gap-3">
                        <Shuffle size={18} className="text-[var(--fg-muted)]" />
                        <span className="text-sm text-[var(--fg-primary)]">Míchat odpovědi</span>
                    </div>
                    <div className={`w-10 h-6 rounded-full transition-colors flex items-center px-1 ${settings.shuffleAnswers ? 'bg-[var(--subject-primary)]' : 'bg-white/10'}`}>
                        <div className={`w-4 h-4 rounded-full bg-white transition-transform ${settings.shuffleAnswers ? 'translate-x-4' : 'translate-x-0'}`} />
                    </div>
                </button>
            </div>
        </div>
    );
}
