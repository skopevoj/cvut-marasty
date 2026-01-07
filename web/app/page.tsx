'use client';

import { useQuiz } from "./lib/QuizContext";

export default function Home() {
  const { subjects, isLoading, error } = useQuiz();

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Subjects</h1>
      <ul className="list-disc pl-5">
        {subjects.map((subject) => (
          <li key={subject.id}>
            <strong>{subject.code}</strong>: {subject.name} - {subject.description}
          </li>
        ))}
      </ul>
    </div>
  );
}

