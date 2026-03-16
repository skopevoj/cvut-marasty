function djb2Hash(str: string): string {
  let hash = 0;
  for (let j = 0; j < str.length; j++) {
    hash = (hash << 5) - hash + str.charCodeAt(j);
    hash |= 0;
  }
  return Math.abs(hash).toString(16).padStart(8, "0");
}

export function getAnswerHash(text: string, questionId?: string): string {
  return djb2Hash((text || "") + (questionId || ""));
}

export function getQuestionHash(text: string, subjectId?: string): string {
  return djb2Hash((text || "") + (subjectId || ""));
}
