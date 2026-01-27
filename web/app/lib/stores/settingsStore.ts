import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Settings, DataSource, Theme, Background } from "../types";

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
  addCustomBackground: (background: Omit<Background, "id">) => string;
  removeCustomBackground: (id: string) => void;
  setBackground: (id: string) => void;
}

// ============================================================================
// Presets
// ============================================================================

const PRESET_BACKGROUNDS: Background[] = [
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
  backgroundEnabled: false,
  backgroundId: "gradient-sunset",
  customBackgrounds: [],
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

      addCustomBackground: (background) => {
        const id = crypto.randomUUID();
        const newBackground: Background = { ...background, id };
        set((state) => ({
          customBackgrounds: [...state.customBackgrounds, newBackground],
        }));
        return id;
      },

      removeCustomBackground: (id) =>
        set((state) => ({
          customBackgrounds: state.customBackgrounds.filter((b) => b.id !== id),
        })),

      setBackground: (id) => set({ backgroundId: id }),
    }),
    {
      name: "quiz-settings",
      onRehydrateStorage: () => (state) => {
        if (state) state.isLoaded = true;
      },
    },
  ),
);
