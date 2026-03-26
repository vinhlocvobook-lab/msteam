import mysql from 'mysql2/promise';

let pool: mysql.Pool;

export function getDb(): mysql.Pool {
    if (!pool) {
        pool = mysql.createPool({
            host: process.env.DB_HOST!,
            port: Number(process.env.DB_PORT || 3306),
            user: process.env.DB_USER!,
            password: process.env.DB_PASSWORD!,
            database: process.env.DB_NAME!,
            waitForConnections: true,
            connectionLimit: 10,
            charset: 'utf8mb4'
        });
    }
    return pool;
}

export async function query<T = any>(
    sql: string,
    params?: any[]
): Promise<T[]> {
    const db = getDb();
    const [rows] = await db.execute<mysql.RowDataPacket[]>(sql, params);
    return rows as T[];
}