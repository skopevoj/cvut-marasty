import { GoogleGenAI, ThinkingLevel, Type } from "@google/genai";

export interface ParsedQuestion {
  questionType: "multichoice" | "open" | "yesno";
  question: string;
  topics: string[];
  answers?: Array<{
    text: string;
    isCorrect: boolean;
  }>;
  originalText?: string;
}

export async function parseQuestionsFromText(
  text: string,
  availableTopics: Array<{ id: string; name: string }>,
): Promise<ParsedQuestion[]> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY not found in environment variables");
  }

  const genAI = new GoogleGenAI({ apiKey });

  const topicsList = availableTopics
    .map((t) => `${t.id}: ${t.name}`)
    .join("\n");

  const prompt = `You are an expert at parsing exam questions from raw text. The user will paste text that contains one or more exam questions. The text format can vary wildly — questions might be numbered, bulleted, separated by blank lines, or formatted in any other way. Your job is to intelligently identify and separate individual questions from the text.

Available topics/categories to choose from:
${topicsList}

Your task:
1. Identify all individual questions in the text. Questions may have sections like "PLATÍ" (correct/true statements) and "NEPLATÍ" (incorrect/false statements), or they may have answer options labeled A/B/C/D, or any other format.
2. For each question, determine if it's "multichoice" (multiple choice with several options), "yesno" (yes/no or true/false), or "open" (open-ended).
3. Extract the question text, preserving any mathematical notation in LaTeX format (use $ for inline math, $$ for display math).
4. Select the most relevant topics from the list above (use topic IDs).
5. Extract all answer options and determine which are correct:
   - If the question has "PLATÍ" (true/valid) and "NEPLATÍ" (false/invalid) sections, treat PLATÍ items as correct answers (isCorrect: true) and NEPLATÍ items as incorrect answers (isCorrect: false). The question type should be "multichoice".
   - If it's a standard multiple choice (A/B/C/D), mark the correct ones.
   - If it's yes/no, use [{"text": "Ano", "isCorrect": true/false}, {"text": "Ne", "isCorrect": true/false}].
   - If it's open, use [{"text": "expected answer", "isCorrect": true}].
6. Store the original text segment for reference.

IMPORTANT: Return a JSON array of question objects. Each object must have this structure:
{
    "questionType": "multichoice" | "yesno" | "open",
    "question": "Question text with LaTeX preserved",
    "topics": ["topic-id-1"],
    "answers": [{"text": "Answer text", "isCorrect": true/false}],
    "originalText": "Original text segment from input"
}

Be smart about detecting question boundaries. The format can vary — numbered lists, blank line separators, headers, etc. Extract ALL questions you can find.

Here is the text to parse:
${text}`;

  const result = await genAI.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: [{ text: prompt }],
    config: {
      thinkingConfig: {
        thinkingLevel: ThinkingLevel.LOW,
      },
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            questionType: {
              type: Type.STRING,
              description: 'Either "multichoice", "yesno", or "open"',
            },
            question: {
              type: Type.STRING,
              description: "The question text with LaTeX notation preserved",
            },
            topics: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Array of topic IDs",
            },
            answers: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  text: { type: Type.STRING },
                  isCorrect: { type: Type.BOOLEAN },
                },
                propertyOrdering: ["text", "isCorrect"],
              },
              description:
                "Array of answer objects with text and isCorrect fields",
            },
            originalText: {
              type: Type.STRING,
              description: "Original text segment from input",
            },
          },
          propertyOrdering: [
            "questionType",
            "question",
            "topics",
            "answers",
            "originalText",
          ],
        },
      },
    },
  });

  const responseText = result.text;

  if (!responseText) {
    throw new Error("No response from Gemini API");
  }

  try {
    const parsed = JSON.parse(responseText);
    return parsed;
  } catch (parseError) {
    console.error("Failed to parse JSON:", responseText);
    throw new Error(
      `AI returned invalid JSON: ${parseError instanceof Error ? parseError.message : "Unknown error"}`,
    );
  }
}

