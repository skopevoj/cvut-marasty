import { useSettingsStore, useStatsStore } from "../../lib/stores";
import { SettingRow, Toggle } from "./ui";
import { RefreshCcw, Download, Upload, Check } from "lucide-react";
import { useState } from "react";
import { UserAvatar } from "../ui/UserAvatar";
import { Modal } from "../ui/Modal";

export function GeneralTab() {
  const settings = useSettingsStore();
  const stats = useStatsStore();
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportOptions, setExportOptions] = useState({
    username: true,
    uid: true,
    stats: true,
    dataSources: true,
  });

  const toggle = (key: string) => {
    settings.updateSetting(key as any, !settings[key as keyof typeof settings]);
  };

  const handleRefreshUid = () => {
    if (
      confirm(
        "Opravdu chcete vygenerovat nové ID? Toto ID slouží k vaší identifikaci.",
      )
    ) {
      settings.refreshUid();
    }
  };

  const handleExport = () => {
    const exportData: any = {};
    if (exportOptions.username) exportData.username = settings.username;
    if (exportOptions.uid) exportData.uid = settings.uid;
    if (exportOptions.stats) exportData.stats = stats.attempts;
    if (exportOptions.dataSources)
      exportData.dataSources = settings.dataSources;

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `marasty-profile-${settings.username || "user"}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setIsExportModalOpen(false);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (data.username) settings.updateSetting("username", data.username);
        if (data.uid) settings.updateSetting("uid", data.uid);
        if (data.dataSources)
          settings.updateSetting("dataSources", data.dataSources);
        if (data.stats && Array.isArray(data.stats)) {
          stats.setAttempts(data.stats);
        }
        alert("Profil byl úspěšně importován.");
      } catch (err) {
        alert("Chyba při čtení souboru profilu.");
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="animate-in fade-in slide-in-from-right-2 md:slide-in-from-right-4 duration-300 space-y-8 pb-10">
      {/* User Section - Simplified & Centered */}
      <div className="flex flex-col items-center justify-center py-6 text-center">
        <UserAvatar name={settings.username} size={96} className="mb-4" />
        <div className="space-y-1 w-full max-w-[240px]">
          <input
            type="text"
            value={settings.username || ""}
            onChange={(e) => settings.updateSetting("username", e.target.value)}
            className="text-xl md:text-2xl font-bold bg-transparent border-none text-center outline-none focus:ring-0 placeholder:text-[var(--fg-muted)]/50 w-full text-[var(--fg-primary)]"
            placeholder="Vaše jméno"
          />
          <div className="flex items-center justify-center gap-2 text-[var(--fg-muted)]/50">
            <code className="text-[10px] font-mono tracking-tighter truncate max-w-[150px]">
              {settings.uid}
            </code>
            <button
              onClick={handleRefreshUid}
              className="p-1 hover:bg-[var(--fg-primary)]/5 rounded-lg transition-colors hover:text-[var(--error)]"
              title="Obnovit ID"
            >
              <RefreshCcw size={12} />
            </button>
          </div>
        </div>
      </div>

      {/* Profile Actions */}
      <div className="flex flex-row gap-3 px-2">
        <button
          onClick={() => setIsExportModalOpen(true)}
          className="flex-1 flex items-center justify-center gap-2 py-3 bg-[var(--fg-primary)]/[0.03] border border-[var(--border-default)] text-[var(--fg-primary)] rounded-2xl text-sm font-semibold hover:bg-[var(--fg-primary)]/5 transition-all"
        >
          <Download size={18} className="text-[var(--fg-muted)]" />
          Exportovat
        </button>

        <label className="flex-1 flex items-center justify-center gap-2 py-3 bg-[var(--fg-primary)]/[0.03] border border-[var(--border-default)] text-[var(--fg-primary)] rounded-2xl text-sm font-semibold hover:bg-[var(--fg-primary)]/5 transition-all cursor-pointer text-center">
          <Upload size={18} className="text-[var(--fg-muted)]" />
          Importovat
          <input
            type="file"
            accept=".json"
            onChange={handleImport}
            className="hidden"
          />
        </label>
      </div>

      {/* General Settings */}
      <section>
        <h2 className="text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--fg-muted)]/60 mb-4 px-1">
          Předvolby aplikace
        </h2>
        <div className="space-y-0.5">
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
      </section>

      {/* Export Selection Modal */}
      <Modal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        title="Exportovat profil"
        maxWidth="max-w-md"
      >
        <div className="space-y-6">
          <p className="text-sm text-[var(--fg-muted)] leading-relaxed">
            Vyberte, která data chcete zahrnout do exportovaného souboru. Tento
            soubor pak můžete použít k přenosu svého profilu na jiné zařízení.
          </p>

          <div className="grid grid-cols-1 gap-2">
            {(
              Object.keys(exportOptions) as Array<keyof typeof exportOptions>
            ).map((key) => (
              <button
                key={key}
                onClick={() =>
                  setExportOptions((prev) => ({ ...prev, [key]: !prev[key] }))
                }
                className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${
                  exportOptions[key]
                    ? "bg-[var(--subject-primary)]/5 border-[var(--subject-primary)]/30"
                    : "bg-[var(--fg-primary)]/5 border-transparent hover:bg-[var(--fg-primary)]/10"
                }`}
              >
                <div className="flex flex-col items-start gap-0.5">
                  <span className="text-sm font-bold text-[var(--fg-primary)]">
                    {key === "username"
                      ? "Jméno"
                      : key === "uid"
                        ? "Unikátní ID"
                        : key === "stats"
                          ? "Statistiky a pokroky"
                          : "Zdroje dat"}
                  </span>
                  <span className="text-[11px] text-[var(--fg-muted)]">
                    {key === "username"
                      ? "Uloží vaši aktuální přezdívku"
                      : key === "uid"
                        ? "Uloží váš 64-místný identifikátor"
                        : key === "stats"
                          ? `Uloží všech ${stats.attempts.length} záznamů`
                          : "Uloží seznam vašich zdrojů otázek"}
                  </span>
                </div>
                <div
                  className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${
                    exportOptions[key]
                      ? "bg-[var(--subject-primary)] border-[var(--subject-primary)]"
                      : "border-[var(--fg-muted)]/20"
                  }`}
                >
                  {exportOptions[key] && (
                    <Check size={14} className="text-white" />
                  )}
                </div>
              </button>
            ))}
          </div>

          <button
            onClick={handleExport}
            className="w-full py-4 bg-[var(--subject-primary)] text-white rounded-2xl text-base font-bold hover:opacity-90 transition-all shadow-xl shadow-[var(--subject-primary)]/20 mt-4"
          >
            Stáhnout .json soubor
          </button>
        </div>
      </Modal>
    </div>
  );
}
