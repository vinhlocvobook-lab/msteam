import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('q') || '';
    const sourceType = searchParams.get('type') || '';
    const sourceId = searchParams.get('source') || '';
    const page = Number(searchParams.get('page') || 1);
    const limit = 20;
    const offset = (page - 1) * limit;

    let where = 'WHERE 1=1';
    const params: any[] = [];

    if (search) {
        where += ' AND MATCH(body_content) AGAINST(? IN BOOLEAN MODE)';
        params.push(`*${search}*`);
    }
    if (sourceType) {
        where += ' AND source_type = ?';
        params.push(sourceType);
    }
    if (sourceId) {
        where += ' AND source_id = ?';
        params.push(sourceId);
    }

    const messages = await query(`
    SELECT
      m.id, m.source_type, m.source_id, m.sender_name,
      m.body_content, m.body_content_type,
      m.created_at, m.importance,
      t.display_name as team_name,
      c.display_name as channel_name
    FROM messages m
    LEFT JOIN channels c ON m.source_id = c.id AND m.source_type = 'channel'
    LEFT JOIN teams t ON c.team_id = t.id
    ${where}
    ORDER BY m.created_at DESC
    LIMIT ${limit} OFFSET ${offset}
  `, params);

    const [countRow] = await query(
        `SELECT COUNT(*) as total FROM messages ${where}`,
        params
    );

    return NextResponse.json({
        messages,
        total: countRow.total,
        page,
        totalPages: Math.ceil(countRow.total / limit)
    });
}