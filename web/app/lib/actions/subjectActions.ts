import type { Subject, Question } from "../types";
import { useDataStore } from "../stores/dataStore";
import { useQuizStore } from "../stores/quizStore";
import { useFilterStore } from "../stores/filterStore";

// ============================================================================
// Subject Selection
// ============================================================================

export function selectSubject(code: string | null) {
  const dataStore = useDataStore.getState();
  const quizStore = useQuizStore.getState();
  const filterStore = useFilterStore.getState();

  if (!code || !dataStore.allData) {
    dataStore.setCurrentSubject(null);
    dataStore.setCurrentSubjectDetails(null);
    dataStore.setQuestions([]);
    return;
  }

  const subData = dataStore.allData.subjects.find((s) => s.code === code);
  if (!subData) return;

  // Set current subject
  dataStore.setCurrentSubject({
    id: subData.id,
    name: subData.name,
    code: subData.code,
    description: subData.description,
    repositoryUrl: subData.repositoryUrl,
  });

  // Extract and set details
  const { questions: subjectQs, ...details } = subData;
  dataStore.setCurrentSubjectDetails(details);

  // Normalize questions
  const normalizedQuestions: Question[] = (subjectQs || []).map((q: any) => ({
    ...q,
    subjectCode: q.subjectCode || subData.code,
    id: String(q.id),
    answers: (q.answers || []).map((a: any, i: number) => ({
      ...a,
      index: a.index ?? i,
    })),
  }));

  dataStore.setQuestions(normalizedQuestions);

  // Reset filters and quiz session
  filterStore.reset();
  quizStore.setCurrentIndex(0);
  quizStore.resetSession();

  // Apply subject colors to CSS
  applySubjectColors(details);
}

export function applySubjectColors(details: any) {
  if (details && typeof document !== "undefined") {
    document.documentElement.style.setProperty(
      "--subject-primary",
      details.primaryColor || "#3b82f6",
    );
    document.documentElement.style.setProperty(
      "--subject-secondary",
      details.secondaryColor || "#1d4ed8",
    );
  }
}
