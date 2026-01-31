"use client";

import { useSettingsStore, PRESET_BACKGROUNDS } from "../../lib/stores";
import { Moon, Sun, Image, Film, Plus, X } from "lucide-react";
import { useState } from "react";
import { SettingRow, Toggle } from "./ui";

export function AppearanceTab() {
  const settings = useSettingsStore();
  const [isAddingBackground, setIsAddingBackground] = useState(false);
  const [backgroundName, setBackgroundName] = useState("");
  const [backgroundUrl, setBackgroundUrl] = useState("");
  const [backgroundType, setBackgroundType] = useState<"image" | "video">(
    "image",
  );

  const toggle = (key: string) => {
    settings.updateSetting(key as any, !settings[key as keyof typeof settings]);
  };

  const toggleTheme = () => {
    settings.updateSetting(
      "theme",
      settings.theme === "dark" ? "light" : "dark",
    );
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
    <div className="animate-in fade-in slide-in-from-right-2 md:slide-in-from-right-4 duration-300">
      <h2 className="text-xl md:text-2xl font-bold mb-4 md:mb-6 text-[var(--fg-primary)]">
        Vzhled
      </h2>

      <SettingRow
        label="Motiv"
        description="Přepnout mezi světlým a tmavým režimem"
      >
        <button
          onClick={toggleTheme}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[var(--fg-primary)]/5 border border-[var(--border-default)] hover:bg-[var(--fg-primary)]/10 transition-colors text-xs md:text-sm font-medium"
        >
          {settings.theme === "dark" ? (
            <Moon size={14} className="md:w-4 md:h-4" />
          ) : (
            <Sun size={14} className="md:w-4 md:h-4" />
          )}
          {settings.theme === "dark" ? "Tmavý" : "Světlý"}
        </button>
      </SettingRow>

      <SettingRow
        label="Statistiky"
        description="Zobrazovat úspěšnost u otázek"
      >
        <Toggle
          active={settings.showStatsBar}
          onClick={() => toggle("showStatsBar")}
        />
      </SettingRow>

      <SettingRow
        label="Pozadí"
        description="Animované gradienty nebo vlastní obrázky"
      >
        <Toggle
          active={settings.backgroundEnabled}
          onClick={() => toggle("backgroundEnabled")}
        />
      </SettingRow>

      {settings.backgroundEnabled && (
        <div className="py-4 md:py-5 border-b border-[var(--border-default)]">
          <div className="mb-4">
            <h3 className="text-sm font-medium text-[var(--fg-primary)] mb-3">
              Volba pozadí
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 md:gap-3">
              {PRESET_BACKGROUNDS.map((bg) => (
                <button
                  key={bg.id}
                  onClick={() => settings.setBackground(bg.id)}
                  className={`p-3 rounded-2xl transition-all border-2 ${
                    settings.backgroundId === bg.id
                      ? "border-[var(--subject-primary)] bg-[var(--subject-primary)]/10"
                      : "border-[var(--border-default)] hover:border-[var(--subject-primary)]/50"
                  }`}
                >
                  {bg.type === "gradient" ? (
                    <div
                      className="w-full h-16 md:h-20 rounded-xl mb-2"
                      style={{
                        background: `linear-gradient(135deg, ${bg.gradientStart} 0%, ${bg.gradientEnd} 100%)`,
                      }}
                    />
                  ) : (
                    <div className="w-full h-16 md:h-20 rounded-xl mb-2 bg-[var(--fg-primary)]/10 flex items-center justify-center overflow-hidden">
                      <video
                        src={bg.url}
                        className="w-full h-full object-cover"
                        muted
                        preload="metadata"
                      />
                    </div>
                  )}
                  <p className="text-xs font-medium text-[var(--fg-primary)] truncate">
                    {bg.name}
                  </p>
                </button>
              ))}

              {settings.customBackgrounds.map((bg) => (
                <div key={bg.id} className="relative group">
                  <button
                    onClick={() => settings.setBackground(bg.id)}
                    className={`w-full p-3 rounded-2xl transition-all border-2 ${
                      settings.backgroundId === bg.id
                        ? "border-[var(--subject-primary)] bg-[var(--subject-primary)]/10"
                        : "border-[var(--border-default)] hover:border-[var(--subject-primary)]/50"
                    }`}
                  >
                    <div className="w-full h-16 md:h-20 rounded-xl mb-2 bg-[var(--fg-primary)]/10 flex items-center justify-center">
                      {bg.type === "video" ? (
                        <Film size={20} className="text-[var(--fg-muted)]" />
                      ) : (
                        <Image size={20} className="text-[var(--fg-muted)]" />
                      )}
                    </div>
                    <p className="text-xs font-medium text-[var(--fg-primary)] truncate">
                      {bg.name}
                    </p>
                  </button>
                  <button
                    onClick={() => settings.removeCustomBackground(bg.id)}
                    className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity w-6 h-6 flex items-center justify-center bg-[var(--error)] text-white rounded-full"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}

              <button
                onClick={() => setIsAddingBackground(!isAddingBackground)}
                className="p-3 rounded-2xl border-2 border-dashed border-[var(--border-default)] hover:border-[var(--subject-primary)] transition-all flex flex-col items-center justify-center gap-1 min-h-32 md:min-h-40"
              >
                <Plus size={20} className="text-[var(--fg-muted)]" />
                <p className="text-xs text-[var(--fg-muted)]">Přidat</p>
              </button>
            </div>
          </div>

          {isAddingBackground && (
            <div className="mt-4 p-4 md:p-5 rounded-2xl bg-[var(--fg-primary)]/[0.03] border border-[var(--border-default)] space-y-3">
              <input
                type="text"
                value={backgroundName}
                onChange={(e) => setBackgroundName(e.target.value)}
                placeholder="Jméno pozadí..."
                className="w-full rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--subject-primary)]/50"
              />
              <select
                value={backgroundType}
                onChange={(e) =>
                  setBackgroundType(e.target.value as "image" | "video")
                }
                className="w-full rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--subject-primary)]/50"
              >
                <option value="image">Obrázek</option>
                <option value="video">Video</option>
              </select>
              <input
                type="text"
                value={backgroundUrl}
                onChange={(e) => setBackgroundUrl(e.target.value)}
                placeholder="URL obrázku nebo videa..."
                className="w-full rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--subject-primary)]/50"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleAddBackground}
                  className="flex-1 px-4 py-2 bg-[var(--subject-primary)] text-white rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity"
                >
                  Přidat
                </button>
                <button
                  onClick={() => {
                    setIsAddingBackground(false);
                    setBackgroundName("");
                    setBackgroundUrl("");
                  }}
                  className="px-4 py-2 bg-[var(--fg-primary)]/10 text-[var(--fg-primary)] rounded-xl text-sm font-semibold hover:bg-[var(--fg-primary)]/20 transition-colors"
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
