import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params; // ← await Promise
    const { searchParams } = new URL(req.url);
    const page = Number(searchParams.get('page') || 1);
    const limit = 30;
    const offset = (page - 1) * limit;

    const messages = await query(`
    SELECT id, sender_name, sender_id, body_content,
           body_content_type, created_at, importance,
           reply_to_id, attachments
    FROM messages
    WHERE source_id = ? AND source_type = 'chat'
    ORDER BY created_at ASC
    LIMIT ${limit} OFFSET ${offset}
  `, [id]);

    const [countRow] = await query(
        `SELECT COUNT(*) as total FROM messages
     WHERE source_id = ? AND source_type = 'chat'`,
        [id]
    );

    return NextResponse.json({
        messages,
        total: countRow.total,
        totalPages: Math.ceil(countRow.total / limit)
    });
}