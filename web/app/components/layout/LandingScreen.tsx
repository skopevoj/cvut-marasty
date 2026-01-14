'use client';

import { useState } from "react";
import { useQuiz } from "../../lib/context/QuizContext";
import { useSettings } from "../../lib/context/SettingsContext";
import { Contributors } from "./Contributors";
import { AddSourceModal } from "./AddSourceModal";
import { ArrowRight, Play, Globe } from "lucide-react";
import { IconButton } from "../ui/IconButton";

export function LandingScreen() {
    const { subjects, selectSubject } = useQuiz();
    const { settings, addDataSource } = useSettings();
    const [isAddSourceOpen, setIsAddSourceOpen] = useState(false);
    const [url, setUrl] = useState('');

    const openSettings = () => {
        window.dispatchEvent(new CustomEvent('openSettings'));
    };

    const handleAddUrl = () => {
        if (!url) return;
        try {
            const urlObj = new URL(url);
            addDataSource({
                name: urlObj.hostname || 'Vzdálený zdroj',
                type: 'url',
                url: url
            });
            setUrl('');
        } catch (err) {
            alert('Neplatná URL adresa');
        }
    };

    const noSources = settings.dataSources.length === 0;

    return (
        <div className="flex flex-col items-center justify-center py-8 md:py-12 px-4 animate-in fade-in slide-in-from-bottom-8 duration-1000">
            <div className="max-w-4xl w-full text-center space-y-12 md:space-y-16">
                {/* Hero Section */}
                <div className="w-full">
                    <img
                        src="/banner.png"
                        alt="Příprava na rozstřely"
                        className="w-full drop-shadow-[0_0_30px_rgba(255,255,255,0.1)] pr-0 md:pr-10"
                    />
                </div>

                {noSources ? (
                    <div className="flex flex-col items-center gap-2 py-6">
                        <div className="w-full max-w-sm space-y-1">
                            {/* <div className="flex items-center justify-center gap-3 text-[var(--fg-muted)] mb-2">
                                <Globe size={18} />
                                <span className="text-sm font-medium uppercase tracking-widest">Vložte URL s otázkami</span>
                            </div> */}
                            <div className="relative group">
                                <input
                                    type="text"
                                    value={url}
                                    onChange={(e) => setUrl(e.target.value)}
                                    placeholder="Vložte URL adresu..."
                                    className="glass-input w-full h-14 px-6 text-lg rounded-2xl border-white/10 focus:border-[var(--primary-color)]/50 transition-all shadow-2xl"
                                    onKeyDown={(e) => e.key === 'Enter' && handleAddUrl()}
                                />
                                <div className="absolute right-2 top-2">
                                    <IconButton
                                        icon={ArrowRight}
                                        variant="frosted"
                                        onClick={handleAddUrl}
                                        disabled={!url}
                                        className={`h-10 w-10 md:h-10 md:w-10 transition-all ${url ? 'bg-[var(--primary-color)] text-white' : 'opacity-50'}`}
                                    />
                                </div>
                            </div>
                            <p className="text-xs text-[var(--fg-muted)]">
                                Např. z GitHub repository nebo jiného veřejného odkazu
                            </p>
                        </div>

                        <div className="h-px w-24 bg-white/5" />

                        <button
                            onClick={() => setIsAddSourceOpen(true)}
                            className="text-sm text-[var(--fg-muted)] hover:text-[var(--fg-primary)] transition-colors underline underline-offset-4 decoration-white/10"
                        >
                            Nebo nahrát soubor ručně
                        </button>
                    </div>
                ) : (
                    <div className="flex flex-col items-center gap-8">
                        <button
                            onClick={openSettings}
                            className="glass-button px-12 py-5 text-xl font-bold group shadow-2xl shadow-blue-500/10"
                        >
                            <span className="flex items-center gap-3">
                                Spustit Rozstřel
                                <Play size={20} className="group-hover:translate-x-1 transition-transform" />
                            </span>
                        </button>
                    </div>
                )}

                <Contributors />
            </div>

            <AddSourceModal
                isOpen={isAddSourceOpen}
                onClose={() => setIsAddSourceOpen(false)}
            />
        </div>
    );
}


