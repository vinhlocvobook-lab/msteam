// import { getAccessToken } from './auth';
// import { createGraphClient, sleep } from './graph';
// import { initDb, closeDb } from './db';
// import { syncTeams, syncChannels } from './sync/teams';
// import { syncChannelMessages } from './sync/messages';
// import { syncChats, syncChatMessages } from './sync/chats';
// import { startScheduler } from './scheduler';

import { getAccessToken } from './auth';
import { createGraphClient, sleep } from './graph';
import { initDb, closeDb } from './db';
import { syncTeams, syncChannels } from './sync/teams';
import { syncChannelMessages, syncChatMessages } from './sync/messages'; // ← gộp cả 2 vào đây
import { syncChats } from './sync/chats'; // ← chỉ còn syncChats
import { startScheduler } from './scheduler';

// ─── Core sync function ───────────────────────────────────────────
async function runSync(): Promise<void> {
    const startTime = Date.now();
    let totalMessages = 0;
    let totalErrors = 0;

    try {
        const token = await getAccessToken();
        const client = createGraphClient(token);

        // 1. Sync Teams & Channels
        const teams = await syncTeams(client);

        for (const team of teams) {
            console.log(`\n📁 Team: ${team.displayName}`);
            const channels = await syncChannels(client, team.id);

            for (const channel of channels) {
                try {
                    const count = await syncChannelMessages(
                        client, team.id, channel.id, channel.displayName
                    );
                    totalMessages += count;
                } catch (err: any) {
                    totalErrors++;
                    console.error(`  ❌ Error: ${err.message}`);
                }
                await sleep(300);
            }
        }

        // 2. Sync Chats
        const chats = await syncChats(client);
        for (const chat of chats) {
            try {
                const label = chat.topic || `${chat.chatType} chat`;
                const count = await syncChatMessages(client, chat.id, label);
                totalMessages += count;
            } catch (err: any) {
                totalErrors++;
                console.error(`  ❌ Error: ${err.message}`);
            }
            await sleep(300);
        }

    } catch (err: any) {
        console.error('❌ Sync error:', err.message);
        throw err;
    }

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log('\n' + '─'.repeat(50));
    console.log(`✅ Sync completed in ${elapsed}s`);
    console.log(`   Messages synced : ${totalMessages}`);
    console.log(`   Errors          : ${totalErrors}`);
    console.log('─'.repeat(50));
}

// ─── Entry point ──────────────────────────────────────────────────
async function main() {
    console.log('🚀 Teams Collector starting...\n');

    await initDb();

    const args = process.argv.slice(2);
    const isScheduled = args.includes('--schedule');

    // Chạy sync lần đầu ngay lập tức
    await runSync();

    if (isScheduled) {
        // Chạy định kỳ theo cron
        startScheduler(runSync);
        // Giữ process sống
        process.on('SIGINT', async () => {
            console.log('\n👋 Shutting down...');
            await closeDb();
            process.exit(0);
        });
    } else {
        await closeDb();
        process.exit(0);
    }
}

main().catch(async (err) => {
    console.error('❌ Fatal:', err.message);
    await closeDb();
    process.exit(1);
});