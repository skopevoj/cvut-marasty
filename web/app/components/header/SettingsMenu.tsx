'use client';

import { useSettings } from "../../lib/context/SettingsContext";
import { BarChart2, Shuffle, PenTool, Sun, Moon } from "lucide-react";
import { SettingsToggle } from "./SettingsToggle";

export function SettingsMenu() {
    const { settings, updateSetting } = useSettings();

    const toggle = (key: keyof typeof settings) => {
        updateSetting(key, !settings[key]);
    };

    const toggleTheme = () => {
        updateSetting('theme', settings.theme === 'dark' ? 'light' : 'dark');
    };

    return (
        <div className="flex flex-col gap-2">
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
