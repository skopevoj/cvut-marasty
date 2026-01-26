import { useEffect } from "react";
import { useSettingsStore } from "../stores/settingsStore";
import { useDataStore } from "../stores/dataStore";
import { fetchAllData } from "../actions/dataActions";

// ============================================================================
// Data Loading Hook - Triggers data fetch on settings change
// ============================================================================

export function useDataLoader() {
  const dataSources = useSettingsStore((s) => s.dataSources);
  const checkUpdatesOnStartup = useSettingsStore(
    (s) => s.checkUpdatesOnStartup,
  );
  const isLoaded = useSettingsStore((s) => s.isLoaded);
  const loading = useDataStore((s) => s.loading);

  useEffect(() => {
    if (isLoaded) {
      fetchAllData();
    }
  }, [dataSources, checkUpdatesOnStartup, isLoaded]);

  return loading;
}

// ============================================================================
// Theme Sync Hook - Syncs theme with document
// ============================================================================

export function useThemeSync() {
  const theme = useSettingsStore((s) => s.theme);

  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.setAttribute("data-theme", theme);
    }
  }, [theme]);
}
