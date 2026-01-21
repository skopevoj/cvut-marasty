"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { storageHelper } from "@/app/lib/helper/storageHelper";

export interface DataSource {
  id: string;
  name: string;
  type: "url" | "local";
  url?: string;
  enabled: boolean;
}

interface Settings {
  showStatsBar: boolean;
  shuffleAnswers: boolean;
  whiteboardEnabled: boolean;
  checkUpdatesOnStartup: boolean;
  theme: "light" | "dark";
  dataSources: DataSource[];
}

interface SettingsContextType {
  settings: Settings;
  updateSetting: <K extends keyof Settings>(key: K, value: Settings[K]) => void;
  addDataSource: (
    source: Omit<DataSource, "id" | "enabled"> & { data?: any },
  ) => void;
  removeDataSource: (id: string) => void;
  toggleDataSource: (id: string) => void;
}

const defaultSettings: Settings = {
  showStatsBar: true,
  shuffleAnswers: true,
  whiteboardEnabled: true,
  checkUpdatesOnStartup: true,
  theme: "dark",
  dataSources: [],
};

const SettingsContext = createContext<SettingsContextType | undefined>(
  undefined,
);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const loadSettings = async () => {
      const saved = localStorage.getItem("quiz-settings");
      if (saved) {
        try {
          const parsed = JSON.parse(saved);

          // Migration: Move existing local data from localStorage to IndexedDB
          if (parsed.dataSources) {
            for (const source of parsed.dataSources) {
              if (source.type === "local" && source.data) {
                console.log(
                  `Migrating data for source ${source.name} to IndexedDB...`,
                );
                try {
                  await storageHelper.saveData(source.id, source.data);
                  delete source.data;
                } catch (e) {
                  console.error(`Failed to migrate source ${source.name}`, e);
                }
              }
            }
          }

          setSettings({ ...defaultSettings, ...parsed });
        } catch (e) {
          console.error("Failed to parse settings", e);
        }
      }
      setIsLoaded(true);
    };

    loadSettings();
  }, []);

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem("quiz-settings", JSON.stringify(settings));
    }
  }, [settings, isLoaded]);

  const updateSetting = <K extends keyof Settings>(
    key: K,
    value: Settings[K],
  ) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const addDataSource = async (
    source: Omit<DataSource, "id" | "enabled"> & { data?: any },
  ) => {
    const id = crypto.randomUUID();

    // If there's local data, save it to IndexedDB instead of localStorage
    if (source.data) {
      try {
        await storageHelper.saveData(id, source.data);
      } catch (e) {
        console.error("Failed to save data to IndexedDB", e);
        return;
      }
    }

    const { data, ...metadata } = source;
    const newSource: DataSource = {
      ...metadata,
      id,
      enabled: true,
    };

    setSettings((prev) => ({
      ...prev,
      dataSources: [...prev.dataSources, newSource],
    }));
  };

  const removeDataSource = async (id: string) => {
    // Clean up IndexedDB
    await storageHelper.deleteData(id);

    setSettings((prev) => ({
      ...prev,
      dataSources: prev.dataSources.filter((s) => s.id !== id),
    }));
  };

  const toggleDataSource = (id: string) => {
    setSettings((prev) => ({
      ...prev,
      dataSources: prev.dataSources.map((s) =>
        s.id === id ? { ...s, enabled: !s.enabled } : s,
      ),
    }));
  };

  return (
    <SettingsContext.Provider
      value={{
        settings,
        updateSetting,
        addDataSource,
        removeDataSource,
        toggleDataSource,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error("useSettings must be used within a SettingsProvider");
  }
  return context;
}
