import type { DataSource, RawSourceData, RawSubjectData, Subject } from "../types";
import { useDataStore } from "../stores/dataStore";
import { useSettingsStore } from "../stores/settingsStore";
import { storageHelper } from "../helper/storageHelper";
import { toast } from "sonner";

// ============================================================================
// Data Loading Actions
// ============================================================================

/**
 * Main entry point. Two modes:
 *  - Cold start (no cached data): full loading screen while fetching.
 *  - Warm start (cached data exists): show cache immediately, then
 *    background-refresh and toast the result.
 */
export async function fetchAllData() {
  const { dataSources, checkUpdatesOnStartup } = useSettingsStore.getState();
  const store = useDataStore.getState();
  const enabledSources = dataSources.filter((s) => s.enabled);

  if (enabledSources.length === 0) {
    store.setSubjects([]);
    store.setAllData(null);
    store.finishLoading();
    return;
  }

  // ── Try cache first ────────────────────────────────────────────────────
  const cached = await loadFromCache(enabledSources);
  const hasCachedData = cached.some((c) => c !== null);

  if (hasCachedData) {
    // Show cached data immediately — no loading spinner
    applyResults(cached, enabledSources);
    store.finishLoading();

    // Then refresh in background if enabled
    if (checkUpdatesOnStartup) {
      refreshInBackground(enabledSources);
    }
    return;
  }

  // ── Cold start — no cache, show loading screen ─────────────────────────
  store.startLoading();
  store.addMessage("Getting sources...");
  store.addMessage(`${enabledSources.length} source(s) found`);

  try {
    let results: (RawSourceData | null)[];

    if (!checkUpdatesOnStartup) {
      store.addMessage("Update check disabled, no cached data available.");
      results = cached; // all nulls
    } else {
      results = await Promise.all(
        enabledSources.map((source, i) =>
          fetchSource(source, i, enabledSources.length).catch((e) => {
            console.error(`Error loading source ${source.name}:`, e);
            return null;
          }),
        ),
      );
    }

    if (!results || !Array.isArray(results)) {
      throw new Error("Failed to load data from sources");
    }

    applyResults(results, enabledSources);
  } catch (err) {
    store.setError(err instanceof Error ? err.message : "Failed to fetch data");
  } finally {
    store.finishLoading();
  }
}

// ============================================================================
// Background Refresh
// ============================================================================

async function refreshInBackground(enabledSources: DataSource[]) {
  try {
    const results = await Promise.all(
      enabledSources.map((source, i) =>
        fetchSource(source, i, enabledSources.length, true).catch((e) => {
          console.error(`Background refresh failed for ${source.name}:`, e);
          return null;
        }),
      ),
    );

    // Check if any source actually changed
    let hasChanges = false;
    for (let i = 0; i < results.length; i++) {
      if (!results[i]) continue;

      const source = enabledSources[i];
      const data = results[i]!;
      const currentHash =
        data.metadata?.hash ||
        data.version ||
        JSON.stringify(data).length.toString();
      const storedHash = localStorage.getItem(`hash_${source.id}`);

      if (storedHash && currentHash !== storedHash) {
        hasChanges = true;
      }

      // Save new data + hash
      storageHelper.saveData(source.id, data).catch(console.warn);
      if (currentHash) localStorage.setItem(`hash_${source.id}`, currentHash);
    }

    if (hasChanges) {
      applyResults(results, enabledSources);
      toast.success("Otázky byly aktualizovány");
    } else {
      // toast("Žádné nové aktualizace");
    }
  } catch (e) {
    console.error("Background refresh error:", e);
  }
}

// ============================================================================
// Apply Results to Store
// ============================================================================

function applyResults(
  results: (RawSourceData | null)[],
  enabledSources: DataSource[],
) {
  const store = useDataStore.getState();
  const mergedSubjects = mergeSourceData(results, enabledSources);

  if (mergedSubjects.length > 0) {
    store.setAllData({ subjects: mergedSubjects });
    store.setSubjects(
      mergedSubjects.map((s) => ({
        id: Number(s.id),
        name: s.name as string,
        code: s.code as string,
        description: (s.description as string) || "",
        repositoryUrl: s.repositoryUrl as string | undefined,
      })),
    );
    store.setError(null);
  } else {
    store.setSubjects([]);
    store.setAllData(null);
    if (enabledSources.length > 0) {
      store.setError("No valid data found in enabled sources");
    }
  }
}

// ============================================================================
// Cache Loading
// ============================================================================

