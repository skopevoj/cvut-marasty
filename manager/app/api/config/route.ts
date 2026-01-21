import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';

const CONFIG_FILE = '.manager-config.json';

export async function GET() {
    try {
        const data = await fs.readFile(CONFIG_FILE, 'utf-8');
        return NextResponse.json(JSON.parse(data));
    } catch (error) {
        return NextResponse.json({ folders: [] });
    }
}

export async function POST(req: NextRequest) {
    try {
        const config = await req.json();
        await fs.writeFile(CONFIG_FILE, JSON.stringify(config, null, 2));
        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
