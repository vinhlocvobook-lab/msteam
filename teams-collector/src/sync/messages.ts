import { AxiosInstance } from 'axios';
import { fetchAllPages, sleep } from '../graph';
import { upsert, getLastSyncedAt, updateSyncState, logSync } from '../db';
import { config } from '../config';

interface GraphMessage {
    id: string;
    messageType: string;
    from?: { user?: { id: string; displayName: string } };
    body: { content: string; contentType: string };
    importance: string;
    createdDateTime: string;
    lastModifiedDateTime: string;
    replyToId?: string;
    replies?: GraphMessage[];
}

async function saveMessage(
    msg: GraphMessage,
    teamId: string,
    channelId: string,
    since: Date
): Promise<boolean> {
    if (msg.messageType !== 'message') return false;
    if (!msg.from?.user) return false;

    const msgDate = new Date(msg.createdDateTime);
    if (msgDate < since) return false;

    await upsert('messages', {
        id: msg.id,
        source_type: 'channel',
        source_id: channelId,
        team_id: teamId,
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

    return true;
}

export async function syncChannelMessages(
    client: AxiosInstance,
    teamId: string,
    channelId: string,
    channelName: string
): Promise<number> {
    const startedAt = new Date();
    console.log(`  📨 ${channelName}...`);

    const lastSynced = await getLastSyncedAt(channelId);
    const since = lastSynced
        ? new Date(lastSynced.getTime() - 60_000)
        : (() => {
            const d = new Date();
            d.setDate(d.getDate() - config.sync.fetchDays);
            return d;
        })();

    const isIncremental = !!lastSynced;

    try {
        // Lấy tất cả top-level messages
        const messages = await fetchAllPages<GraphMessage>(
            client,
            `/teams/${teamId}/channels/${channelId}/messages?$top=50`
        );

        let count = 0;
        let latestMessageAt: Date | null = null;

        for (const msg of messages) {
            // Lưu message gốc
            const saved = await saveMessage(msg, teamId, channelId, since);
            if (saved) {
                count++;
                const msgDate = new Date(msg.createdDateTime);
                if (!latestMessageAt || msgDate > latestMessageAt) {
                    latestMessageAt = msgDate;
                }
            }

            // ← QUAN TRỌNG: Lấy thêm replies của message này
            try {
                const replies = await fetchAllPages<GraphMessage>(
                    client,
                    `/teams/${teamId}/channels/${channelId}/messages/${msg.id}/replies?$top=50`
                );

                for (const reply of replies) {
                    const replySaved = await saveMessage(reply, teamId, channelId, since);
                    if (replySaved) {
                        count++;
                        const replyDate = new Date(reply.createdDateTime);
                        if (!latestMessageAt || replyDate > latestMessageAt) {
                            latestMessageAt = replyDate;
                        }
                    }
                }

                if (replies.length > 0) {
                    console.log(`     💬 ${msg.id.slice(-6)}: ${replies.length} replies`);
                }
            } catch (replyErr: any) {
                // Bỏ qua lỗi khi lấy replies, không ảnh hưởng message gốc
                console.warn(`     ⚠️  Skip replies for ${msg.id.slice(-6)}: ${replyErr.message}`);
            }

            await sleep(200); // tránh rate limit giữa các message
        }

        await updateSyncState(channelId, 'channel', latestMessageAt);
        await logSync({
            sync_type: 'channel',
            source_id: channelId,
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
                sync_type: 'channel',
                source_id: channelId,
                status: 'skipped',
                message: `HTTP ${status}`,
                started_at: startedAt
            });
            return 0;
        }

        await logSync({
            sync_type: 'channel',
            source_id: channelId,
            status: 'error',
            message: err.message,
            started_at: startedAt
        });
        throw err;
    }
}