export async function parseQuestionFromImage(
  imageData: string, // base64 encoded image
  availableTopics: Array<{ id: string; name: string }>,
  additionalPrompt: string = "",
): Promise<ParsedQuestion> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY not found in environment variables");
  }

  const genAI = new GoogleGenAI({ apiKey });

  const topicsList = availableTopics
    .map((t) => `${t.id}: ${t.name}`)
    .join("\n");

  const additionalInstructions = additionalPrompt
    ? `\n\nAdditional Instructions:\n${additionalPrompt}`
    : "";

  const prompt = `You are an expert at parsing exam questions from images. Analyze this question image and extract all information.

Available topics/categories to choose from:
${topicsList}${additionalInstructions}

Your task:
1. Determine if this is a "multichoice" (multiple choice with several options), "yesno" (yes/no or true/false question with exactly two possible answers), or "open" (open-ended question requiring a free-text answer)
2. Extract the question text, preserving any mathematical notation in LaTeX format (use $ for inline math, $$ for display math)
3. Select the most relevant topics from the list above (use topic IDs, can be multiple)
4. If it's a multichoice question, extract all answer options and mark which are correct
5. If it's a yesno question, set answers to exactly two entries: {"text": "Ano", "isCorrect": true/false} and {"text": "Ne", "isCorrect": true/false} based on the correct answer
6. If it's an open question, extract the expected/correct answer from the image and set answers to a single entry: {"text": "the correct answer", "isCorrect": true}
7. Extract the original text as-is for reference

IMPORTANT: Return ONLY valid JSON. Do not include any markdown formatting or code blocks. Do not wrap the JSON in backticks.

Return a JSON object with this exact structure:
{
    "questionType": "multichoice", "yesno", or "open",
    "question": "Question text with LaTeX notation preserved",
    "topics": ["topic-id-1", "topic-id-2"],
    "answers": [
        {"text": "Answer A", "isCorrect": true},
        {"text": "Answer B", "isCorrect": false}
    ],
    "originalText": "Original unprocessed text from image"
}

For open questions, set answers to a single entry with the correct/expected answer from the image: [{"text": "expected answer text", "isCorrect": true}].
For yesno questions, always use exactly: [{"text": "Ano", "isCorrect": true/false}, {"text": "Ne", "isCorrect": true/false}]
Ensure all mathematical expressions use proper LaTeX syntax.
Make sure all strings are properly escaped for JSON (use \\\\ for backslash in LaTeX).`;

  const imagePart = {
    inlineData: {
      data: imageData.split(",")[1], // Remove data:image/png;base64, prefix
      mimeType: "image/png",
    },
  };

  const result = await genAI.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: [{ text: prompt }, imagePart],
    config: {
      thinkingConfig: {
        thinkingLevel: ThinkingLevel.LOW, // Fast responses for simple extraction tasks
      },
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          questionType: {
            type: Type.STRING,
            description: 'Either "multichoice", "yesno", or "open"',
          },
          question: {
            type: Type.STRING,
            description: "The question text with LaTeX notation preserved",
          },
          topics: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "Array of topic IDs",
          },
          answers: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                text: { type: Type.STRING },
                isCorrect: { type: Type.BOOLEAN },
              },
              propertyOrdering: ["text", "isCorrect"],
            },
            description:
              "Array of answer objects with text and isCorrect fields",
          },
          originalText: {
            type: Type.STRING,
            description: "Original text from the image",
          },
        },
        propertyOrdering: [
          "questionType",
          "question",
          "topics",
          "answers",
          "originalText",
        ],
      },
    },
  });

  const text = result.text;

  if (!text) {
    throw new Error("No response from Gemini API");
  }

  // With structured outputs, the response is guaranteed to be valid JSON
  try {
    const parsed = JSON.parse(text);
    return parsed;
  } catch (parseError) {
    console.error("Failed to parse JSON:", text);
    throw new Error(
      `AI returned invalid JSON: ${parseError instanceof Error ? parseError.message : "Unknown error"}`,
    );
  }
}
