"use client";

import { ReactNode } from "react";
import { useDataLoader, useThemeSync, useQueueSync } from "../hooks";
import { useSettingsStore } from "../stores/settingsStore";
import { OnboardingModal } from "../../components/layout/OnboardingModal";

// ============================================================================
// App Initializer - Sets up data loading, theme sync, and queue sync
// ============================================================================

function AppInitializer({ children }: { children: ReactNode }) {
  useDataLoader();
  useThemeSync();
  useQueueSync();

  const isLoaded = useSettingsStore((s) => s.isLoaded);
  const onboardingDone = useSettingsStore((s) => s.onboardingDone);

  return (
    <>
      {children}
      {isLoaded && !onboardingDone && <OnboardingModal />}
    </>
  );
}

// ============================================================================
// Provider - Minimal wrapper for the app
// ============================================================================

export function StoreProvider({ children }: { children: ReactNode }) {
  return <AppInitializer>{children}</AppInitializer>;
}
