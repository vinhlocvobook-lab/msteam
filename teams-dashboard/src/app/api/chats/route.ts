import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

const MY_USER_ID = 'dd9d9d2f-6742-4fd1-819f-bb232bb254ad';

const displayNameSQL = `
  CASE 
    WHEN c.chat_type = 'oneOnOne' THEN (
      SELECT display_name FROM chat_members 
      WHERE chat_id = c.id AND user_id != '${MY_USER_ID}'
      LIMIT 1
    )
    WHEN c.topic IS NOT NULL THEN c.topic
    ELSE (
      SELECT GROUP_CONCAT(display_name ORDER BY display_name SEPARATOR ', ')
      FROM chat_members 
      WHERE chat_id = c.id AND user_id != '${MY_USER_ID}'
    )
  END
`;

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const chatId = searchParams.get('id');
  const type = searchParams.get('type') || '';
  const page = Number(searchParams.get('page') || 1);
  const limit = 50;
  const offset = (page - 1) * limit;

  // Lấy 1 chat theo id
  if (chatId) {
    const [chat] = await query(`
      SELECT
        c.id, c.chat_type, c.topic, c.created_at,
        (${displayNameSQL}) as display_name,
        COUNT(DISTINCT m.id) as message_count,
        COUNT(DISTINCT m.sender_id) as member_count,
        MAX(m.created_at) as last_activity
      FROM chats c
      LEFT JOIN messages m ON m.source_id = c.id AND m.source_type = 'chat'
      WHERE c.id = ?
      GROUP BY c.id, c.chat_type, c.topic, c.created_at
    `, [chatId]);
    return NextResponse.json(chat || null);
  }

  // Lấy danh sách chats
  let where = 'WHERE 1=1';
  const params: any[] = [];
  if (type && type !== 'all') {
    where += ' AND c.chat_type = ?';
    params.push(type);
  }

  const chats = await query(`
    SELECT
      c.id, c.chat_type, c.topic, c.created_at,
      (${displayNameSQL}) as display_name,
      COUNT(DISTINCT m.id) as message_count,
      COUNT(DISTINCT m.sender_id) as member_count,
      MAX(m.created_at) as last_activity,
      (
        SELECT m2.body_content FROM messages m2
        WHERE m2.source_id = c.id AND m2.source_type = 'chat'
        ORDER BY m2.created_at DESC LIMIT 1
      ) as last_message,
      (
        SELECT m2.sender_name FROM messages m2
        WHERE m2.source_id = c.id AND m2.source_type = 'chat'
        ORDER BY m2.created_at DESC LIMIT 1
      ) as last_sender
    FROM chats c
    LEFT JOIN messages m ON m.source_id = c.id AND m.source_type = 'chat'
    ${where}
    GROUP BY c.id, c.chat_type, c.topic, c.created_at
    ORDER BY last_activity DESC
    LIMIT ${limit} OFFSET ${offset}
  `, params);

  const [countRow] = await query(
    `SELECT COUNT(*) as total FROM chats c ${where}`, params
  );

  return NextResponse.json({
    chats,
    total: countRow.total,
    page,
    totalPages: Math.ceil(countRow.total / limit)
  });
}