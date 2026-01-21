import { NextRequest, NextResponse } from 'next/server';
import { parseQuestionFromImage } from '@/app/lib/gemini';

export async function POST(req: NextRequest) {
    try {
        const { imageData, availableTopics, additionalPrompt } = await req.json();

        if (!imageData || !availableTopics) {
            return NextResponse.json(
                { error: 'Missing imageData or availableTopics' },
                { status: 400 }
            );
        }

        const parsed = await parseQuestionFromImage(imageData, availableTopics, additionalPrompt || '');

        return NextResponse.json(parsed);
    } catch (error: any) {
        console.error('AI parsing error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to parse question' },
            { status: 500 }
        );
    }
}
