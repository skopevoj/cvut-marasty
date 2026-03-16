"use client";

import { useSettingsStore, PRESET_BACKGROUNDS } from "../../lib/stores";
import { Film, Image, Plus, X } from "lucide-react";
import { useState } from "react";
import { SettingRow, Toggle } from "./ui";
import type { Theme } from "../../lib/types";

const THEMES: { id: Theme; label: string; colors: [string, string, string] }[] = [
  { id: "dark", label: "Dark", colors: ["#101014", "#18181c", "#6c8eef"] },
  { id: "light", label: "Light", colors: ["#f4f4f6", "#ffffff", "#4a6cf7"] },
  { id: "catppuccin-mocha", label: "Catppuccin Mocha", colors: ["#1e1e2e", "#313244", "#89b4fa"] },
  { id: "catppuccin-latte", label: "Catppuccin Latte", colors: ["#eff1f5", "#e6e9ef", "#1e66f5"] },
  { id: "tokyo-night", label: "Tokyo Night", colors: ["#1a1b26", "#24283b", "#7aa2f7"] },
  { id: "tokyo-night-light", label: "Tokyo Night Light", colors: ["#d5d6db", "#e4e5ea", "#34548a"] },
];

export function AppearanceTab() {
  const settings = useSettingsStore();
  const [isAddingBackground, setIsAddingBackground] = useState(false);
  const [backgroundName, setBackgroundName] = useState("");
  const [backgroundUrl, setBackgroundUrl] = useState("");
  const [backgroundType, setBackgroundType] = useState<"image" | "video">("image");

  const toggle = (key: string) => {
    settings.updateSetting(key as any, !settings[key as keyof typeof settings]);
  };

  const handleAddBackground = () => {
    if (!backgroundName || !backgroundUrl) return;
    try {
      new URL(backgroundUrl);
      settings.addCustomBackground({
        name: backgroundName,
        type: backgroundType,
        url: backgroundUrl,
        intensity: 0.4,
      });
      setBackgroundName("");
      setBackgroundUrl("");
      setBackgroundType("image");
      setIsAddingBackground(false);
    } catch (e) {
      alert("Neplatná URL");
    }
  };

  return (
    <div>
      <h2 className="text-lg font-bold mb-4 text-[var(--fg-primary)]">Vzhled</h2>

      {/* Theme Picker */}
      <div className="py-4 border-b border-[var(--border-default)]">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--fg-muted)] mb-3">
          Motiv
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {THEMES.map((t) => (
            <button
              key={t.id}
              onClick={() => settings.setTheme(t.id)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border text-left text-sm font-medium transition-colors ${
                settings.theme === t.id
                  ? "border-[var(--subject-primary)] bg-[var(--subject-primary)]/10 text-[var(--fg-primary)]"
                  : "border-[var(--border-default)] text-[var(--fg-muted)] hover:text-[var(--fg-primary)] hover:bg-[var(--bg-surface-hover)]"
              }`}
            >
              <div className="flex gap-0.5 shrink-0">
                {t.colors.map((c, i) => (
                  <div
                    key={i}
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
              <span className="truncate text-xs">{t.label}</span>
            </button>
          ))}
        </div>
      </div>

      <SettingRow label="Monospace písmo" description="Programátorský font v celé aplikaci">
        <Toggle active={settings.monospaceFont} onClick={() => toggle("monospaceFont")} />
      </SettingRow>

      <SettingRow label="Statistiky" description="Zobrazovat úspěšnost u otázek">
        <Toggle active={settings.showStatsBar} onClick={() => toggle("showStatsBar")} />
      </SettingRow>

      <SettingRow label="Pozadí" description="Gradienty nebo vlastní obrázky">
        <Toggle active={settings.backgroundEnabled} onClick={() => toggle("backgroundEnabled")} />
      </SettingRow>

      {settings.backgroundEnabled && (
        <div className="py-4 border-b border-[var(--border-default)]">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--fg-muted)] mb-3">
            Volba pozadí
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {PRESET_BACKGROUNDS.map((bg) => (
              <button
                key={bg.id}
                onClick={() => settings.setBackground(bg.id)}
                className={`p-2 rounded-lg border ${
                  settings.backgroundId === bg.id
                    ? "border-[var(--subject-primary)]"
                    : "border-[var(--border-default)] hover:border-[var(--border-hover)]"
                }`}
              >
                {bg.type === "gradient" ? (
                  <div
                    className="w-full h-12 rounded mb-1.5"
                    style={{
                      background: `linear-gradient(135deg, ${bg.gradientStart} 0%, ${bg.gradientEnd} 100%)`,
                    }}
                  />
                ) : (
                  <div className="w-full h-12 rounded mb-1.5 bg-[var(--bg-surface-hover)] flex items-center justify-center overflow-hidden">
                    <video src={bg.url} className="w-full h-full object-cover" muted preload="metadata" />
                  </div>
                )}
                <p className="text-[11px] font-medium text-[var(--fg-muted)] truncate">{bg.name}</p>
              </button>
            ))}

            {settings.customBackgrounds.map((bg) => (
              <div key={bg.id} className="relative group">
                <button
                  onClick={() => settings.setBackground(bg.id)}
                  className={`w-full p-2 rounded-lg border ${
                    settings.backgroundId === bg.id
                      ? "border-[var(--subject-primary)]"
                      : "border-[var(--border-default)]"
                  }`}
                >
                  <div className="w-full h-12 rounded mb-1.5 bg-[var(--bg-surface-hover)] flex items-center justify-center">
                    {bg.type === "video" ? (
                      <Film size={16} className="text-[var(--fg-muted)]" />
                    ) : (
                      <Image size={16} className="text-[var(--fg-muted)]" />
                    )}
                  </div>
                  <p className="text-[11px] font-medium text-[var(--fg-muted)] truncate">{bg.name}</p>
                </button>
                <button
                  onClick={() => settings.removeCustomBackground(bg.id)}
                  className="absolute -top-1.5 -right-1.5 opacity-0 group-hover:opacity-100 w-5 h-5 flex items-center justify-center bg-[var(--error)] text-white rounded-full text-xs"
                >
                  <X size={12} />
                </button>
              </div>
            ))}

            <button
              onClick={() => setIsAddingBackground(!isAddingBackground)}
              className="p-2 rounded-lg border border-dashed border-[var(--border-default)] hover:border-[var(--border-hover)] flex flex-col items-center justify-center gap-1 min-h-[80px]"
            >
              <Plus size={16} className="text-[var(--fg-muted)]" />
              <p className="text-[11px] text-[var(--fg-muted)]">Přidat</p>
            </button>
          </div>

          {isAddingBackground && (
            <div className="mt-3 p-3 rounded-lg bg-[var(--bg-surface-hover)] border border-[var(--border-default)] space-y-2">
              <input
                type="text"
                value={backgroundName}
                onChange={(e) => setBackgroundName(e.target.value)}
                placeholder="Jméno pozadí..."
                className="glass-input text-sm"
              />
              <select
                value={backgroundType}
                onChange={(e) => setBackgroundType(e.target.value as "image" | "video")}
                className="glass-input text-sm"
              >
                <option value="image">Obrázek</option>
                <option value="video">Video</option>
              </select>
              <input
                type="text"
                value={backgroundUrl}
                onChange={(e) => setBackgroundUrl(e.target.value)}
                placeholder="URL obrázku nebo videa..."
                className="glass-input text-sm"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleAddBackground}
                  className="flex-1 px-3 py-1.5 bg-[var(--primary-color)] text-white rounded-lg text-sm font-semibold hover:opacity-90"
                >
                  Přidat
                </button>
                <button
                  onClick={() => {
                    setIsAddingBackground(false);
                    setBackgroundName("");
                    setBackgroundUrl("");
                  }}
                  className="px-3 py-1.5 bg-[var(--bg-surface-hover)] text-[var(--fg-primary)] rounded-lg text-sm font-semibold border border-[var(--border-default)]"
                >
                  Zrušit
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
