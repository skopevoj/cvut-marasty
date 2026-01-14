'use client';

import { useState } from "react";
import { useQuiz } from "../../lib/context/QuizContext";
import { useSettings } from "../../lib/context/SettingsContext";
import { Contributors } from "./Contributors";
import { AddSourceModal } from "./AddSourceModal";
import { ArrowRight, BookOpen, Upload } from "lucide-react";

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
    const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';

    return (
        <div className="flex flex-1 flex-col items-center justify-between py-2 md:py-4 px-4 animate-in fade-in slide-in-from-bottom-8 duration-1000">
            <div className="flex-1 flex flex-col items-center justify-center w-full max-w-4xl py-8">
                {/* Hero Section */}
                <div className="w-full max-w-xl mx-auto mb-4 md:mb-8">
                    <img
                        src={`${basePath}${settings.theme === 'light' ? '/banner_light.png' : '/banner_dark.png'}`}
                        alt="Příprava na rozstřely"
                        className="w-full drop-shadow-[0_0_30px_rgba(255,255,255,0.1)]"
                    />
                </div>

                {/* Main Content */}
                {noSources ? (
                    <div className="flex flex-col items-center gap-3 w-full max-w-3xl">
                        <div className="w-full space-y-2">
                            <div className="relative flex items-center">
                                <input
                                    type="text"
                                    value={url}
                                    onChange={(e) => setUrl(e.target.value)}
                                    placeholder="Vložte URL adresu otázek..."
                                    className="glass-input w-full pr-12"
                                    onKeyDown={(e) => e.key === 'Enter' && handleAddUrl()}
                                />
                                <button
                                    onClick={handleAddUrl}
                                    disabled={!url}
                                    className="absolute right-1.5 glass-icon-button glass-icon-button-default shrink-0 w-9 h-9"
                                    title="Přidat URL"
                                >
                                    <ArrowRight size={18} />
                                </button>
                            </div>
                            <p className="text-xs text-[var(--fg-muted)] text-left px-1">
                                Např. z GitHub repository nebo jiného veřejného odkazu
                            </p>
                        </div>
                        {/* 
                        <div className="flex items-center gap-3 my-1">
                            <div className="h-px w-16 bg-white/5" />
                            <span className="text-xs text-[var(--fg-muted)]">nebo</span>
                            <div className="h-px w-16 bg-white/5" />
                        </div>

                        <button
                            onClick={() => setIsAddSourceOpen(true)}
                            className="text-sm text-[var(--fg-muted)] hover:text-[var(--fg-primary)] transition-colors flex items-center gap-2"
                        >
                            <Upload size={16} />
                            Nahrát soubor ručně
                        </button> */}
                    </div>
                ) : subjects.length > 0 ? (
                    <div className="flex flex-col items-center gap-4">
                        <h2 className="text-xl md:text-2xl font-semibold text-[var(--fg-primary)]">
                            Vyberte předmět
                        </h2>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 w-full max-w-3xl">
                            {subjects.map((subject) => (
                                <button
                                    key={subject.code || subject.id}
                                    onClick={() => selectSubject(subject.code || '')}
                                    className="glass-card-themed p-4 md:p-6 flex flex-col items-center gap-2 hover:scale-105 transition-all group border-white/10"
                                >
                                    <BookOpen
                                        size={24}
                                        className="text-[var(--fg-primary)] opacity-70 group-hover:opacity-100 transition-opacity"
                                    />
                                    <span className="text-sm md:text-base font-medium text-[var(--fg-primary)]">
                                        {(subject.code || 'N/A').toUpperCase()}
                                    </span>
                                    {subject.name && (
                                        <span className="text-xs text-[var(--fg-muted)] text-center line-clamp-2">
                                            {subject.name}
                                        </span>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col items-center gap-3">
                        <p className="text-[var(--fg-muted)]">Žádné předměty k dispozici</p>
                        <button
                            onClick={() => setIsAddSourceOpen(true)}
                            className="text-sm text-[var(--fg-muted)] hover:text-[var(--fg-primary)] transition-colors flex items-center gap-2"
                        >
                            <Upload size={16} />
                            Přidat další zdroj
                        </button>
                    </div>
                )}
            </div>

            {/* Contributors at the bottom */}
            <div className="w-full max-w-4xl">
                <Contributors />
            </div>

            <AddSourceModal
                isOpen={isAddSourceOpen}
                onClose={() => setIsAddSourceOpen(false)}
            />
        </div>
    );
}


