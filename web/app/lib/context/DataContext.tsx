'use client';

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { Subject } from '../types/subject';
import { Question } from '../types/question';
import { SubjectDetails } from '../types/subjectDetails';
import { useSettings } from '../context/SettingsContext';
import { storageHelper } from '@/app/lib/helper/storageHelper';

interface DataContextType {
    subjects: Subject[];
    questions: Question[];
    currentSubject: Subject | null;
    currentSubjectDetails: SubjectDetails | null;
    isLoading: boolean;
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
    const [currentSubjectDetails, setCurrentSubjectDetails] = useState<SubjectDetails | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [notification, setNotification] = useState<string | null>(null);

    useEffect(() => {
        async function fetchAllData() {
            const enabledSources = settings.dataSources.filter(s => s.enabled);
            if (enabledSources.length === 0) {
                setSubjects([]);
                setAllData(null);
                setIsLoading(false);
                return;
            }

            setIsLoading(true);
            try {
                const results = await Promise.all(enabledSources.map(async (source) => {
                    try {
                        if (source.type === 'url' && source.url) {
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
                                        setNotification(`Nepodařilo se aktualizovat ${source.name}. Používám hachovanou verzi.`);
                                        setTimeout(() => setNotification(null), 5000);
                                        return cached;
                                    }
                                    throw new Error(`Server returned ${res.status}`);
                                }

                                const data = await res.json();

                                // Safety check: Ensure the data actually contains subjects
                                if (!data || (!data.subjects && !Array.isArray(data.subjects))) {
                                    console.error(`Invalid JSON structure from ${source.name}:`, data);
                                    return cached;
                                }

                                const currentHash = data.metadata?.hash || data.version || JSON.stringify(data).length.toString();
                                const storedHash = localStorage.getItem(`hash_${source.id}`);

                                // If we have a stored hash and it differs from the current one, it's an update
                                if (storedHash && currentHash && storedHash !== currentHash) {
                                    setNotification(`Otázky u zdroje ${source.name} byly aktualizovány.`);
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
                                    setNotification(`Zdroj ${source.name} není dostupný. Používám cache verzi.`);
                                    setTimeout(() => setNotification(null), 5000);
                                    return cached;
                                }
                                throw fetchErr;
                            }
                        } else if (source.type === 'local') {
                            const data = await storageHelper.getData(source.id);
                            if (!data) throw new Error(`No local data found for ${source.name}`);
                            return data;
                        }
                    } catch (e) {
                        console.error(`Error loading source ${source.name}:`, e);
                        return null;
                    }
                }));

                const mergedSubjects: any[] = [];
                results.forEach((data, index) => {
                    if (data && data.subjects) {
                        const source = enabledSources[index];
                        data.subjects.forEach((s: any) => {
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
                                primaryColor: s.primaryColor || '#3b82f6',
                                secondaryColor: s.secondaryColor || '#1d4ed8',
                                originalCode: code,
                                sourceName: source.name
                            });
                        });
                    }
                });

                if (mergedSubjects.length > 0) {
                    setAllData({ subjects: mergedSubjects });
                    setSubjects(mergedSubjects.map((s: any) => ({
                        id: s.id,
                        name: s.name,
                        code: s.code,
                        description: s.description || '',
                        primaryColor: s.primaryColor,
                        secondaryColor: s.secondaryColor
                    })));
                    setError(null);
                } else {
                    setSubjects([]);
                    setAllData(null);
                    if (enabledSources.length > 0) {
                        setError('No valid data found in enabled sources');
                    }
                }
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to fetch data');
            } finally {
                setIsLoading(false);
            }
        }
        fetchAllData();
    }, [settings.dataSources]);

    const selectSubject = useCallback(async (code: string | null) => {
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
            primaryColor: subData.primaryColor,
            secondaryColor: subData.secondaryColor
        });

        const { questions: subjectQs, ...details } = subData;

        // Ensure questions have the subjectCode and ID for internal logic
        const normalizedQuestions = (subjectQs || []).map((q: any) => ({
            ...q,
            subjectCode: q.subjectCode || subData.code,
            id: String(q.id)
        }));

        setCurrentSubjectDetails(details);
        setQuestions(normalizedQuestions);
    }, [allData]);

    useEffect(() => {
        if (currentSubjectDetails) {
            document.documentElement.style.setProperty('--subject-primary', currentSubjectDetails.primaryColor);
            document.documentElement.style.setProperty('--subject-secondary', currentSubjectDetails.secondaryColor);
        }
    }, [currentSubjectDetails]);

    return (
        <DataContext.Provider value={{
            subjects, questions, currentSubject, currentSubjectDetails,
            isLoading, error, selectSubject
        }}>
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
    if (context === undefined) throw new Error('useData must be used within a DataProvider');
    return context;
}
