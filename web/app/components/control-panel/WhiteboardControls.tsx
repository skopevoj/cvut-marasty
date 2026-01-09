'use client';

import { useWhiteboard } from "../../lib/WhiteboardContext";
import { useSettings } from "../../lib/SettingsContext";
import {
    Brush,
    RotateCcw,
} from "lucide-react";
import { useState } from "react";

const COLORS = [
    "#ffffff", // White
    "#3b82f6", // Blue
    "#ef4444", // Red
    "#10b981", // Green
    "#f59e0b", // Yellow
    "#a855f7", // Purple
];

export function WhiteboardControls() {
    const { settings } = useSettings();
    const {
        color, setColor,
        tool, setTool,
        clear
    } = useWhiteboard();
    const [showColors, setShowColors] = useState(false);

    if (!settings.whiteboardEnabled) return null;

    return (
        <div className="hidden md:flex items-center gap-0.5 mx-2 opacity-30 hover:opacity-100 transition-opacity duration-300">
            <div className="relative">
                <button
                    onClick={() => {
                        setShowColors(!showColors);
                        setTool('pencil');
                    }}
                    title="Štětec"
                    className={`p-2 rounded-xl transition-all flex items-center gap-1.5 ${tool === 'pencil'
                        ? "text-[var(--fg-primary)]/80"
                        : "text-[var(--fg-primary)]/40 hover:text-[var(--fg-primary)]/70"
                        }`}
                >
                    <Brush size={16} />
                    <div
                        className="w-1.5 h-1.5 rounded-full mt-0.5"
                        style={{ backgroundColor: color }}
                    />
                </button>

                {showColors && (
                    <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 flex gap-1.5 bg-[var(--modal-bg)]/80 backdrop-blur-md border border-[var(--fg-primary)]/10 p-2 rounded-xl shadow-2xl animate-in fade-in slide-in-from-bottom-2">
                        {COLORS.map(c => (
                            <button
                                key={c}
                                onClick={() => {
                                    setColor(c);
                                    setTool('pencil');
                                    setShowColors(false);
                                }}
                                className={`w-6 h-6 rounded-full border-2 transition-transform hover:scale-110 ${color === c ? "border-[var(--fg-primary)]" : "border-[var(--fg-primary)]/30"
                                    }`}
                                style={{ backgroundColor: c }}
                            />
                        ))}
                    </div>
                )}
            </div>

            <button
                onClick={clear}
                title="Vymazat vše"
                className="p-2 rounded-xl text-[var(--fg-primary)]/80 hover:text-red-400/60 transition-all"
            >
                <RotateCcw size={16} />
            </button>
        </div>
    );
}
