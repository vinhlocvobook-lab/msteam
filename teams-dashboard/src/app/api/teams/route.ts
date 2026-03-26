import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const teamId = searchParams.get('id');

  // Lấy 1 team theo id
  if (teamId) {
    const [team] = await query(`
      SELECT id, display_name, description FROM teams WHERE id = ?
    `, [teamId]);
    return NextResponse.json(team || null);
  }

  // Lấy tất cả teams
  const teams = await query(`
    SELECT
      t.id,
      t.display_name,
      t.description,
      COUNT(DISTINCT c.id) as channel_count,
      COUNT(DISTINCT m.id) as message_count,
      MAX(m.created_at) as last_activity
    FROM teams t
    LEFT JOIN channels c ON c.team_id = t.id
    LEFT JOIN messages m ON m.source_id = c.id AND m.source_type = 'channel'
    GROUP BY t.id, t.display_name, t.description
    ORDER BY last_activity DESC, t.display_name ASC
  `);

  return NextResponse.json(teams);
}