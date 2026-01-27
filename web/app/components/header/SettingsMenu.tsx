"use client";

import { useSettingsStore } from "../../lib/stores";
import {
  BarChart2,
  Shuffle,
  PenTool,
  Sun,
  Moon,
  Database,
  Trash2,
  Globe,
  FileJson,
  Plus,
  Upload,
  LayoutGrid,
  Users,
  X,
  Check,
  Palette,
  Image,
  Film,
} from "lucide-react";
import { useState } from "react";
import { RoomManager } from "./RoomManager";

type Tab = "general" | "data" | "sync";

export function SettingsMenu() {
  const settings = useSettingsStore();
  const [activeTab, setActiveTab] = useState<Tab>("general");
  const [newUrl, setNewUrl] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [isAddingBackground, setIsAddingBackground] = useState(false);
  const [backgroundName, setBackgroundName] = useState("");
  const [backgroundUrl, setBackgroundUrl] = useState("");
  const [backgroundType, setBackgroundType] = useState<"image" | "video">(
    "image",
  );

  const PRESET_BACKGROUNDS = [
    {
      id: "gradient-sunset",
      name: "Gradient - Sunset",
      type: "gradient",
      gradientStart: "#ff6b6b",
      gradientEnd: "#4ecdc4",
      intensity: 0.4,
    },
    {
      id: "gradient-ocean",
      name: "Gradient - Ocean",
      type: "gradient",
      gradientStart: "#667eea",
      gradientEnd: "#764ba2",
      intensity: 0.35,
    },
    {
      id: "gradient-forest",
      name: "Gradient - Forest",
      type: "gradient",
      gradientStart: "#134e5e",
      gradientEnd: "#71b280",
      intensity: 0.3,
    },
    {
      id: "gradient-cherry",
      name: "Gradient - Cherry",
      type: "gradient",
      gradientStart: "#eb3349",
      gradientEnd: "#f45c43",
      intensity: 0.4,
    },
    {
      id: "gradient-night",
      name: "Gradient - Night",
      type: "gradient",
      gradientStart: "#0f0c29",
      gradientEnd: "#302b63",
      intensity: 0.25,
    },
    {
      id: "video-1",
      name: "Video - Nature 1",
      type: "video",
      url: "/bg/1.mp4",
    },
    {
      id: "video-2",
      name: "Video - Nature 2",
      type: "video",
      url: "/bg/2.mp4",
    },
    {
      id: "video-3",
      name: "Video - Nature 3",
      type: "video",
      url: "/bg/3.mp4",
    },
    {
      id: "video-4",
      name: "Video - Nature 4",
      type: "video",
      url: "/bg/4.mp4",
    },
    {
      id: "video-5",
      name: "Video - Nature 5",
      type: "video",
      url: "/bg/5.mp4",
    },
  ];

  const toggle = (key: string) => {
    settings.updateSetting(key as any, !settings[key as keyof typeof settings]);
  };

  const toggleTheme = () => {
    settings.updateSetting(
      "theme",
      settings.theme === "dark" ? "light" : "dark",
    );
  };

  const handleAddUrl = () => {
    if (!newUrl) return;
    try {
      settings.addDataSource({
        name: new URL(newUrl).hostname,
        type: "url",
        url: newUrl,
      });
      setNewUrl("");
      setIsAdding(false);
    } catch (e) {
      alert("Neplatná URL");
    }
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

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        settings.addDataSource({ name: file.name, type: "local", data });
        setIsAdding(false);
      } catch (err) {
        alert("Chyba při čtení souboru.");
      }
    };
    reader.readAsText(file);
  };

  const SidebarItem = ({
    id,
    label,
    icon: Icon,
  }: {
    id: Tab;
    label: string;
    icon: any;
  }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`flex items-center gap-2.5 md:gap-3 px-3.5 md:px-4 py-2.5 md:py-3 rounded-xl md:rounded-2xl transition-all whitespace-nowrap shrink-0 ${
        activeTab === id
          ? "bg-[var(--fg-primary)]/10 text-[var(--fg-primary)]"
          : "text-[var(--fg-muted)] hover:bg-[var(--fg-primary)]/5 hover:text-[var(--fg-primary)]"
      }`}
    >
      <Icon size={18} className="md:w-5 md:h-5" />
      <span className="font-medium text-[13px] md:text-sm">{label}</span>
    </button>
  );

  const SettingRow = ({
    label,
    description,
    children,
  }: {
    label: string;
    description?: string;
    children: React.ReactNode;
  }) => (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between py-4 md:py-5 border-b border-[var(--border-default)] last:border-0 gap-3">
      <div className="flex flex-col gap-0.5">
        <span className="text-sm font-medium text-[var(--fg-primary)]">
          {label}
        </span>
        {description && (
          <span className="text-[11px] md:text-xs text-[var(--fg-muted)]">
            {description}
          </span>
        )}
      </div>
      <div className="flex justify-end">{children}</div>
    </div>
  );

  const Toggle = ({
    active,
    onClick,
  }: {
    active: boolean;
    onClick: () => void;
  }) => (
    <button
      onClick={onClick}
      className={`relative w-10 md:w-11 h-5 md:h-6 rounded-full transition-all duration-300 ${
        active ? "bg-[var(--subject-primary)]" : "bg-[var(--fg-muted)]/20"
      }`}
    >
      <div
        className={`absolute top-0.5 md:top-1 left-0.5 md:left-1 w-4 h-4 rounded-full bg-white transition-all duration-300 shadow-sm ${
          active ? "translate-x-5" : ""
        }`}
      />
    </button>
  );

  return (
    <div className="flex flex-col md:flex-row -m-6 h-[80vh] md:h-[500px] bg-[var(--bg-surface)] overflow-hidden rounded-b-3xl">
      {/* Sidebar / Tabs */}
      <div className="md:w-56 border-b md:border-b-0 md:border-r border-[var(--border-default)] p-4 flex md:flex-col gap-1.5 md:gap-1 bg-[var(--fg-primary)]/[0.02] overflow-x-auto scrollbar-hide shrink-0">
        <SidebarItem id="general" label="Obecné" icon={LayoutGrid} />
        <SidebarItem id="data" label="Zdroje dat" icon={Database} />
        <SidebarItem id="sync" label="Synchronizace" icon={Users} />
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 md:px-8 py-5 md:py-6 scrollbar-hide">
        {activeTab === "general" && (
          <div className="animate-in fade-in slide-in-from-right-2 md:slide-in-from-right-4 duration-300">
            <h2 className="text-xl md:text-2xl font-bold mb-4 md:mb-6 text-[var(--fg-primary)]">
              Obecné
            </h2>

            <SettingRow
              label="Vzhled"
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

            <SettingRow label="Míchání" description="Náhodné pořadí odpovědí">
              <Toggle
                active={settings.shuffleAnswers}
                onClick={() => toggle("shuffleAnswers")}
              />
            </SettingRow>

            <SettingRow
              label="Kreslicí plátno"
              description="Kreslení v pozadí (pouze desktop)"
            >
              <Toggle
                active={settings.whiteboardEnabled}
                onClick={() => toggle("whiteboardEnabled")}
              />
            </SettingRow>

            <SettingRow
              label="Pozadí"
              description="Animované gradientu nebo vlastní obrázky"
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
                              <Film
                                size={20}
                                className="text-[var(--fg-muted)]"
                              />
                            ) : (
                              <Image
                                size={20}
                                className="text-[var(--fg-muted)]"
                              />
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

            <SettingRow
              label="Aktualizace"
              description="Kontrola nových otázek při startu"
            >
              <Toggle
                active={settings.checkUpdatesOnStartup}
                onClick={() => toggle("checkUpdatesOnStartup")}
              />
            </SettingRow>
          </div>
        )}

        {activeTab === "data" && (
          <div className="animate-in fade-in slide-in-from-right-2 md:slide-in-from-right-4 duration-300">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-3">
              <h2 className="text-xl md:text-2xl font-bold text-[var(--fg-primary)]">
                Zdroje dat
              </h2>
              <button
                onClick={() => setIsAdding(!isAdding)}
                className={`flex items-center justify-center gap-2 px-4 py-2 rounded-2xl text-sm font-semibold transition-all shadow-lg ${
                  isAdding
                    ? "bg-[var(--fg-primary)]/10 text-[var(--fg-primary)] shadow-none"
                    : "bg-[var(--subject-primary)] text-white shadow-[var(--subject-primary)]/20 hover:opacity-90"
                }`}
              >
                {isAdding ? <X size={18} /> : <Plus size={18} />}
                {isAdding ? "Zavřít" : "Přidat zdroj"}
              </button>
            </div>

            {isAdding && (
              <div className="mb-8 space-y-4 p-4 md:p-5 rounded-3xl bg-[var(--fg-primary)]/[0.03] border border-[var(--border-default)] animate-in zoom-in-95 duration-200">
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    value={newUrl}
                    onChange={(e) => setNewUrl(e.target.value)}
                    placeholder="Vložit URL k JSON souboru..."
                    className="flex-1 rounded-2xl border border-[var(--border-default)] bg-[var(--bg-surface)] px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[var(--subject-primary)]/50 transition-all"
                  />
                  <button
                    onClick={handleAddUrl}
                    className="px-6 py-2 bg-[var(--subject-primary)] text-white rounded-2xl text-sm font-semibold hover:opacity-90 transition-opacity"
                  >
                    Přidat URL
                  </button>
                </div>
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-[var(--border-default)]"></div>
                  </div>
                  <div className="relative flex justify-center text-[10px] uppercase">
                    <span className="bg-[var(--bg-surface)] px-2 text-[var(--fg-muted)]">
                      Nebo
                    </span>
                  </div>
                </div>
                <label className="flex cursor-pointer items-center justify-center gap-2 rounded-2xl border border-dashed border-[var(--border-hover)] p-3 md:p-4 text-xs md:text-sm font-medium text-[var(--fg-muted)] hover:text-[var(--subject-primary)] hover:border-[var(--subject-primary)] transition-all bg-[var(--fg-primary)]/[0.01] hover:bg-[var(--subject-primary)]/[0.02]">
                  <Upload size={16} className="md:w-[18px] md:h-[18px]" />
                  Nahrát questions.json z disku
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>
            )}

            <div className="space-y-3 md:space-y-4">
              {settings.dataSources.map((source) => (
                <div
                  key={source.id}
                  className={`group flex items-center justify-between p-3 md:p-4 rounded-2xl md:rounded-3xl bg-[var(--fg-primary)]/5 border border-transparent hover:border-[var(--border-default)] transition-all duration-300 ${
                    !source.enabled ? "opacity-60 grayscale-[0.4]" : ""
                  }`}
                >
                  <div className="flex items-center gap-3 md:gap-4 min-w-0">
                    <div
                      className={`w-10 h-10 md:w-12 md:h-12 flex items-center justify-center rounded-xl md:rounded-2xl transition-all shrink-0 ${
                        source.enabled
                          ? "bg-[var(--subject-primary)]/15 text-[var(--subject-primary)]"
                          : "bg-[var(--fg-primary)]/5 text-[var(--fg-muted)]"
                      }`}
                    >
                      {source.type === "url" ? (
                        <Globe size={18} className="md:w-5 md:h-5" />
                      ) : (
                        <FileJson size={18} className="md:w-5 md:h-5" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="text-[13px] md:text-sm font-bold text-[var(--fg-primary)] truncate">
                        {source.name}
                      </div>
                      <div className="text-[10px] md:text-xs text-[var(--fg-muted)] leading-relaxed truncate max-w-[150px] sm:max-w-none">
                        {source.type === "url" ? source.url : "Místní soubor"}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 md:gap-4 shrink-0">
                    <Toggle
                      active={source.enabled}
                      onClick={() => settings.toggleDataSource(source.id)}
                    />
                    <button
                      onClick={() => settings.removeDataSource(source.id)}
                      className="w-8 h-8 md:w-10 md:h-10 flex items-center justify-center text-[var(--error)]/50 hover:text-[var(--error)] hover:bg-[var(--error)]/10 rounded-xl transition-all"
                    >
                      <Trash2 size={18} className="md:w-5 md:h-5" />
                    </button>
                  </div>
                </div>
              ))}
              {settings.dataSources.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 text-[var(--fg-muted)]">
                  <Database
                    size={40}
                    className="mb-4 opacity-10 md:w-12 md:h-12"
                  />
                  <p className="text-xs md:text-sm italic">Žádné zdroje dat</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "sync" && (
          <div className="animate-in fade-in slide-in-from-right-2 md:slide-in-from-right-4 duration-300">
            <h2 className="text-xl md:text-2xl font-bold mb-4 md:mb-6 text-[var(--fg-primary)]">
              Synchronizace
            </h2>
            <RoomManager />
          </div>
        )}
      </div>
    </div>
  );
}
