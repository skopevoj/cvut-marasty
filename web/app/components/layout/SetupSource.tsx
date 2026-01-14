'use client';

import { useSettings } from "../../lib/context/SettingsContext";
import { Database, ArrowRight, Upload, Globe } from "lucide-react";
import { useState } from "react";
import { IconButton } from "../ui/IconButton";
export function SetupSource() {
    const { addDataSource } = useSettings();
    const [url, setUrl] = useState('');
    const [isUploading, setIsUploading] = useState(false);

    const handleAddUrl = () => {
        if (!url) return;
        addDataSource({
            name: new URL(url).hostname || 'Remote Source',
            type: 'url',
            url: url
        });
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const data = JSON.parse(event.target?.result as string);
                addDataSource({
                    name: file.name,
                    type: 'local',
                    data: data
                });
            } catch (err) {
                alert('Chyba při čtení souboru. Ujistěte se, že jde o platný JSON.');
            } finally {
                setIsUploading(false);
            }
        };
        reader.readAsText(file);
    };

    return (
        <div className="flex flex-col items-center justify-center gap-6 p-6 md:p-12 text-center animate-in fade-in slide-in-from-bottom-6 duration-700">
            <div className="max-w-md space-y-2">
                <p className="text-text-secondary leading-relaxed">
                    Pro začátek přidejte zdroj otázek.
                </p>
            </div>

            <div className="grid w-full max-w-2xl gap-4 sm:grid-cols-2">
                <div className="glass-card-themed flex flex-col gap-4 p-6 text-left transition-all hover:scale-[1.01] duration-300">
                    <div className="flex items-center gap-2 text-primary">
                        <Globe size={18} />
                        <h2 className="font-bold tracking-tight text-sm uppercase">Vložit URL</h2>
                    </div>
                    <div className="relative">
                        <input
                            type="text"
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            placeholder="https://.../questions.json"
                            className="glass-input pr-10 h-10 text-sm"
                        />
                        <IconButton
                            icon={ArrowRight}
                            variant="frosted"
                            size={18}
                            onClick={handleAddUrl}
                            className="scale-90 md:scale-100 glass-icon-button-active absolute right-1 top-1 h-8 w-8 flex items-center justify-center rounded-lg shadow-lg hover:brightness-110 active:scale-95 transition-all text-white"
                        />
                        <button
                            onClick={handleAddUrl}

                        >
                            <ArrowRight size={16} />
                        </button>
                    </div>
                </div>

                <div className="glass-card-themed flex flex-col gap-4 p-6 text-left transition-all hover:scale-[1.01] duration-300">
                    <div className="flex items-center gap-2 text-primary">
                        <Upload size={18} />
                        <h2 className="font-bold tracking-tight text-sm uppercase">Nahrát soubor</h2>
                    </div>
                    <label className="glass-button !p-2.5 !text-xs flex cursor-pointer items-center justify-center gap-2 hover:brightness-110 active:scale-95 transition-all w-full">
                        <Upload size={14} />
                        <span className="font-semibold drop-shadow-sm">{isUploading ? 'Nahrávání...' : 'Vybrat soubor'}</span>
                        <input type="file" accept=".json" onChange={handleFileUpload} className="hidden" />
                    </label>
                </div>
            </div>
        </div>
    );
}
