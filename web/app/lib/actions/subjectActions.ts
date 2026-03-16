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
    id: Number(subData.id),
    name: subData.name as string,
    code: subData.code as string,
    description: (subData.description as string) || "",
    repositoryUrl: subData.repositoryUrl as string | undefined,
  });

  // Extract and set details
  const { questions: subjectQs, ...details } = subData;
  dataStore.setCurrentSubjectDetails(details as unknown as import("../types").SubjectDetails);

  // Normalize questions
  const subjectCode = subData.code as string;
  const normalizedQuestions: Question[] = ((subjectQs as unknown[]) || []).map((q) => {
    const raw = q as Record<string, unknown>;
    return {
      ...raw,
      subjectCode: (raw.subjectCode as string) || subjectCode,
      id: String(raw.id),
      answers: ((raw.answers as unknown[]) || []).map((a, i) => {
        const ans = a as Record<string, unknown>;
        return { ...ans, index: ans.index ?? i };
      }),
    } as Question;
  });

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
