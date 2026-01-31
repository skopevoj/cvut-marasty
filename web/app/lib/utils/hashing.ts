export function getAnswerHash(text: string): string {
  let hash = 0;
  const str = text || "";
  for (let j = 0; j < str.length; j++) {
    hash = (hash << 5) - hash + str.charCodeAt(j);
    hash |= 0;
  }
  return Math.abs(hash).toString(16).padStart(8, "0");
}

export function getQuestionHash(
  text: string,
  subjectId: string | undefined,
): string {
  let hash = 0;
  const str = (text || "") + (subjectId || "");
  for (let j = 0; j < str.length; j++) {
    hash = (hash << 5) - hash + str.charCodeAt(j);
    hash |= 0;
  }
  return Math.abs(hash).toString(16).padStart(8, "0");
}