async function loadFromCache(sources: DataSource[]): Promise<(RawSourceData | null)[]> {
  return Promise.all(
    sources.map(async (source) => {
      if (source.type === "local" && source.data) {
        return source.data as RawSourceData;
      }
      try {
        const cached = await storageHelper.getData(source.id) as RawSourceData | null;
        if (cached) return cached;
      } catch (e) {
        console.warn(`No cache for ${source.name}`);
      }
      return null;
    }),
  );
}

// ============================================================================
// Source Fetching
// ============================================================================

async function fetchSource(
  source: DataSource,
  sourceIndex: number,
  totalSources: number,
  silent = false,
): Promise<RawSourceData | null> {
  const store = useDataStore.getState();

  if (source.type !== "url" || !source.url) {
    if (source.type === "local" && source.data) {
      return source.data as RawSourceData;
    }
    const data = await storageHelper.getData(source.id) as RawSourceData | null;
    if (!data) throw new Error(`No local data found for ${source.name}`);
    return data;
  }

  if (!silent) {
    store.addMessage(`Fetching source ${sourceIndex + 1}: ${source.name}...`);
  }

  let cached = null;
  try {
    cached = await storageHelper.getData(source.id);
  } catch (e) {
    console.warn(`Could not load cache for ${source.name}`, e);
  }

  try {
    const res = await fetch(`${source.url}?t=${Date.now()}`);
    if (!res.ok) {
      if (cached) return cached;
      throw new Error(`Server returned ${res.status}`);
    }

    const data = silent
      ? await res.json()
      : await parseResponseWithProgress(res, source, sourceIndex, totalSources);

    if (!data || !data.subjects) {
      console.error(`Invalid JSON structure from ${source.name}:`, data);
      return cached;
    }

    // Only save hash/data in cold-start mode; background mode handles it separately
    if (!silent) {
      const currentHash =
        data.metadata?.hash ||
        data.version ||
        JSON.stringify(data).length.toString();

      storageHelper.saveData(source.id, data).catch(console.warn);
      if (currentHash) localStorage.setItem(`hash_${source.id}`, currentHash);
    }

    return data;
  } catch (fetchErr) {
    if (cached) return cached;
    throw fetchErr;
  }
}

async function parseResponseWithProgress(
  res: Response,
  source: DataSource,
  sourceIndex: number,
  totalSources: number,
): Promise<RawSourceData> {
  const store = useDataStore.getState();
  const contentLength = res.headers.get("content-length");
  const total = contentLength ? parseInt(contentLength, 10) : 0;
  let loaded = 0;

  const reader = res.body?.getReader();
  if (!reader) return res.json();

  const chunks: Uint8Array[] = [];
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    loaded += value.length;

    if (total > 0) {
      const sourceProgress = Math.min((loaded / total) * 90, 90);
      const overallProgress =
        (sourceIndex / totalSources) * 100 + sourceProgress / totalSources;
      store.setProgress(Math.min(overallProgress, 90));
    }
  }

  const allChunks = new Uint8Array(loaded);
  let position = 0;
  for (const chunk of chunks) {
    allChunks.set(chunk, position);
    position += chunk.length;
  }

  store.setProgress(
    Math.min((sourceIndex / totalSources) * 100 + 95 / totalSources, 95),
  );
  store.addMessage(`Parsing JSON from ${source.name}...`);

  const text = new TextDecoder().decode(allChunks);
  const data = JSON.parse(text);
  store.addMessage(`Parsed ${source.name} successfully`);

  return data;
}

// ============================================================================
// Merge Sources
// ============================================================================

function mergeSourceData(results: (RawSourceData | null)[], enabledSources: DataSource[]): RawSubjectData[] {
  const mergedSubjects: RawSubjectData[] = [];
  const isMultiSource = enabledSources.length > 1;

  results.forEach((data, index) => {
    if (!data?.subjects) return;

    const source = enabledSources[index];

    data.subjects.forEach((s: RawSubjectData) => {
      const code = (s.code || s.id) as string | undefined;
      const name = (s.name || s.title || code) as string;
      if (!code) return;

      mergedSubjects.push({
        ...s,
        code: isMultiSource ? `${source.id.slice(0, 4)}_${code}` : code,
        name,
        id: s.id || code,
        primaryColor: s.primaryColor || "#3b82f6",
        secondaryColor: s.secondaryColor || "#1d4ed8",
        originalCode: code,
        sourceName: source.name,
        repositoryUrl: data.metadata?.repository || data.repository || null,
      });
    });
  });

  return mergedSubjects;
}
