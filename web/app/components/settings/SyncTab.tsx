"use client";

import { useSettingsStore } from "../../lib/stores";
import { RoomManager } from "./RoomManager";
import { SettingRow, SettingInput } from "./ui";

export function SyncTab() {
  const settings = useSettingsStore();

  return (
    <div className="animate-in fade-in slide-in-from-right-2 md:slide-in-from-right-4 duration-300 space-y-8">
      <section>
        <h2 className="text-xl md:text-2xl font-bold mb-4 md:mb-6 text-[var(--fg-primary)]">
          P2P Synchronizace
        </h2>
        <RoomManager />
      </section>

      <section>
        <h2 className="text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--fg-muted)]/60 mb-4 px-1">
          Vzdálené statistiky (Beta)
        </h2>
        <div className="space-y-0.5">
          <SettingRow
            label="Backend URL"
            description="Adresa pro synchronizaci postupu"
          >
            <SettingInput
              value={settings.backendUrl || ""}
              onChange={(e) =>
                settings.updateSetting("backendUrl", e.target.value)
              }
              placeholder="https://stats.marasty.cz"
              className="w-full sm:w-[240px]"
            />
          </SettingRow>
        </div>
      </section>
    </div>
  );
}
