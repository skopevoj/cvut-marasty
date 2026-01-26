"use client";

import { ReactNode } from "react";
import { useDataLoader, useThemeSync, useQueueSync } from "../hooks";

// ============================================================================
// App Initializer - Sets up data loading, theme sync, and queue sync
// ============================================================================

function AppInitializer({ children }: { children: ReactNode }) {
  useDataLoader();
  useThemeSync();
  useQueueSync();

  return <>{children}</>;
}

// ============================================================================
// Provider - Minimal wrapper for the app
// ============================================================================

export function StoreProvider({ children }: { children: ReactNode }) {
  return <AppInitializer>{children}</AppInitializer>;
}
