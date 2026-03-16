"use client";

import { useSettingsStore } from "../../lib/stores";
import type { Theme } from "../../lib/types";
import { Check } from "lucide-react";

const THEMES: { id: Theme; label: string; colors: [string, string, string] }[] = [
  { id: "dark", label: "Dark", colors: ["#101014", "#18181c", "#6c8eef"] },
  { id: "catppuccin-mocha", label: "Catppuccin Mocha", colors: ["#1e1e2e", "#313244", "#89b4fa"] },
  { id: "tokyo-night", label: "Tokyo Night", colors: ["#1a1b26", "#24283b", "#7aa2f7"] },
  { id: "light", label: "Light", colors: ["#f4f4f6", "#ffffff", "#4a6cf7"] },
  { id: "catppuccin-latte", label: "Catppuccin Latte", colors: ["#eff1f5", "#e6e9ef", "#1e66f5"] },
  { id: "tokyo-night-light", label: "Tokyo Night Light", colors: ["#d5d6db", "#e4e5ea", "#34548a"] },
];

function SkeletonPreview() {
  return (
    <div className="card p-4 space-y-3 w-full">
      <div className="flex items-center gap-2">
        <div className="h-5 w-20 rounded bg-[var(--subject-primary)]/15 border border-[var(--subject-primary)]/20" />
        <span className="font-mono text-[10px] text-[var(--fg-subtle)]">#a4f29c</span>
      </div>
      <div className="space-y-2 pt-2">
        <div className="h-4 w-full rounded bg-[var(--fg-primary)]/10" />
        <div className="h-4 w-3/4 rounded bg-[var(--fg-primary)]/10" />
      </div>
      <div className="space-y-2 pt-2">
        {[0.85, 0.7, 0.9, 0.6].map((w, i) => (
          <div
            key={i}
            className="flex items-center gap-2 rounded-lg border border-[var(--border-default)] bg-[var(--fg-primary)]/[0.03] p-2"
          >
            <div className="flex gap-0.5 shrink-0">
              <div className="w-6 h-6 rounded bg-[var(--bg-surface-hover)]" />
              <div className="w-6 h-6 rounded bg-[var(--bg-surface-hover)]" />
              <div className="w-6 h-6 rounded bg-[var(--bg-surface-hover)]" />
            </div>
            <div className="h-3 rounded bg-[var(--fg-primary)]/8" style={{ width: `${w * 100}%` }} />
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between pt-2">
        <div className="h-7 w-7 rounded bg-[var(--bg-surface-hover)]" />
        <span className="font-mono text-xs text-[var(--fg-muted)]">1 / 42</span>
        <div className="h-8 w-24 rounded-lg bg-[var(--primary-color)]" />
      </div>
    </div>
  );
}

export function OnboardingModal() {
  const settings = useSettingsStore();

  const finish = () => {
    settings.updateSetting("onboardingDone", true);
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-3xl bg-[var(--modal-bg)] border border-[var(--border-default)] rounded-lg overflow-hidden">
        {/* Header */}
        <div className="px-5 pt-5 pb-3 border-b border-[var(--border-default)]">
          <h2 className="text-lg font-bold text-[var(--fg-primary)]">Nastavení aplikace</h2>
          <p className="text-xs text-[var(--fg-muted)] mt-0.5">Vyberte si motiv a styl písma.</p>
        </div>

        {/* Body: Settings left, Preview right */}
        <div className="flex flex-col md:flex-row">
          <div className="flex-1 p-5 space-y-5">
            {/* Theme picker */}
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--fg-muted)] mb-2">Motiv</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {THEMES.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => settings.setTheme(t.id)}
                    className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg border text-left text-sm font-medium transition-colors ${
                      settings.theme === t.id
                        ? "border-[var(--subject-primary)] bg-[var(--subject-primary)]/10 text-[var(--fg-primary)]"
                        : "border-[var(--border-default)] text-[var(--fg-muted)] hover:text-[var(--fg-primary)] hover:bg-[var(--bg-surface-hover)]"
                    }`}
                  >
                    <div className="flex gap-0.5 shrink-0">
                      {t.colors.map((c, i) => (
                        <div key={i} className="w-3 h-3 rounded-full" style={{ backgroundColor: c }} />
                      ))}
                    </div>
                    <span className="truncate text-xs">{t.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Monospace toggle */}
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--fg-muted)] mb-2">Písmo</h3>
              <button
                onClick={() => settings.updateSetting("monospaceFont", !settings.monospaceFont)}
                className="w-full flex items-center justify-between gap-3 px-3 py-3 rounded-lg border border-[var(--border-default)] hover:bg-[var(--bg-surface-hover)] transition-colors text-left"
              >
                <div>
                  <div className="text-sm font-medium text-[var(--fg-primary)]">Monospace písmo</div>
                  <div className="text-xs text-[var(--fg-muted)]">Programátorský font v celé aplikaci</div>
                </div>
                <div
                  className={`relative w-10 h-5 rounded-full shrink-0 transition-colors ${
                    settings.monospaceFont ? "bg-[var(--primary-color)]" : "bg-[var(--fg-subtle)]"
                  }`}
                >
                  <div
                    className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                      settings.monospaceFont ? "translate-x-5" : "translate-x-0.5"
                    }`}
                  />
                </div>
              </button>
            </div>
          </div>

          {/* Live preview */}
          <div className="hidden md:flex flex-1 p-5 bg-[var(--bg-color)] border-l border-[var(--border-default)] items-start">
            <div className="w-full">
              <div className="text-[10px] uppercase tracking-wider text-[var(--fg-subtle)] font-semibold mb-3">
                Náhled
              </div>
              <SkeletonPreview />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-[var(--border-default)] flex items-center justify-end gap-2">
          <button
            onClick={finish}
            className="text-xs text-[var(--fg-muted)] hover:text-[var(--fg-primary)] px-2 py-1 transition-colors"
          >
            Přeskočit
          </button>
          <button
            onClick={finish}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-[var(--primary-color)] text-white rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            Hotovo
            <Check size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
