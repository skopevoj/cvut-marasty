'use client';

import { useSettings } from "../../lib/context/SettingsContext";
import { BarChart2, Shuffle, PenTool, Sun, Moon, Database, Trash2, Globe, FileJson, Plus, Upload } from "lucide-react";
import { SettingsToggle } from "./SettingsToggle";
import { RoomManager } from "./RoomManager";
import { useState } from "react";

export function SettingsMenu() {
    const { settings, updateSetting, addDataSource, removeDataSource, toggleDataSource } = useSettings();
    const [newUrl, setNewUrl] = useState('');
    const [isAdding, setIsAdding] = useState(false);

    const toggle = (key: any) => {
        updateSetting(key, !settings[key as keyof typeof settings]);
    };

    const toggleTheme = () => {
        updateSetting('theme', settings.theme === 'dark' ? 'light' : 'dark');
    };

    const handleAddUrl = () => {
        if (!newUrl) return;
        try {
            const url = new URL(newUrl);
            addDataSource({
                name: url.hostname,
                type: 'url',
                url: newUrl
            });
            setNewUrl('');
            setIsAdding(false);
        } catch (e) {
            alert('Neplatná URL');
        }
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const data = JSON.parse(event.target?.result as string);
                addDataSource({
                    name: file.name,
                    type: 'local',
                    data: data
                });
                setIsAdding(false);
            } catch (err) {
                alert('Chyba při čtení souboru.');
            }
        };
        reader.readAsText(file);
    };

    return (
        <div className="flex flex-col gap-5 max-h-[80vh] overflow-y-auto pr-2">
            <div>
                <div className="mb-4 flex items-center justify-between">
                    <label className="flex items-center gap-2 text-sm font-semibold text-[var(--fg-primary)]">
                        <Database size={18} />
                        Zdroje dat
                    </label>
                    <button
                        onClick={() => setIsAdding(!isAdding)}
                        className="p-2 hover:bg-[var(--bg-surface-hover)] rounded-2xl transition-colors text-[var(--subject-primary)]"
                    >
                        <Plus size={20} />
                    </button>
                </div>

                {isAdding && (
                    <div className="mb-4 space-y-3 p-4 rounded-3xl bg-[var(--bg-elevated)]/50 backdrop-blur-sm border border-[var(--border-default)] animate-in fade-in slide-in-from-top-2">
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={newUrl}
                                onChange={(e) => setNewUrl(e.target.value)}
                                placeholder="Vložit URL..."
                                className="flex-1 rounded-2xl border border-[var(--border-default)] bg-[var(--bg-surface)]/50 px-4 py-2 text-sm text-[var(--fg-primary)] placeholder-[var(--fg-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--subject-primary)] transition-colors backdrop-blur-sm"
                            />
                            <button
                                onClick={handleAddUrl}
                                className="px-4 py-2 bg-[var(--subject-primary)] text-white rounded-2xl text-sm font-semibold hover:opacity-90 transition-opacity"
                            >
                                Přidat
                            </button>
                        </div>
                        <label className="flex cursor-pointer items-center justify-center gap-2 rounded-2xl border border-dashed border-[var(--border-hover)] p-3 text-sm font-medium text-[var(--fg-muted)] hover:text-[var(--subject-primary)] hover:border-[var(--subject-primary)] transition-colors bg-[var(--bg-surface)]/30">
                            <Upload size={16} />
                            Nahrát questions.json
                            <input type="file" accept=".json" onChange={handleFileUpload} className="hidden" />
                        </label>
                    </div>
                )}

                <div className="space-y-3">
                    {settings.dataSources.map(source => (
                        <div key={source.id} className="flex items-center justify-between p-4 rounded-3xl bg-[var(--bg-elevated)]/40 border border-[var(--border-default)] backdrop-blur-sm hover:border-[var(--border-hover)] transition-colors">
                            <div className="flex items-center gap-3 min-w-0">
                                <div className={`p-2.5 rounded-2xl transition-all ${source.enabled ? 'bg-[var(--subject-primary)]/15 text-[var(--subject-primary)]' : 'bg-[var(--bg-surface)]/50 text-[var(--fg-muted)]'}`}>
                                    {source.type === 'url' ? <Globe size={18} /> : <FileJson size={18} />}
                                </div>
                                <div className="min-w-0">
                                    <div className="text-sm font-medium truncate leading-none mb-1 text-[var(--fg-primary)]">{source.name}</div>
                                    <div className="text-xs text-[var(--fg-muted)] truncate">{source.type === 'url' ? source.url : 'Místní soubor'}</div>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => toggleDataSource(source.id)}
                                    className={`w-8 h-8 flex items-center justify-center rounded-xl transition-all ${source.enabled ? 'text-[var(--subject-primary)]' : 'text-[var(--fg-muted)]'}`}
                                >
                                    <div className={`w-4 h-4 rounded-full border-2 transition-all ${source.enabled ? 'bg-[var(--subject-primary)] border-[var(--subject-primary)]' : 'border-[var(--border-default)]'}`} />
                                </button>
                                <button
                                    onClick={() => removeDataSource(source.id)}
                                    className="w-8 h-8 flex items-center justify-center text-[var(--error)]/50 hover:text-[var(--error)] transition-colors"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>
                    ))}
                    {settings.dataSources.length === 0 && (
                        <p className="text-center py-6 text-sm text-[var(--fg-muted)] italic">Žádné zdroje dat</p>
                    )}
                </div>
            </div>

            <div className="h-px bg-[var(--border-default)] my-2" />

            <SettingsToggle
                label="Vzhled"
                description="Tmavý režim"
                icon={settings.theme === 'dark' ? <Moon size={24} /> : <Sun size={24} />}
                isActive={settings.theme === 'dark'}
                onClick={toggleTheme}
            />

            <SettingsToggle
                label="Statistiky"
                description="Zobrazovat úspěšnost u otázek"
                icon={<BarChart2 size={24} />}
                isActive={settings.showStatsBar}
                onClick={() => toggle('showStatsBar')}
            />

            <SettingsToggle
                label="Míchání"
                description="Náhodné pořadí odpovědí"
                icon={<Shuffle size={24} />}
                isActive={settings.shuffleAnswers}
                onClick={() => toggle('shuffleAnswers')}
            />

            <SettingsToggle
                label="Kreslicí plátno"
                description="Kreslení v pozadí (pouze desktop)"
                icon={<PenTool size={24} />}
                isActive={settings.whiteboardEnabled}
                onClick={() => toggle('whiteboardEnabled')}
            />

            <div className="h-px bg-[var(--border-default)] my-2" />

            <RoomManager />
        </div>
    );
}
