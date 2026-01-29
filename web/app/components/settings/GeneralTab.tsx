"use client";

import { useSettingsStore } from "../../lib/stores";
import { SettingRow, Toggle } from "./ui";

export function GeneralTab() {
  const settings = useSettingsStore();

  const toggle = (key: string) => {
    settings.updateSetting(key as any, !settings[key as keyof typeof settings]);
  };

  return (
    <div className="animate-in fade-in slide-in-from-right-2 md:slide-in-from-right-4 duration-300">
      <h2 className="text-xl md:text-2xl font-bold mb-4 md:mb-6 text-[var(--fg-primary)]">
        Obecné
      </h2>

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
        label="Aktualizace"
        description="Kontrola nových otázek při startu"
      >
        <Toggle
          active={settings.checkUpdatesOnStartup}
          onClick={() => toggle("checkUpdatesOnStartup")}
        />
      </SettingRow>
    </div>
  );
}
