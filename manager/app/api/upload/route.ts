import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get('file') as File;
        const subjectCode = formData.get('subjectCode') as string;
        const questionId = formData.get('questionId') as string;
        const folderPath = formData.get('folderPath') as string;
        const imageType = formData.get('imageType') as string; // 'image' or 'quizImage'

        if (!file || !subjectCode || !questionId || !folderPath) {
            return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
        }

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        const questionDir = path.join(folderPath, subjectCode, 'questions', questionId);
        await fs.mkdir(questionDir, { recursive: true });

        // Use imageType to determine filename, default to image.png
        const filename = imageType === 'quizImage' ? 'quizImage.png' : 'image.png';
        const filePath = path.join(questionDir, filename);
        await fs.writeFile(filePath, buffer);

        return NextResponse.json({ success: true, filename });
    } catch (error: any) {
        console.error('Upload error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
