import dotenv from 'dotenv';
dotenv.config();

function requireEnv(key: string): string {
    const value = process.env[key];
    if (!value) throw new Error(`Missing environment variable: ${key}`);
    return value;
}

export const config = {
    azure: {
        clientId: requireEnv('AZURE_CLIENT_ID'),
        tenantId: requireEnv('AZURE_TENANT_ID'),
        clientSecret: requireEnv('AZURE_CLIENT_SECRET'),
        scopes: [
            'https://graph.microsoft.com/Team.ReadBasic.All',
            'https://graph.microsoft.com/Channel.ReadBasic.All',
            'https://graph.microsoft.com/ChannelMessage.Read.All',
            'https://graph.microsoft.com/Chat.Read',
            'https://graph.microsoft.com/Chat.ReadBasic',
            'https://graph.microsoft.com/User.Read',
            'offline_access'
        ]
    },
    db: {
        host: requireEnv('DB_HOST'),
        port: Number(process.env.DB_PORT || 3306),
        user: requireEnv('DB_USER'),
        password: requireEnv('DB_PASSWORD'),
        database: requireEnv('DB_NAME')
    },
    sync: {
        intervalMinutes: Number(process.env.SYNC_INTERVAL_MINUTES || 30),
        fetchDays: Number(process.env.MESSAGE_FETCH_DAYS || 90)
    }
};