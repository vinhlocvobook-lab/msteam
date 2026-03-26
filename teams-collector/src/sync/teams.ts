import { AxiosInstance } from 'axios';
import { fetchAllPages } from '../graph';
import { upsert } from '../db';

interface Team {
    id: string;
    displayName: string;
    description: string;
}

interface Channel {
    id: string;
    displayName: string;
    description: string;
    webUrl: string;
}

export async function syncTeams(client: AxiosInstance): Promise<Team[]> {
    console.log('\n🔄 Syncing teams...');
    const teams = await fetchAllPages<Team>(client, '/me/joinedTeams');

    for (const team of teams) {
        await upsert('teams', {
            id: team.id,
            display_name: team.displayName,
            description: team.description || null,
            synced_at: new Date()
        });
    }

    console.log(`✅ Synced ${teams.length} teams`);
    return teams;
}

export async function syncChannels(
    client: AxiosInstance,
    teamId: string
): Promise<Channel[]> {
    const channels = await fetchAllPages<Channel>(
        client,
        `/teams/${teamId}/channels`
    );

    for (const ch of channels) {
        await upsert('channels', {
            id: ch.id,
            team_id: teamId,
            display_name: ch.displayName,
            description: ch.description || null,
            web_url: ch.webUrl || null,
            synced_at: new Date()
        });
    }

    return channels;
}