import mysql from 'mysql2/promise';
import { config } from './config';

let pool: mysql.Pool;

export function getDb(): mysql.Pool {
    if (!pool) {
        pool = mysql.createPool({
            host: config.db.host,
            port: config.db.port,
            user: config.db.user,
            password: config.db.password,
            database: config.db.database,
            waitForConnections: true,
            connectionLimit: 10,
            charset: 'utf8mb4'
        });
    }
    return pool;
}

export async function initDb(): Promise<void> {
    const db = getDb();

    await db.execute(`
    CREATE TABLE IF NOT EXISTS teams (
      id VARCHAR(255) PRIMARY KEY,
      display_name VARCHAR(500),
      description TEXT,
      synced_at DATETIME
    ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
  `);

    await db.execute(`
    CREATE TABLE IF NOT EXISTS channels (
      id VARCHAR(255) PRIMARY KEY,
      team_id VARCHAR(255) NOT NULL,
      display_name VARCHAR(500),
      description TEXT,
      web_url TEXT,
      synced_at DATETIME,
      INDEX idx_team (team_id)
    ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
  `);

    await db.execute(`
    CREATE TABLE IF NOT EXISTS chats (
      id VARCHAR(255) PRIMARY KEY,
      chat_type VARCHAR(50),
      topic VARCHAR(500),
      created_at DATETIME,
      synced_at DATETIME
    ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
  `);

    await db.execute(`
    CREATE TABLE IF NOT EXISTS users (
      id VARCHAR(255) PRIMARY KEY,
      display_name VARCHAR(500),
      email VARCHAR(500),
      synced_at DATETIME
    ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
  `);

    await db.execute(`
    CREATE TABLE IF NOT EXISTS messages (
      id VARCHAR(255) PRIMARY KEY,
      source_type ENUM('channel', 'chat') NOT NULL,
      source_id VARCHAR(255),
      team_id VARCHAR(255),
      sender_id VARCHAR(255),
      sender_name VARCHAR(500),
      body_content LONGTEXT,
      body_content_type VARCHAR(50),
      importance VARCHAR(50),
      created_at DATETIME,
      last_modified_at DATETIME,
      reply_to_id VARCHAR(255),
      synced_at DATETIME,
      INDEX idx_source (source_type, source_id),
      INDEX idx_created (created_at),
      INDEX idx_sender (sender_id),
      FULLTEXT INDEX ft_body (body_content)
    ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
  `);

    await db.execute(`
  CREATE TABLE IF NOT EXISTS sync_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    sync_type VARCHAR(50),
    source_id VARCHAR(255),
    status ENUM('success', 'error', 'skipped'),
    message TEXT,
    messages_synced INT DEFAULT 0,
    started_at DATETIME,
    finished_at DATETIME,
    INDEX idx_source (source_id),
    INDEX idx_started (started_at)
  ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
`);

    await db.execute(`
  CREATE TABLE IF NOT EXISTS sync_state (
    source_id VARCHAR(255) PRIMARY KEY,
    source_type VARCHAR(50),
    last_synced_at DATETIME,
    last_message_at DATETIME
  ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
`);
    console.log('✅ Database schema ready');
}

export async function upsert(
    table: string,
    data: Record<string, any>
): Promise<void> {
    const db = getDb();
    const keys = Object.keys(data);
    const placeholders = keys.map(() => '?').join(', ');
    const updates = keys.map(k => `\`${k}\`=VALUES(\`${k}\`)`).join(', ');
    const sql = `
    INSERT INTO \`${table}\` (\`${keys.join('`, `')}\`)
    VALUES (${placeholders})
    ON DUPLICATE KEY UPDATE ${updates}
  `;
    await db.execute(sql, Object.values(data));
}

export async function closeDb(): Promise<void> {
    if (pool) await pool.end();
}





export async function getLastSyncedAt(sourceId: string): Promise<Date | null> {
    const db = getDb();
    const [rows] = await db.execute<mysql.RowDataPacket[]>(
        'SELECT last_message_at FROM sync_state WHERE source_id = ?',
        [sourceId]
    );
    if (rows.length > 0 && rows[0].last_message_at) {
        return new Date(rows[0].last_message_at);
    }
    return null;
}

export async function updateSyncState(
    sourceId: string,
    sourceType: string,
    lastMessageAt: Date | null
): Promise<void> {
    const db = getDb();
    await db.execute(`
    INSERT INTO sync_state (source_id, source_type, last_synced_at, last_message_at)
    VALUES (?, ?, NOW(), ?)
    ON DUPLICATE KEY UPDATE last_synced_at=NOW(), last_message_at=COALESCE(?, last_message_at)
  `, [sourceId, sourceType, lastMessageAt, lastMessageAt]);
}

export async function logSync(entry: {
    sync_type: string;
    source_id: string;
    status: 'success' | 'error' | 'skipped';
    message?: string;
    messages_synced?: number;
    started_at: Date;
}): Promise<void> {
    const db = getDb();
    await db.execute(`
    INSERT INTO sync_logs (sync_type, source_id, status, message, messages_synced, started_at, finished_at)
    VALUES (?, ?, ?, ?, ?, ?, NOW())
  `, [
        entry.sync_type,
        entry.source_id,
        entry.status,
        entry.message || null,
        entry.messages_synced || 0,
        entry.started_at
    ]);
}