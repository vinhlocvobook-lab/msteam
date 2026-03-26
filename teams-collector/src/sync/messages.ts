import fs from 'fs';
import path from 'path';
import { AxiosInstance } from 'axios';
import { fetchAllPages, sleep } from '../graph';
import { upsert, getLastSyncedAt, updateSyncState, logSync } from '../db';
import { config } from '../config';

// Root media folder — nằm cùng cấp với teams-collector và teams-dashboard
const MEDIA_ROOT = path.resolve(__dirname, '../../../teams_media');

function getMediaDir(sourceType: 'channel' | 'chat', sourceId: string, teamId?: string | null): string {
    if (sourceType === 'channel' && teamId) {
        return path.join(MEDIA_ROOT, 'channels', teamId, sourceId);
    }
    return path.join(MEDIA_ROOT, 'chats', sourceId);
}

function getMediaUrl(sourceType: 'channel' | 'chat', sourceId: string, teamId: string | null, filename: string): string {
    if (sourceType === 'channel' && teamId) {
        return `/media/channels/${teamId}/${sourceId}/${filename}`;
    }
    return `/media/chats/${sourceId}/${filename}`;
}

// ─── Interfaces ────────────────────────────────────────────────────

interface GraphAttachment {
    id: string;
    name?: string;
    contentUrl?: string;
    contentType?: string;
    thumbnailUrl?: string;
}

interface GraphMessage {
    id: string;
    messageType: string;
    from?: { user?: { id: string; displayName: string } };
    body: { content: string; contentType: string };
    importance: string;
    createdDateTime: string;
    lastModifiedDateTime: string;
    replyToId?: string;
    attachments?: GraphAttachment[];
}

// ─── Helpers ───────────────────────────────────────────────────────

function parseAttachments(attachments: GraphAttachment[] = []): string | null {
    const valid = attachments
        .filter(a => a.name && a.contentUrl)
        .map(a => ({
            name: a.name,
            contentUrl: a.contentUrl || null,
            contentType: a.contentType || null,
            thumbnailUrl: a.thumbnailUrl || null,
            isSharePoint: a.contentUrl?.includes('sharepoint.com') ?? false
        }));
    return valid.length > 0 ? JSON.stringify(valid) : null;
}

async function downloadHostedImage(
    client: AxiosInstance,
    url: string,
    messageId: string,
    index: number,
    sourceType: 'channel' | 'chat',
    sourceId: string,
    teamId: string | null
): Promise<string | null> {
    try {
        if (!url.includes('graph.microsoft.com') || !url.includes('hostedContents')) {
            return null;
        }

        const mediaDir = getMediaDir(sourceType, sourceId, teamId);

        // Kiểm tra đã tồn tại chưa
        if (fs.existsSync(mediaDir)) {
            const existing = fs.readdirSync(mediaDir)
                .find(f => f.startsWith(`${messageId}_${index}.`));
            if (existing) {
                return getMediaUrl(sourceType, sourceId, teamId, existing);
            }
        }

        // Download binary
        const response = await client.get(url, {
            responseType: 'arraybuffer',
            timeout: 15000
        });

        const contentType = (response.headers['content-type'] || '').split(';')[0].trim();
        const extMap: Record<string, string> = {
            'image/jpeg': 'jpg',
            'image/jpg': 'jpg',
            'image/png': 'png',
            'image/gif': 'gif',
            'image/webp': 'webp'
        };
        const ext = extMap[contentType] || 'jpg';
        const filename = `${messageId}_${index}.${ext}`;

        // Tạo thư mục nếu chưa có
        fs.mkdirSync(mediaDir, { recursive: true });
        fs.writeFileSync(path.join(mediaDir, filename), Buffer.from(response.data));

        const localUrl = getMediaUrl(sourceType, sourceId, teamId, filename);
        process.stdout.write(`\r     🖼️  ${filename}`);
        return localUrl;

    } catch {
        return null;
    }
}

