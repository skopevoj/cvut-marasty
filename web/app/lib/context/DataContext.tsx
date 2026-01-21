"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
} from "react";
import { Subject } from "../types/subject";
import { Question } from "../types/question";
import { SubjectDetails } from "../types/subjectDetails";
import { useSettings } from "../context/SettingsContext";
import { storageHelper } from "@/app/lib/helper/storageHelper";

interface DataContextType {
  subjects: Subject[];
  questions: Question[];
  currentSubject: Subject | null;
  currentSubjectDetails: SubjectDetails | null;
  isLoading: boolean;
  loadingProgress: number;
  loadingMessages: string[];
  error: string | null;
  selectSubject: (code: string | null) => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: ReactNode }) {
  const { settings } = useSettings();
  const [allData, setAllData] = useState<any>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentSubject, setCurrentSubject] = useState<Subject | null>(null);
  const [currentSubjectDetails, setCurrentSubjectDetails] =
    useState<SubjectDetails | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingMessages, setLoadingMessages] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  const addLoadingMessage = useCallback((message: string) => {
    setLoadingMessages((prev) => [...prev, message].slice(-10));
  }, []);

  const loadFromCache = useCallback(
    async (sources: typeof settings.dataSources) => {
      addLoadingMessage("Loading from cache...");
      const results = await Promise.all(
        sources.map(async (source) => {
          try {
            const cached = await storageHelper.getData(source.id);
            if (cached) {
              addLoadingMessage(`Loaded ${source.name} from cache`);
              return cached;
            }
          } catch (e) {
            console.warn(`No cache for ${source.name}`);
          }
          return null;
        }),
      );
      return results;
    },
    [addLoadingMessage],
  );

  useEffect(() => {
    async function fetchAllData() {
      const enabledSources = settings.dataSources.filter((s) => s.enabled);
      if (enabledSources.length === 0) {
        setSubjects([]);
        setAllData(null);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setLoadingProgress(0);
      setLoadingMessages([]);

      addLoadingMessage("Getting sources...");
      addLoadingMessage(
        `${enabledSources.length} source${enabledSources.length > 1 ? "s" : ""} found`,
      );

      try {
        let results;

        // If checkUpdatesOnStartup is disabled, load from cache only
        if (!settings.checkUpdatesOnStartup) {
          addLoadingMessage("Update check disabled, using cached data...");
          results = await loadFromCache(enabledSources);
        } else {
          let completedSources = 0;
          results = await Promise.all(
            enabledSources.map(async (source, sourceIndex) => {
              try {
                if (source.type === "url" && source.url) {
                  addLoadingMessage(
                    `Fetching source ${sourceIndex + 1}: ${source.name}...`,
                  );
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
                        setNotification(
                          `Nepodařilo se aktualizovat ${source.name}. Používám hachovanou verzi.`,
                        );
                        setTimeout(() => setNotification(null), 5000);
                        return cached;
                      }
                      throw new Error(`Server returned ${res.status}`);
                    }

                    // Track download progress
                    const contentLength = res.headers.get("content-length");
                    const total = contentLength
                      ? parseInt(contentLength, 10)
                      : 0;
                    let loaded = 0;

                    const reader = res.body?.getReader();
                    const chunks: Uint8Array[] = [];
                    let data;

                    if (reader) {
                      while (true) {
                        const { done, value } = await reader.read();
                        if (done) break;
                        chunks.push(value);
                        loaded += value.length;

                        // Only show progress if we have accurate content-length
                        if (total > 0) {
                          const sourceIndex = enabledSources.indexOf(source);
                          // Cap download progress at 90% to leave room for parsing
                          const sourceProgress = Math.min(
                            (loaded / total) * 90,
                            90,
                          );
                          const overallProgress =
                            (sourceIndex / enabledSources.length) * 100 +
                            sourceProgress / enabledSources.length;
                          setLoadingProgress(Math.min(overallProgress, 90));
                        }
                      }

                      // Combine chunks and parse - now we know the actual size
                      const allChunks = new Uint8Array(loaded);
                      let position = 0;
                      for (const chunk of chunks) {
                        allChunks.set(chunk, position);
                        position += chunk.length;
                      }

                      // Show parsing progress
                      const sourceIndex = enabledSources.indexOf(source);
                      const parsingProgress =
                        (sourceIndex / enabledSources.length) * 100 +
                        95 / enabledSources.length;
                      setLoadingProgress(Math.min(parsingProgress, 95));

                      addLoadingMessage(`Parsing JSON from ${source.name}...`);
                      const text = new TextDecoder().decode(allChunks);
                      data = JSON.parse(text);
                      addLoadingMessage(`Parsed ${source.name} successfully`);
                    } else {
                      // Fallback if streaming not available
                      data = await res.json();
                    }

                    // Safety check: Ensure the data actually contains subjects
                    if (
                      !data ||
                      (!data.subjects && !Array.isArray(data.subjects))
                    ) {
                      console.error(
                        `Invalid JSON structure from ${source.name}:`,
                        data,
                      );
                      return cached;
                    }

                    const currentHash =
                      data.metadata?.hash ||
                      data.version ||
                      JSON.stringify(data).length.toString();
                    const storedHash = localStorage.getItem(
                      `hash_${source.id}`,
                    );

                    // If we have a stored hash and it differs from the current one, it's an update
                    if (
                      storedHash &&
                      currentHash &&
                      storedHash !== currentHash
                    ) {
                      setNotification(
                        `Otázky u zdroje ${source.name} byly aktualizovány.`,
                      );
                      setTimeout(() => setNotification(null), 5000);
                    }

                    // Save to local storage for persistence and offline support (silent fail)
                    storageHelper.saveData(source.id, data).catch(console.warn);

                    if (currentHash) {
                      localStorage.setItem(`hash_${source.id}`, currentHash);
                    }

                    return data;
                  } catch (fetchErr) {
                    if (cached) {
                      setNotification(
                        `Zdroj ${source.name} není dostupný. Používám cache verzi.`,
                      );
                      setTimeout(() => setNotification(null), 5000);
                      return cached;
                    }
                    throw fetchErr;
                  }
                } else if (source.type === "local") {
                  const data = await storageHelper.getData(source.id);
                  if (!data)
                    throw new Error(`No local data found for ${source.name}`);
                  return data;
                }
              } catch (e) {
                console.error(`Error loading source ${source.name}:`, e);
                return null;
              } finally {
                completedSources++;
                setLoadingProgress(
                  (completedSources / enabledSources.length) * 100,
                );
              }
            }),
          );
        }

        addLoadingMessage("Merging data sources...");
        const mergedSubjects: any[] = [];

        // Ensure results is an array
        if (!results || !Array.isArray(results)) {
          throw new Error("Failed to load data from sources");
        }

        results.forEach((data, index) => {
          if (data && data.subjects) {
            const source = enabledSources[index];
            addLoadingMessage(
              `Found ${data.subjects.length} subject${data.subjects.length > 1 ? "s" : ""} in ${source.name}`,
            );

            data.subjects.forEach((s: any, subjectIndex: number) => {
              // Add message for each subject
              const subjectName = s.name || s.title || s.code || s.id;
              addLoadingMessage(`Processing subject: ${subjectName}`);

              // Count questions
              const questionCount = s.questions?.length || 0;
              if (questionCount > 0) {
                addLoadingMessage(
                  `  → ${questionCount} question${questionCount > 1 ? "s" : ""} found`,
                );
              }
              // Map synonyms so the app is more lenient
              const code = s.code || s.id;
              const name = s.name || s.title || code;

              if (!code) return; // Skip only if absolutely no identifier found

              const isMultiSource = enabledSources.length > 1;
              mergedSubjects.push({
                ...s,
                code: isMultiSource ? `${source.id.slice(0, 4)}_${code}` : code,
                name: name,
                id: s.id || code,
                // Provide default colors if missing
                primaryColor: s.primaryColor || "#3b82f6",
                secondaryColor: s.secondaryColor || "#1d4ed8",
                originalCode: code,
                sourceName: source.name,
                repositoryUrl:
                  data.metadata?.repository || data.repository || null,
              });
            });
          }
        });

        if (mergedSubjects.length > 0) {
          addLoadingMessage(
            `✓ Successfully loaded ${mergedSubjects.length} subject${mergedSubjects.length > 1 ? "s" : ""}`,
          );
          setAllData({ subjects: mergedSubjects });
          setSubjects(
            mergedSubjects.map((s: any) => ({
              id: s.id,
              name: s.name,
              code: s.code,
              description: s.description || "",
              primaryColor: s.primaryColor,
              secondaryColor: s.secondaryColor,
            })),
          );
          setError(null);
        } else {
          setSubjects([]);
          setAllData(null);
          if (enabledSources.length > 0) {
            setError("No valid data found in enabled sources");
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch data");
      } finally {
        setIsLoading(false);
      }
    }
    fetchAllData();
  }, [settings.dataSources]);

  const selectSubject = useCallback(
    async (code: string | null) => {
      if (!code || !allData) {
        setCurrentSubject(null);
        setCurrentSubjectDetails(null);
        setQuestions([]);
        return;
      }

      const subData = allData.subjects.find((s: any) => s.code === code);
      if (!subData) return;

      setCurrentSubject({
        id: subData.id,
        name: subData.name,
        code: subData.code,
        description: subData.description,
        repositoryUrl: subData.repositoryUrl,
      });

      const { questions: subjectQs, ...details } = subData;

      // Ensure questions have the subjectCode and ID for internal logic
      const normalizedQuestions = (subjectQs || []).map((q: any) => ({
        ...q,
        subjectCode: q.subjectCode || subData.code,
        id: String(q.id),
        answers: (q.answers || []).map((a: any, i: number) => ({
          ...a,
          index: a.index ?? i,
        })),
      }));

      setCurrentSubjectDetails(details);
      setQuestions(normalizedQuestions);
    },
    [allData],
  );

  useEffect(() => {
    if (currentSubjectDetails) {
      document.documentElement.style.setProperty(
        "--subject-primary",
        currentSubjectDetails.primaryColor,
      );
      document.documentElement.style.setProperty(
        "--subject-secondary",
        currentSubjectDetails.secondaryColor,
      );
    }
  }, [currentSubjectDetails]);

  return (
    <DataContext.Provider
      value={{
        subjects,
        questions,
        currentSubject,
        currentSubjectDetails,
        isLoading,
        loadingProgress,
        loadingMessages,
        error,
        selectSubject,
      }}
    >
      {notification && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] animate-in fade-in slide-in-from-top-4 pointer-events-none">
          <div className="bg-primary/90 backdrop-blur-md px-6 py-3 rounded-2xl shadow-2xl text-white text-sm font-bold flex items-center gap-3 border border-white/20">
            <div className="h-2 w-2 rounded-full bg-white animate-pulse" />
            {notification}
          </div>
        </div>
      )}
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (context === undefined)
    throw new Error("useData must be used within a DataProvider");
  return context;
}
