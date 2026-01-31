import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Settings, DataSource, Theme, Background } from "../types";

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Ensures a backend URL has a protocol (https://)
 */
export const normalizeBackendUrl = (url: string): string => {
  if (!url || url.trim() === "") return "";
  const trimmed = url.trim();
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }
  return `https://${trimmed}`;
};

// ============================================================================
// Types
// ============================================================================

interface SettingsState extends Settings {
  isLoaded: boolean;
}

interface SettingsActions {
  updateSetting: <K extends keyof Settings>(key: K, value: Settings[K]) => void;
  refreshUid: () => void;
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

export const PRESET_BACKGROUNDS: Background[] = [
  {
    id: "gradient-sunset",
    name: "Sunset",
    type: "gradient",
    gradientStart: "#FF5F6D",
    gradientEnd: "#FFC371",
    intensity: 0.4,
  },
  {
    id: "gradient-ocean",
    name: "Deep Ocean",
    type: "gradient",
    gradientStart: "#2193b0",
    gradientEnd: "#6dd5ed",
    intensity: 0.35,
  },
  {
    id: "gradient-aurora",
    name: "Aurora",
    type: "gradient",
    gradientStart: "#00b09b",
    gradientEnd: "#96c93d",
    intensity: 0.3,
  },
  {
    id: "gradient-cosmic",
    name: "Cosmic",
    type: "gradient",
    gradientStart: "#8E2DE2",
    gradientEnd: "#4A00E0",
    intensity: 0.4,
  },
  {
    id: "gradient-midnight",
    name: "Midnight",
    type: "gradient",
    gradientStart: "#232526",
    gradientEnd: "#414345",
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

const generateUid = () => {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
};

const generateRandomCzechUsername = () => {
  const adjectives = [
    "Rychlý",
    "Chytrý",
    "Veselý",
    "Modrý",
    "Červený",
    "Zelený",
    "Odvážný",
    "Tichý",
    "Divoký",
    "Zlatý",
    "Stříbrný",
    "Tajemný",
    "Bystrý",
    "Mocný",
    "Moudrý",
    "Laskavý",
  ];
  const nouns = [
    "Lev",
    "Vlk",
    "Medvěd",
    "Orel",
    "Sokol",
    "Jelen",
    "Kapr",
    "Králík",
    "Křeček",
    "Ježek",
    "Rys",
    "Bobr",
    "Kamzík",
    "Lišák",
    "Havran",
    "Čáp",
  ];

  const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  return `${adj}${noun}`;
};

// ============================================================================
// Default Settings
// ============================================================================

const DEFAULT_SETTINGS: Settings = {
  uid: generateUid(),
  username: generateRandomCzechUsername(),
  backendUrl: "https://cvut-marasty-production.up.railway.app",
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

      updateSetting: (key, value) => {
        if (key === "backendUrl" && typeof value === "string") {
          set({ [key]: normalizeBackendUrl(value) });
        } else {
          set({ [key]: value });
        }
      },

      refreshUid: () => set({ uid: generateUid() }),

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
