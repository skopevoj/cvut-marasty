'use client';

import { useSettings } from "../../lib/context/SettingsContext";
import { BarChart2, Shuffle, PenTool, Sun, Moon, Database, Trash2, Globe, FileJson, Plus, Upload } from "lucide-react";
import { SettingsToggle } from "./SettingsToggle";
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
        <div className="flex flex-col gap-4 max-h-[80vh] overflow-y-auto pr-2">
            <div>
                <div className="mb-3 flex items-center justify-between">
                    <label className="flex items-center gap-2 text-sm font-bold text-text-primary">
                        <Database size={18} />
                        Zdroje dat
                    </label>
                    <button
                        onClick={() => setIsAdding(!isAdding)}
                        className="p-1 hover:bg-[var(--bg-secondary)] rounded-lg transition-colors text-primary"
                    >
                        <Plus size={20} />
                    </button>
                </div>

                {isAdding && (
                    <div className="mb-4 space-y-3 p-3 rounded-2xl bg-[var(--bg-secondary)] animate-in fade-in slide-in-from-top-2">
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={newUrl}
                                onChange={(e) => setNewUrl(e.target.value)}
                                placeholder="Vložit URL..."
                                className="flex-1 rounded-xl border border-[var(--border-default)] bg-[var(--bg-card)] p-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                            />
                            <button
                                onClick={handleAddUrl}
                                className="px-3 bg-primary text-white rounded-xl text-xs font-bold"
                            >
                                Přidat
                            </button>
                        </div>
                        <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-[var(--border-default)] p-2 text-xs font-medium text-text-secondary hover:text-primary transition-colors">
                            <Upload size={14} />
                            Nahrát questions.json
                            <input type="file" accept=".json" onChange={handleFileUpload} className="hidden" />
                        </label>
                    </div>
                )}

                <div className="space-y-2">
                    {settings.dataSources.map(source => (
                        <div key={source.id} className="flex items-center justify-between p-3 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-default)]">
                            <div className="flex items-center gap-3 min-w-0">
                                <div className={`p-2 rounded-xl ${source.enabled ? 'bg-primary/10 text-primary' : 'bg-[var(--bg-secondary)] text-text-secondary'}`}>
                                    {source.type === 'url' ? <Globe size={16} /> : <FileJson size={16} />}
                                </div>
                                <div className="min-w-0">
                                    <div className="text-sm font-medium truncate leading-none mb-1">{source.name}</div>
                                    <div className="text-[10px] text-text-secondary truncate">{source.type === 'url' ? source.url : 'Místní soubor'}</div>
                                </div>
                            </div>
                            <div className="flex items-center gap-1">
                                <button
                                    onClick={() => toggleDataSource(source.id)}
                                    className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors ${source.enabled ? 'text-primary' : 'text-text-secondary'}`}
                                >
                                    <div className={`w-4 h-4 rounded-full border-2 ${source.enabled ? 'bg-primary border-primary' : 'border-[var(--border-default)]'}`} />
                                </button>
                                <button
                                    onClick={() => removeDataSource(source.id)}
                                    className="w-8 h-8 flex items-center justify-center text-red-500/50 hover:text-red-500 transition-colors"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                    ))}
                    {settings.dataSources.length === 0 && (
                        <p className="text-center py-4 text-sm text-text-secondary italic">Žádné zdroje dat</p>
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
        </div>
    );
}
