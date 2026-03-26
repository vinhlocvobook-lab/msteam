'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft } from 'lucide-react';
import { MessageThread } from '@/components/messages/message-thread';

export default function ChatDetailPage({
    params
}: {
    params: Promise<{ id: string }>
}) {
    const { id } = use(params); // ← unwrap Promise
    const [chat, setChat] = useState<any>(null);
    const router = useRouter();

    useEffect(() => {
        fetch(`/api/chats?page=1`)
            .then(r => r.json())
            .then(data => {
                const found = data.chats.find((c: any) => c.id === id);
                if (found) setChat(found);
            });
    }, [id]);

    const chatTypeLabel: Record<string, string> = {
        oneOnOne: '👤 Chat 1:1',
        group: '👥 Group Chat',
        meeting: '📹 Meeting Chat'
    };

    return (
        <div className="flex flex-col h-screen">
            <div className="bg-white border-b px-6 py-3 flex items-center gap-3 shrink-0">
                <Button variant="ghost" size="sm" onClick={() => router.back()}>
                    <ArrowLeft size={16} />
                </Button>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <h1 className="font-semibold truncate">
                            {chat?.topic || 'Chat'}
                        </h1>
                        {chat && (
                            <Badge variant="outline" className="text-xs shrink-0">
                                {chatTypeLabel[chat.chat_type] || chat.chat_type}
                            </Badge>
                        )}
                    </div>
                    {chat && (
                        <p className="text-xs text-gray-400">
                            {chat.message_count} tin nhắn · {chat.member_count} người
                        </p>
                    )}
                </div>
            </div>
            <div className="flex-1 overflow-hidden bg-gray-50">
                <MessageThread apiUrl={`/api/chats/${id}/messages`} />
            </div>
        </div>
    );
}