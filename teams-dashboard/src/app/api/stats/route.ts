import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
    const [overview] = await query(`
    SELECT
      (SELECT COUNT(*) FROM messages) as total_messages,
      (SELECT COUNT(*) FROM messages WHERE source_type = 'channel') as channel_messages,
      (SELECT COUNT(*) FROM messages WHERE source_type = 'chat') as chat_messages,
      (SELECT COUNT(DISTINCT sender_id) FROM messages) as total_senders,
      (SELECT COUNT(*) FROM teams) as total_teams,
      (SELECT COUNT(*) FROM channels) as total_channels,
      (SELECT COUNT(*) FROM chats) as total_chats,
      (SELECT COUNT(*) FROM messages
        WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)) as messages_last_7d,
      (SELECT COUNT(*) FROM messages
        WHERE created_at >= DATE_SUB(NOW(), INTERVAL 1 DAY)) as messages_last_24h
  `);

    // Messages theo ngày (30 ngày gần nhất)
    const dailyMessages = await query(`
    SELECT
      DATE(created_at) as date,
      COUNT(*) as total,
      SUM(CASE WHEN source_type = 'channel' THEN 1 ELSE 0 END) as channels,
      SUM(CASE WHEN source_type = 'chat' THEN 1 ELSE 0 END) as chats
    FROM messages
    WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
    GROUP BY DATE(created_at)
    ORDER BY date ASC
  `);

    return NextResponse.json({ overview, dailyMessages });
}