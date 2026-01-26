import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Settings, DataSource, Theme } from "../types";

// ============================================================================
// Types
// ============================================================================

interface SettingsState extends Settings {
  isLoaded: boolean;
}

interface SettingsActions {
  updateSetting: <K extends keyof Settings>(key: K, value: Settings[K]) => void;
  addDataSource: (source: Omit<DataSource, "id" | "enabled">) => string;
  removeDataSource: (id: string) => void;
  toggleDataSource: (id: string) => void;
  setTheme: (theme: Theme) => void;
}

// ============================================================================
// Default Settings
// ============================================================================

const DEFAULT_SETTINGS: Settings = {
  showStatsBar: true,
  shuffleAnswers: true,
  whiteboardEnabled: true,
  checkUpdatesOnStartup: true,
  theme: "dark",
  dataSources: [],
};

// ============================================================================
// Store
// ============================================================================

export const useSettingsStore = create<SettingsState & SettingsActions>()(
  persist(
    (set) => ({
      ...DEFAULT_SETTINGS,
      isLoaded: false,

      updateSetting: (key, value) => set({ [key]: value }),

      addDataSource: (source) => {
        const id = crypto.randomUUID();
        const newSource: DataSource = { ...source, id, enabled: true };
        set((state) => ({
          dataSources: [...state.dataSources, newSource],
        }));
        return id;
      },

      removeDataSource: (id) =>
        set((state) => ({
          dataSources: state.dataSources.filter((s) => s.id !== id),
        })),

      toggleDataSource: (id) =>
        set((state) => ({
          dataSources: state.dataSources.map((s) =>
            s.id === id ? { ...s, enabled: !s.enabled } : s,
          ),
        })),

      setTheme: (theme) => set({ theme }),
    }),
    {
      name: "quiz-settings",
      onRehydrateStorage: () => (state) => {
        if (state) state.isLoaded = true;
      },
    },
  ),
);
