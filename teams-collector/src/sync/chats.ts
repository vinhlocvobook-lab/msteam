import { AxiosInstance } from 'axios';
import { fetchAllPages, sleep } from '../graph';
import { upsert, getLastSyncedAt, updateSyncState, logSync } from '../db';
import { config } from '../config';

interface Chat {
    id: string;
    chatType: string;
    topic?: string;
    createdDateTime: string;
    lastUpdatedDateTime?: string;
}

interface ChatMember {
    displayName: string;
    userId?: string;
}

interface ChatMessage {
    id: string;
    messageType: string;
    from?: { user?: { id: string; displayName: string } };
    body: { content: string; contentType: string };
    importance: string;
    createdDateTime: string;
    lastModifiedDateTime: string;
    replyToId?: string;
}

export async function syncChats(client: AxiosInstance): Promise<Chat[]> {
    console.log('\n🔄 Syncing chats...');
    const chats = await fetchAllPages<Chat>(client, '/me/chats?$expand=members');

    for (const chat of chats) {
        await upsert('chats', {
            id: chat.id,
            chat_type: chat.chatType,
            topic: chat.topic || null,
            created_at: new Date(chat.createdDateTime),
            synced_at: new Date()
        });
    }

    console.log(`✅ Found ${chats.length} chats`);
    return chats;
}

export async function syncChatMessages(
    client: AxiosInstance,
    chatId: string,
    chatLabel: string
): Promise<number> {
    const startedAt = new Date();
    console.log(`  💬 ${chatLabel}...`);

    const lastSynced = await getLastSyncedAt(chatId);
    const since = lastSynced
        ? new Date(lastSynced.getTime() - 60_000)
        : (() => {
            const d = new Date();
            d.setDate(d.getDate() - config.sync.fetchDays);
            return d;
        })();

    const isIncremental = !!lastSynced;

    try {
        const messages = await fetchAllPages<ChatMessage>(
            client,
            `/me/chats/${chatId}/messages?$top=50`
        );

        let count = 0;
        let latestMessageAt: Date | null = null;

        for (const msg of messages) {
            if (msg.messageType !== 'message') continue;
            if (!msg.from?.user) continue;

            const msgDate = new Date(msg.createdDateTime);
            if (msgDate < since) continue;

            await upsert('messages', {
                id: msg.id,
                source_type: 'chat',
                source_id: chatId,
                team_id: null,
                sender_id: msg.from.user.id,
                sender_name: msg.from.user.displayName,
                body_content: msg.body?.content || null,
                body_content_type: msg.body?.contentType || 'text',
                importance: msg.importance || 'normal',
                created_at: msgDate,
                last_modified_at: new Date(msg.lastModifiedDateTime),
                reply_to_id: msg.replyToId || null,
                synced_at: new Date()
            });

            if (!latestMessageAt || msgDate > latestMessageAt) {
                latestMessageAt = msgDate;
            }

            count++;
            await sleep(50);
        }

        await updateSyncState(chatId, 'chat', latestMessageAt);
        await logSync({
            sync_type: 'chat',
            source_id: chatId,
            status: 'success',
            messages_synced: count,
            started_at: startedAt
        });

        const mode = isIncremental ? '(incremental)' : '(full)';
        console.log(`     ✅ ${count} messages ${mode}`);
        return count;

    } catch (err: any) {
        const status = err.response?.status;

        if (status === 403 || status === 404) {
            console.log(`     ⏭️  Skipped (${status})`);
            await logSync({
                sync_type: 'chat',
                source_id: chatId,
                status: 'skipped',
                message: `HTTP ${status}`,
                started_at: startedAt
            });
            return 0;
        }

        await logSync({
            sync_type: 'chat',
            source_id: chatId,
            status: 'error',
            message: err.message,
            started_at: startedAt
        });
        throw err;
    }
}