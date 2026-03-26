'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MessageSquare, Users, Clock, Search } from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

function stripHtml(html: string) {
    return html?.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim() || '';
}

export default function ChatsPage() {
    const [chats, setChats] = useState<any[]>([]);
    const [total, setTotal] = useState(0);
    const [chatType, setChatType] = useState('all');
    const [search, setSearch] = useState('');
    const router = useRouter();

    useEffect(() => {
        const params = new URLSearchParams({
            ...(chatType !== 'all' && { type: chatType })
        });
        fetch(`/api/chats?${params}`)
            .then(r => r.json())
            .then(data => {
                setChats(data.chats);
                setTotal(data.total);
            });
    }, [chatType]);

    const filtered = search
        ? chats.filter(c =>
            c.topic?.toLowerCase().includes(search.toLowerCase()) ||
            c.last_sender?.toLowerCase().includes(search.toLowerCase())
        )
        : chats;

    const chatTypeLabel = (type: string) => {
        const map: Record<string, string> = {
            oneOnOne: '👤 1:1',
            group: '👥 Nhóm',
            meeting: '📹 Meeting'
        };
        return map[type] || type;
    };

    return (
        <div className="p-8 space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                    <h1 className="text-2xl font-bold">Chats</h1>
                    <p className="text-gray-500 mt-1">{total} cuộc trò chuyện</p>
                </div>
                <div className="flex gap-3">
                    <div className="relative w-64">
                        <Search size={16} className="absolute left-3 top-2.5 text-gray-400" />
                        <Input
                            placeholder="Tìm chat..."
                            className="pl-9"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                    </div>
                    <Select value={chatType} onValueChange={setChatType}>
                        <SelectTrigger className="w-36">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Tất cả</SelectItem>
                            <SelectItem value="oneOnOne">1:1</SelectItem>
                            <SelectItem value="group">Nhóm</SelectItem>
                            <SelectItem value="meeting">Meeting</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Chat List */}
            <div className="space-y-2">
                {filtered.map((chat) => (
                    <Card
                        key={chat.id}
                        className="hover:shadow-md transition-all cursor-pointer hover:border-blue-300"
                        onClick={() => router.push(`/chats/${chat.id}`)}
                    >
                        <CardContent className="py-3 flex items-center gap-4">
                            {/* Icon */}
                            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                                <MessageSquare size={18} className="text-blue-600" />
                            </div>

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    <span className="font-medium truncate">
                                        {chat.topic || `Chat ${chatTypeLabel(chat.chat_type)}`}
                                    </span>
                                    <Badge variant="outline" className="text-xs shrink-0">
                                        {chatTypeLabel(chat.chat_type)}
                                    </Badge>
                                </div>
                                {chat.last_message && (
                                    <p className="text-xs text-gray-400 truncate mt-0.5">
                                        <span className="font-medium text-gray-500">{chat.last_sender}: </span>
                                        {stripHtml(chat.last_message)}
                                    </p>
                                )}
                            </div>

                            {/* Stats */}
                            <div className="text-right shrink-0 space-y-1">
                                {chat.last_activity && (
                                    <p className="text-xs text-gray-400">
                                        {format(new Date(chat.last_activity), 'dd/MM HH:mm', { locale: vi })}
                                    </p>
                                )}
                                <div className="flex items-center gap-2 justify-end text-xs text-gray-500">
                                    <span className="flex items-center gap-1">
                                        <MessageSquare size={11} />
                                        {Number(chat.message_count || 0).toLocaleString()}
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <Users size={11} />
                                        {chat.member_count || 0}
                                    </span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}