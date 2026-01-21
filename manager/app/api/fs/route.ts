import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

/**
 * Compresses an image buffer to reduce size.
 * Quality: 0-100 (100 = best quality, largest size)
 */
async function compressImage(imageBuffer: Buffer, fileName: string, quality: number): Promise<string> {
    try {
        // Try to use sharp if available
        const sharp = await import('sharp').catch(() => null);

        if (sharp) {
            const ext = path.extname(fileName).toLowerCase();
            let compressedBuffer: Buffer;

            // Resize large images and apply compression based on quality
            const sharpInstance = sharp.default(imageBuffer).resize(1920, 1080, {
                fit: 'inside',
                withoutEnlargement: true
            });

            // Apply quality-based compression for different formats
            if (ext === '.png') {
                compressedBuffer = await sharpInstance.png({
                    quality: quality,
                    compressionLevel: Math.floor((100 - quality) / 10) // 0-9 scale
                }).toBuffer();
            } else if (ext === '.webp') {
                compressedBuffer = await sharpInstance.webp({ quality }).toBuffer();
            } else {
                // Convert to JPEG for compression (works for .jpg, .jpeg, and others)
                compressedBuffer = await sharpInstance.jpeg({ quality }).toBuffer();
            }

            return compressedBuffer.toString('base64');
        }
    } catch (error) {
        console.warn('Sharp compression failed, using original image:', error);
    }

    // Fallback: return original image base64
    return imageBuffer.toString('base64');
}

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const action = searchParams.get('action');
        const imagePath = searchParams.get('path');

        if (action === 'readImage' && imagePath) {
            const fileBuffer = await fs.readFile(imagePath);
            return new NextResponse(fileBuffer, {
                headers: {
                    'Content-Type': 'image/png',
                    'Cache-Control': 'public, max-age=3600',
                },
            });
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 404 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const { action, folderPath, data, filePath, imageQuality } = await req.json();

        switch (action) {
            case 'loadSubjects':
                return await loadSubjects(folderPath);
            case 'saveQuestion':
                return await saveQuestion(folderPath, data);
            case 'deleteQuestion':
                return await deleteQuestion(folderPath, data);
            case 'saveSubject':
                return await saveSubject(folderPath, data);
            case 'exportQuestions':
                return await exportQuestions(folderPath, imageQuality || 80);
            case 'deleteFile':
                return await deleteFile(filePath);
            default:
                return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
        }
    } catch (error: any) {
        console.error('Filesystem error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

async function loadSubjects(folderPath: string) {
    try {
        const subjects = [];
        const entries = await fs.readdir(folderPath, { withFileTypes: true });

        for (const entry of entries) {
            if (entry.isDirectory()) {
                const subjectJsonPath = path.join(folderPath, entry.name, 'subject.json');
                try {
                    const subjectData = await fs.readFile(subjectJsonPath, 'utf-8');
                    const subject = JSON.parse(subjectData);

                    // Load questions
                    const questionsDir = path.join(folderPath, entry.name, 'questions');
                    const questions = await loadQuestions(questionsDir);

                    // Load unprocessed images (recursively with folder structure)
                    const unprocessedDir = path.join(folderPath, entry.name, 'unprocessed');
                    let unprocessedImages: string[] = [];
                    try {
                        unprocessedImages = await loadUnprocessedImages(unprocessedDir, '');
                    } catch (err) {
                        // Unprocessed folder doesn't exist, that's fine
                    }

                    subjects.push({
                        ...subject,
                        code: entry.name,
                        questions,
                        unprocessedImages,
                    });
                } catch (err) {
                    console.error(`Error loading subject ${entry.name}:`, err);
                }
            }
        }

        return NextResponse.json({ subjects });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

async function loadQuestions(questionsDir: string) {
    const questions = [];

    try {
        const questionFolders = await fs.readdir(questionsDir, { withFileTypes: true });

        for (const folder of questionFolders) {
            if (folder.isDirectory()) {
                const questionPath = path.join(questionsDir, folder.name, 'question.json');
                try {
                    const questionData = await fs.readFile(questionPath, 'utf-8');
                    const question = JSON.parse(questionData);

                    // Check for images
                    const questionFolder = path.join(questionsDir, folder.name);
                    const files = await fs.readdir(questionFolder);
                    const images = files.filter(f => /\.(png|jpg|jpeg|gif|webp)$/i.test(f));

                    questions.push({
                        ...question,
                        id: folder.name,
                        images,
                    });
                } catch (err) {
                    // Silently skip folders without question.json
                    // Only log non-ENOENT errors
                    if ((err as any).code !== 'ENOENT') {
                        console.error(`Error loading question ${folder.name}:`, err);
                    }
                }
            }
        }
    } catch (error) {
        console.error('Error loading questions:', error);
    }

    return questions;
}

async function loadUnprocessedImages(dir: string, relativePath: string): Promise<string[]> {
    const images: string[] = [];

    try {
        const entries = await fs.readdir(dir, { withFileTypes: true });

        for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);
            const newRelativePath = relativePath ? `${relativePath}/${entry.name}` : entry.name;

            if (entry.isDirectory()) {
                // Recursively load from subdirectories
                const subImages = await loadUnprocessedImages(fullPath, newRelativePath);
                images.push(...subImages);
            } else if (entry.isFile() && /\.(png|jpg|jpeg|gif|webp)$/i.test(entry.name)) {
                // Add image with relative path
                images.push(newRelativePath);
            }
        }
    } catch (error) {
        // Directory doesn't exist or can't be read
    }

    return images;
}

async function saveQuestion(folderPath: string, data: any) {
    const { subjectCode, questionId, questionData } = data;
    const questionDir = path.join(folderPath, subjectCode, 'questions', questionId);

    await fs.mkdir(questionDir, { recursive: true });

    const questionPath = path.join(questionDir, 'question.json');
    await fs.writeFile(questionPath, JSON.stringify(questionData, null, 4));

    return NextResponse.json({ success: true });
}

async function deleteQuestion(folderPath: string, data: any) {
    const { subjectCode, questionId } = data;
    const questionDir = path.join(folderPath, subjectCode, 'questions', questionId);

    await fs.rm(questionDir, { recursive: true, force: true });

    return NextResponse.json({ success: true });
}

async function saveSubject(folderPath: string, data: any) {
    const { subjectCode, subjectData, originalTopics } = data;
    const subjectDir = path.join(folderPath, subjectCode);

    await fs.mkdir(subjectDir, { recursive: true });
    await fs.mkdir(path.join(subjectDir, 'questions'), { recursive: true });

    // If originalTopics provided, check for topic ID changes and update questions
    if (originalTopics && subjectData.topics) {
        const topicIdChanges: Record<string, string> = {};

        // Create a map of old topic IDs to new topic IDs
        originalTopics.forEach((oldTopic: any) => {
            const newTopic = subjectData.topics.find((t: any) => t.name === oldTopic.name);
            if (newTopic && newTopic.id !== oldTopic.id) {
                topicIdChanges[oldTopic.id] = newTopic.id;
            }
        });

        // If there are topic ID changes, update all questions
        if (Object.keys(topicIdChanges).length > 0) {
            const questionsDir = path.join(subjectDir, 'questions');
            try {
                const questionFolders = await fs.readdir(questionsDir, { withFileTypes: true });

                for (const folder of questionFolders) {
                    if (folder.isDirectory()) {
                        const questionPath = path.join(questionsDir, folder.name, 'question.json');
                        try {
                            const questionData = await fs.readFile(questionPath, 'utf-8');
                            const question = JSON.parse(questionData);

                            // Update topic IDs if they reference changed topics
                            let updated = false;
                            if (question.topics && Array.isArray(question.topics)) {
                                const newTopics = question.topics.map((topicId: string) => {
                                    if (topicIdChanges[topicId]) {
                                        updated = true;
                                        return topicIdChanges[topicId];
                                    }
                                    return topicId;
                                });

                                if (updated) {
                                    question.topics = newTopics;
                                    await fs.writeFile(questionPath, JSON.stringify(question, null, 4));
                                }
                            }
                        } catch (err) {
                            // Skip if question.json doesn't exist
                            if ((err as any).code !== 'ENOENT') {
                                console.error(`Error updating question ${folder.name}:`, err);
                            }
                        }
                    }
                }
            } catch (err) {
                // Questions directory doesn't exist yet, that's fine
            }
        }
    }

    const subjectPath = path.join(subjectDir, 'subject.json');
    await fs.writeFile(subjectPath, JSON.stringify(subjectData, null, 4));

    return NextResponse.json({ success: true });
}

async function exportQuestions(folderPath: string, imageQuality: number = 80) {
    try {
        const subjects = [];
        const entries = await fs.readdir(folderPath, { withFileTypes: true });

        for (const entry of entries) {
            if (entry.isDirectory()) {
                const subjectJsonPath = path.join(folderPath, entry.name, 'subject.json');
                try {
                    const subjectData = await fs.readFile(subjectJsonPath, 'utf-8');
                    const subject = JSON.parse(subjectData);

                    // Load questions with images
                    const questionsDir = path.join(folderPath, entry.name, 'questions');
                    const questions = await loadQuestionsWithImages(questionsDir, imageQuality);

                    // Build topic map
                    const topicMap: Record<string, string> = {};
                    if (subject.topics) {
                        subject.topics.forEach((topic: any) => {
                            topicMap[topic.id] = topic.name;
                        });
                    }

                    subjects.push({
                        id: entry.name,
                        title: subject.name,
                        topicMap,
                        questions,
                    });
                } catch (err) {
                    console.error(`Error exporting subject ${entry.name}:`, err);
                }
            }
        }

        const exportData = {
            metadata: {
                version: '1.2.0',
                syntax: '1.0.0',
                generatedAt: new Date().toISOString(),
                hash: generateHash(),
                repository: 'https://github.com/skopevoj/cvut-marasty',
            },
            subjects,
        };

        return NextResponse.json(exportData);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

async function loadQuestionsWithImages(questionsDir: string, imageQuality: number = 80) {
    const questions = [];

    try {
        const questionFolders = await fs.readdir(questionsDir, { withFileTypes: true });

        for (const folder of questionFolders) {
            if (folder.isDirectory()) {
                const questionPath = path.join(questionsDir, folder.name, 'question.json');
                try {
                    const questionData = await fs.readFile(questionPath, 'utf-8');
                    const question = JSON.parse(questionData);

                    // Load images as base64
                    const questionFolder = path.join(questionsDir, folder.name);
                    const files = await fs.readdir(questionFolder);

                    let image = '';
                    let quizPhoto = '';

                    // Look for specific image filenames
                    const imageFile = files.find(f => /^image\.(png|jpg|jpeg|gif|webp)$/i.test(f));
                    const quizImageFile = files.find(f => /^(quizImage|quizPhoto)\.(png|jpg|jpeg|gif|webp)$/i.test(f));

                    if (imageFile) {
                        const imagePath = path.join(questionFolder, imageFile);
                        const imageBuffer = await fs.readFile(imagePath);
                        const base64 = await compressImage(imageBuffer, imageFile, imageQuality);
                        const mimeType = getMimeType(imageFile);
                        image = `data:${mimeType};base64,${base64}`;
                    }

                    if (quizImageFile) {
                        const quizImagePath = path.join(questionFolder, quizImageFile);
                        const quizImageBuffer = await fs.readFile(quizImagePath);
                        const base64 = await compressImage(quizImageBuffer, quizImageFile, imageQuality);
                        const mimeType = getMimeType(quizImageFile);
                        quizPhoto = `data:${mimeType};base64,${base64}`;
                    }

                    questions.push({
                        id: `${folder.name}`,
                        questionType: question.questionType || 'multichoice',
                        topics: question.topics || [],
                        question: question.question,
                        originalText: question.originalText || question.question,
                        image,
                        quizPhoto,
                        answers: question.answers || [],
                    });
                } catch (err) {
                    console.error(`Error loading question ${folder.name}:`, err);
                }
            }
        }
    } catch (error) {
        console.error('Error loading questions:', error);
    }

    return questions;
}

function getMimeType(filename: string): string {
    const ext = path.extname(filename).toLowerCase();
    const mimeTypes: Record<string, string> = {
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.gif': 'image/gif',
        '.webp': 'image/webp',
    };
    return mimeTypes[ext] || 'image/png';
}

function generateHash(): string {
    return Math.random().toString(36).substring(2, 10);
}

async function deleteFile(filePath: string) {
    try {
        await fs.unlink(filePath);
        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
