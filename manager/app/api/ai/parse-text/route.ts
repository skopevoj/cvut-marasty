import { NextRequest, NextResponse } from 'next/server';
import { parseQuestionsFromText } from '@/app/lib/gemini';

export async function POST(req: NextRequest) {
    try {
        const { text, availableTopics } = await req.json();

        if (!text || !availableTopics) {
            return NextResponse.json(
                { error: 'Missing text or availableTopics' },
                { status: 400 }
            );
        }

        const parsed = await parseQuestionsFromText(text, availableTopics);

        return NextResponse.json({ questions: parsed });
    } catch (error: any) {
        console.error('AI text parsing error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to parse questions from text' },
            { status: 500 }
        );
    }
}
