'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { MessageThread } from '@/components/messages/message-thread';

export default function ChannelMessagesPage({
    params
}: {
    params: Promise<{ id: string; channelId: string }>
}) {
    const { id, channelId } = use(params); // ← unwrap Promise
    const [channelName, setChannelName] = useState('');
    const [teamName, setTeamName] = useState('');
    const router = useRouter();

    useEffect(() => {
        fetch(`/api/teams/${id}/channels`)
            .then(r => r.json())
            .then((channels: any[]) => {
                const ch = channels.find(c => c.id === channelId);
                if (ch) setChannelName(ch.display_name);
            });

        fetch('/api/teams')
            .then(r => r.json())
            .then((teams: any[]) => {
                const team = teams.find(t => t.id === id);
                if (team) setTeamName(team.display_name);
            });
    }, [id, channelId]);

    return (
        <div className="flex flex-col h-screen">
            <div className="bg-white border-b px-6 py-3 flex items-center gap-3 shrink-0">
                <Button variant="ghost" size="sm" onClick={() => router.back()}>
                    <ArrowLeft size={16} />
                </Button>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <span className="text-blue-500 font-bold text-lg">#</span>
                        <h1 className="font-semibold truncate">{channelName}</h1>
                    </div>
                    <p className="text-xs text-gray-400">{teamName}</p>
                </div>
            </div>
            <div className="flex-1 overflow-hidden bg-gray-50">
                <MessageThread
                    apiUrl={`/api/teams/${id}/channels/${channelId}/messages`}
                />
            </div>
        </div>
    );
}