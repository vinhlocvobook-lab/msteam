import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
    // Top senders
    const topSenders = await query(`
    SELECT
      sender_name,
      COUNT(*) as total,
      SUM(CASE WHEN source_type = 'channel' THEN 1 ELSE 0 END) as channel_msgs,
      SUM(CASE WHEN source_type = 'chat' THEN 1 ELSE 0 END) as chat_msgs,
      MAX(created_at) as last_active
    FROM messages
    GROUP BY sender_id, sender_name
    ORDER BY total DESC
    LIMIT 10
  `);

    // Hoạt động theo giờ trong ngày
    const hourlyActivity = await query(`
    SELECT
      HOUR(created_at) as hour,
      COUNT(*) as total
    FROM messages
    GROUP BY HOUR(created_at)
    ORDER BY hour ASC
  `);

    // Hoạt động theo ngày trong tuần
    const weekdayActivity = await query(`
    SELECT
      DAYOFWEEK(created_at) as dow,
      DAYNAME(created_at) as day_name,
      COUNT(*) as total
    FROM messages
    GROUP BY DAYOFWEEK(created_at), DAYNAME(created_at)
    ORDER BY dow ASC
  `);

    // Top channels
    const topChannels = await query(`
    SELECT
      c.display_name as channel_name,
      t.display_name as team_name,
      COUNT(m.id) as message_count,
      COUNT(DISTINCT m.sender_id) as unique_senders
    FROM messages m
    JOIN channels c ON m.source_id = c.id
    JOIN teams t ON c.team_id = t.id
    WHERE m.source_type = 'channel'
    GROUP BY c.id, c.display_name, t.display_name
    ORDER BY message_count DESC
    LIMIT 10
  `);

    return NextResponse.json({ topSenders, hourlyActivity, weekdayActivity, topChannels });
}