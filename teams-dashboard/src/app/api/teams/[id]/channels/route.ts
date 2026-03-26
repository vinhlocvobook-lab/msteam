import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params; // ← await Promise

    const channels = await query(`
    SELECT
      c.id, c.display_name, c.description, c.web_url,
      COUNT(DISTINCT m.id) as message_count,
      COUNT(DISTINCT m.sender_id) as unique_senders,
      MAX(m.created_at) as last_activity,
      MIN(m.created_at) as first_activity
    FROM channels c
    LEFT JOIN messages m ON m.source_id = c.id AND m.source_type = 'channel'
    WHERE c.team_id = ?
    GROUP BY c.id, c.display_name, c.description, c.web_url
    ORDER BY message_count DESC
  `, [id]);

    return NextResponse.json(channels);
}