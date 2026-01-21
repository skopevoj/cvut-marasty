import { GoogleGenAI, ThinkingLevel, Type } from '@google/genai';

export interface ParsedQuestion {
    questionType: 'multichoice' | 'open';
    question: string;
    topics: string[];
    answers?: Array<{
        text: string;
        isCorrect: boolean;
    }>;
    originalText?: string;
}

export async function parseQuestionFromImage(
    imageData: string, // base64 encoded image
    availableTopics: Array<{ id: string; name: string }>,
    additionalPrompt: string = ''
): Promise<ParsedQuestion> {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        throw new Error('GEMINI_API_KEY not found in environment variables');
    }

    const genAI = new GoogleGenAI({ apiKey });

    const topicsList = availableTopics.map(t => `${t.id}: ${t.name}`).join('\n');

    const additionalInstructions = additionalPrompt ? `\n\nAdditional Instructions:\n${additionalPrompt}` : '';

    const prompt = `You are an expert at parsing exam questions from images. Analyze this question image and extract all information.

Available topics/categories to choose from:
${topicsList}${additionalInstructions}

Your task:
1. Determine if this is a "multichoice" (multiple choice or true/false) or "open" (open-ended) question
2. Extract the question text, preserving any mathematical notation in LaTeX format (use $ for inline math, $$ for display math)
3. Select the most relevant topics from the list above (use topic IDs, can be multiple)
4. If it's a multiple choice question, extract all answer options and mark which are correct
5. Extract the original text as-is for reference

IMPORTANT: Return ONLY valid JSON. Do not include any markdown formatting or code blocks. Do not wrap the JSON in backticks.

Return a JSON object with this exact structure:
{
    "questionType": "multichoice" or "open",
    "question": "Question text with LaTeX notation preserved",
    "topics": ["topic-id-1", "topic-id-2"],
    "answers": [
        {"text": "Answer A", "isCorrect": true},
        {"text": "Answer B", "isCorrect": false}
    ],
    "originalText": "Original unprocessed text from image"
}

For open questions, set answers to an empty array.
Ensure all mathematical expressions use proper LaTeX syntax.
Make sure all strings are properly escaped for JSON (use \\\\ for backslash in LaTeX).`;

    const imagePart = {
        inlineData: {
            data: imageData.split(',')[1], // Remove data:image/png;base64, prefix
            mimeType: 'image/png',
        },
    };

    const result = await genAI.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: [
            { text: prompt },
            imagePart,
        ],
        config: {
            thinkingConfig: {
                thinkingLevel: ThinkingLevel.LOW, // Fast responses for simple extraction tasks
            },
            responseMimeType: 'application/json',
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    questionType: {
                        type: Type.STRING,
                        description: 'Either "multichoice" or "open"',
                    },
                    question: {
                        type: Type.STRING,
                        description: 'The question text with LaTeX notation preserved',
                    },
                    topics: {
                        type: Type.ARRAY,
                        items: { type: Type.STRING },
                        description: 'Array of topic IDs',
                    },
                    answers: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                text: { type: Type.STRING },
                                isCorrect: { type: Type.BOOLEAN },
                            },
                            propertyOrdering: ['text', 'isCorrect'],
                        },
                        description: 'Array of answer objects with text and isCorrect fields',
                    },
                    originalText: {
                        type: Type.STRING,
                        description: 'Original text from the image',
                    },
                },
                propertyOrdering: ['questionType', 'question', 'topics', 'answers', 'originalText'],
            },
        },
    });

    const text = result.text;

    if (!text) {
        throw new Error('No response from Gemini API');
    }

    // With structured outputs, the response is guaranteed to be valid JSON
    try {
        const parsed = JSON.parse(text);
        return parsed;
    } catch (parseError) {
        console.error('Failed to parse JSON:', text);
        throw new Error(`AI returned invalid JSON: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`);
    }
}
