import { AxiosInstance } from 'axios';
import { fetchAllPages, sleep } from '../graph';
import { upsert } from '../db';
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
}

export async function syncChannelMessages(
    client: AxiosInstance,
    teamId: string,
    channelId: string,
    channelName: string
): Promise<number> {
    const since = new Date();
    since.setDate(since.getDate() - config.sync.fetchDays);
    const sinceStr = since.toISOString();

    console.log(`  📨 ${channelName}...`);

    let count = 0;
    const messages = await fetchAllPages<GraphMessage>(
        client,
        `/teams/${teamId}/channels/${channelId}/messages?$top=50`
    );

    for (const msg of messages) {
        // Bỏ qua system messages (bot, notifications)
        if (msg.messageType !== 'message') continue;
        if (!msg.from?.user) continue;
        // Bỏ qua messages cũ hơn fetchDays
        if (new Date(msg.createdDateTime) < since) continue;

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
            created_at: new Date(msg.createdDateTime),
            last_modified_at: new Date(msg.lastModifiedDateTime),
            reply_to_id: msg.replyToId || null,
            synced_at: new Date()
        });

        count++;
        await sleep(50);
    }

    console.log(`     ✅ ${count} messages`);
    return count;
}