async function processBodyContent(
    client: AxiosInstance,
    messageId: string,
    content: string,
    contentType: string,
    sourceType: 'channel' | 'chat',
    sourceId: string,
    teamId: string | null
): Promise<string> {
    if (contentType !== 'html' || !content.includes('hostedContents')) {
        return content;
    }

    let processed = content;
    const imgRegex = /<img[^>]+src=["'](https:\/\/graph\.microsoft\.com[^"']+hostedContents[^"']+)["'][^>]*/gi;
    const matches = [...content.matchAll(imgRegex)];

    for (let i = 0; i < matches.length; i++) {
        const originalUrl = matches[i][1];
        const localPath = await downloadHostedImage(
            client, originalUrl, messageId, i, sourceType, sourceId, teamId
        );
        if (localPath) {
            processed = processed.replace(originalUrl, localPath);
        }
        await sleep(300);
    }

    return processed;
}

// ─── Save Message ──────────────────────────────────────────────────

async function saveMessage(
    msg: GraphMessage,
    client: AxiosInstance,
    sourceType: 'channel' | 'chat',
    sourceId: string,
    teamId: string | null,
    since: Date
): Promise<{ saved: boolean; date: Date | null }> {
    if (msg.messageType !== 'message') return { saved: false, date: null };
    if (!msg.from?.user) return { saved: false, date: null };

    const msgDate = new Date(msg.createdDateTime);
    if (msgDate < since) return { saved: false, date: null };

    const processedContent = await processBodyContent(
        client,
        msg.id,
        msg.body?.content || '',
        msg.body?.contentType || 'text',
        sourceType,
        sourceId,
        teamId
    );

    await upsert('messages', {
        id: msg.id,
        source_type: sourceType,
        source_id: sourceId,
        team_id: teamId,
        sender_id: msg.from.user.id,
        sender_name: msg.from.user.displayName,
        body_content: processedContent,
        body_content_type: msg.body?.contentType || 'text',
        importance: msg.importance || 'normal',
        created_at: msgDate,
        last_modified_at: new Date(msg.lastModifiedDateTime),
        reply_to_id: msg.replyToId || null,
        attachments: parseAttachments(msg.attachments),
        synced_at: new Date()
    });

    return { saved: true, date: msgDate };
}

// ─── Channel Messages ──────────────────────────────────────────────

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
        const messages = await fetchAllPages<GraphMessage>(
            client,
            `/teams/${teamId}/channels/${channelId}/messages?$top=50`
        );

        let count = 0;
        let latestMessageAt: Date | null = null;

        for (const msg of messages) {
            const { saved, date } = await saveMessage(
                msg, client, 'channel', channelId, teamId, since
            );
            if (saved && date) {
                count++;
                if (!latestMessageAt || date > latestMessageAt) latestMessageAt = date;
            }

            // Lấy replies
            try {
                const replies = await fetchAllPages<GraphMessage>(
                    client,
                    `/teams/${teamId}/channels/${channelId}/messages/${msg.id}/replies?$top=50`
                );

                for (const reply of replies) {
                    const { saved: rSaved, date: rDate } = await saveMessage(
                        reply, client, 'channel', channelId, teamId, since
                    );
                    if (rSaved && rDate) {
                        count++;
                        if (!latestMessageAt || rDate > latestMessageAt) latestMessageAt = rDate;
                    }
                    await sleep(50);
                }

                if (replies.length > 0) {
                    process.stdout.write(`\r     💬 ${count} messages (${replies.length} replies)...   `);
                }
            } catch {
                // Bỏ qua lỗi replies
            }

            await sleep(200);
        }

        process.stdout.write('\r                                                            \r');
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

// ─── Chat Messages ─────────────────────────────────────────────────

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
        const messages = await fetchAllPages<GraphMessage>(
            client,
            `/me/chats/${chatId}/messages?$top=50`
        );

        let count = 0;
        let latestMessageAt: Date | null = null;

        for (const msg of messages) {
            const { saved, date } = await saveMessage(
                msg, client, 'chat', chatId, null, since
            );
            if (saved && date) {
                count++;
                if (!latestMessageAt || date > latestMessageAt) latestMessageAt = date;
            }
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