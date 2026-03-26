import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const MEDIA_ROOT = path.resolve(process.cwd(), '../teams_media');

export async function GET(
    req: Request,
    { params }: { params: Promise<{ path: string[] }> }
) {
    const { path: filePath } = await params;
    const fullPath = path.join(MEDIA_ROOT, ...filePath);

    // Security: không cho truy cập ra ngoài MEDIA_ROOT
    if (!fullPath.startsWith(MEDIA_ROOT)) {
        return new NextResponse('Forbidden', { status: 403 });
    }

    if (!fs.existsSync(fullPath)) {
        return new NextResponse('Not found', { status: 404 });
    }

    const ext = path.extname(fullPath).toLowerCase();
    const mimeMap: Record<string, string> = {
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
        '.gif': 'image/gif',
        '.webp': 'image/webp'
    };
    const contentType = mimeMap[ext] || 'application/octet-stream';

    const buffer = fs.readFileSync(fullPath);
    return new NextResponse(buffer, {
        headers: {
            'Content-Type': contentType,
            'Cache-Control': 'public, max-age=31536000, immutable'
        }
    });
}