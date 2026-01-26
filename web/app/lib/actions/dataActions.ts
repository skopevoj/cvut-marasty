import type { DataSource, Subject, Question } from "../types";
import { useDataStore } from "../stores/dataStore";
import { useSettingsStore } from "../stores/settingsStore";
import { storageHelper } from "../helper/storageHelper";

// ============================================================================
// Data Loading Actions
// ============================================================================

let notificationTimeout: NodeJS.Timeout | null = null;

function showNotification(message: string) {
  // This could be enhanced to use a toast library
  console.log("[Notification]", message);
}

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

  store.startLoading();
  store.addMessage("Getting sources...");
  store.addMessage(`${enabledSources.length} source(s) found`);

  try {
    let results: any[];

    if (!checkUpdatesOnStartup) {
      store.addMessage("Update check disabled, using cached data...");
      results = await loadFromCache(enabledSources);
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

    store.addMessage("Merging data sources...");
    const mergedSubjects = mergeSourceData(results, enabledSources);

    if (mergedSubjects.length > 0) {
      store.addMessage(
        `✓ Successfully loaded ${mergedSubjects.length} subject(s)`,
      );
      store.setAllData({ subjects: mergedSubjects });
      store.setSubjects(
        mergedSubjects.map((s) => ({
          id: s.id,
          name: s.name,
          code: s.code,
          description: s.description || "",
          repositoryUrl: s.repositoryUrl,
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
  } catch (err) {
    store.setError(err instanceof Error ? err.message : "Failed to fetch data");
  } finally {
    store.finishLoading();
  }
}

async function loadFromCache(sources: DataSource[]): Promise<any[]> {
  const store = useDataStore.getState();
  store.addMessage("Loading from cache...");

  return Promise.all(
    sources.map(async (source) => {
      try {
        const cached = await storageHelper.getData(source.id);
        if (cached) {
          store.addMessage(`Loaded ${source.name} from cache`);
          return cached;
        }
      } catch (e) {
        console.warn(`No cache for ${source.name}`);
      }
      return null;
    }),
  );
}

async function fetchSource(
  source: DataSource,
  sourceIndex: number,
  totalSources: number,
): Promise<any> {
  const store = useDataStore.getState();

  if (source.type !== "url" || !source.url) {
    const data = await storageHelper.getData(source.id);
    if (!data) throw new Error(`No local data found for ${source.name}`);
    return data;
  }

  store.addMessage(`Fetching source ${sourceIndex + 1}: ${source.name}...`);

  let cached = null;
  try {
    cached = await storageHelper.getData(source.id);
  } catch (e) {
    console.warn(`Could not load cache for ${source.name}`, e);
  }

  try {
    const res = await fetch(`${source.url}?t=${Date.now()}`);
    if (!res.ok) {
      if (cached) {
        showNotification(
          `Nepodařilo se aktualizovat ${source.name}. Používám cachovanou verzi.`,
        );
        return cached;
      }
      throw new Error(`Server returned ${res.status}`);
    }

    const data = await parseResponseWithProgress(
      res,
      source,
      sourceIndex,
      totalSources,
    );

    if (!data || !data.subjects) {
      console.error(`Invalid JSON structure from ${source.name}:`, data);
      return cached;
    }

    const currentHash =
      data.metadata?.hash ||
      data.version ||
      JSON.stringify(data).length.toString();
    const storedHash = localStorage.getItem(`hash_${source.id}`);
    if (storedHash && currentHash !== storedHash) {
      showNotification(`Otázky u zdroje ${source.name} byly aktualizovány.`);
    }

    storageHelper.saveData(source.id, data).catch(console.warn);
    if (currentHash) localStorage.setItem(`hash_${source.id}`, currentHash);

    return data;
  } catch (fetchErr) {
    if (cached) {
      showNotification(
        `Zdroj ${source.name} není dostupný. Používám cache verzi.`,
      );
      return cached;
    }
    throw fetchErr;
  }
}

async function parseResponseWithProgress(
  res: Response,
  source: DataSource,
  sourceIndex: number,
  totalSources: number,
): Promise<any> {
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

function mergeSourceData(results: any[], enabledSources: DataSource[]): any[] {
  const store = useDataStore.getState();
  const mergedSubjects: any[] = [];
  const isMultiSource = enabledSources.length > 1;

  results.forEach((data, index) => {
    if (!data?.subjects) return;

    const source = enabledSources[index];
    store.addMessage(
      `Found ${data.subjects.length} subject(s) in ${source.name}`,
    );

    data.subjects.forEach((s: any) => {
      const code = s.code || s.id;
      const name = s.name || s.title || code;
      if (!code) return;

      store.addMessage(`Processing subject: ${name}`);
      const questionCount = s.questions?.length || 0;
      if (questionCount > 0) {
        store.addMessage(`  → ${questionCount} question(s) found`);
      }

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
