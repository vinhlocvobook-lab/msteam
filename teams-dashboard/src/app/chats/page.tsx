'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MessageSquare, Users, Clock, Search, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

function stripHtml(html: string) {
    return html?.replace(/<[^>]*>/g, ' ').replace(/&nbsp;/gi, ' ')
        .replace(/\s+/g, ' ').trim() || '';
}

const CHAT_TYPE_LABEL: Record<string, { label: string; icon: string; color: string }> = {
    oneOnOne: { label: '1:1', icon: '👤', color: 'bg-blue-100 text-blue-700' },
    group: { label: 'Nhóm', icon: '👥', color: 'bg-green-100 text-green-700' },
    meeting: { label: 'Meeting', icon: '📹', color: 'bg-purple-100 text-purple-700' }
};

export default function ChatsPage() {
    const [chats, setChats] = useState<any[]>([]);
    const [filtered, setFiltered] = useState<any[]>([]);
    const [total, setTotal] = useState(0);
    const [chatType, setChatType] = useState('all');
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        setLoading(true);
        const params = new URLSearchParams({
            ...(chatType !== 'all' && { type: chatType })
        });
        fetch(`/api/chats?${params}`)
            .then(r => r.json())
            .then(data => {
                setChats(data.chats || []);
                setTotal(data.total || 0);
                setLoading(false);
            });
    }, [chatType]);

    useEffect(() => {
        if (!search) { setFiltered(chats); return; }
        // setFiltered(chats.filter(c =>
        //     c.topic?.toLowerCase().includes(search.toLowerCase()) ||
        //     c.last_sender?.toLowerCase().includes(search.toLowerCase())
        // ));
        setFiltered(chats.filter(c =>
            c.display_name?.toLowerCase().includes(search.toLowerCase()) ||
            c.topic?.toLowerCase().includes(search.toLowerCase()) ||
            c.last_sender?.toLowerCase().includes(search.toLowerCase())
        ));
    }, [search, chats]);

    return (
        <div className="p-8 space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold">Chats</h1>
                <p className="text-gray-500 mt-1">{total} cuộc trò chuyện</p>
            </div>

            {/* Search & Filter */}
            <div className="flex gap-3">
                <div className="relative flex-1 max-w-md">
                    <Search size={16} className="absolute left-3 top-2.5 text-gray-400" />
                    <Input
                        placeholder="Tìm chat, người dùng..."
                        className="pl-9"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>
                <Select value={chatType} onValueChange={v => { setChatType(v); setSearch(''); }}>
                    <SelectTrigger className="w-36">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Tất cả</SelectItem>
                        <SelectItem value="oneOnOne">👤 1:1</SelectItem>
                        <SelectItem value="group">👥 Nhóm</SelectItem>
                        <SelectItem value="meeting">📹 Meeting</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Chat List */}
            {loading ? (
                <div className="space-y-2">
                    {[...Array(8)].map((_, i) => (
                        <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />
                    ))}
                </div>
            ) : (
                <div className="space-y-2">
                    {filtered.map(chat => {
                        const typeInfo = CHAT_TYPE_LABEL[chat.chat_type] || { label: chat.chat_type, icon: '💬', color: 'bg-gray-100 text-gray-600' };
                        const lastMsg = chat.last_message ? stripHtml(chat.last_message) : '';

                        return (
                            <div
                                key={chat.id}
                                onClick={() => router.push(`/chats/${chat.id}`)}
                                className="flex items-center gap-4 p-4 bg-white rounded-xl border
                           hover:border-blue-300 hover:shadow-md transition-all cursor-pointer group"
                            >
                                {/* Avatar */}
                                <div className="w-11 h-11 rounded-full bg-gradient-to-br from-blue-400 to-blue-600
                                flex items-center justify-center text-xl shrink-0">
                                    {typeInfo.icon}
                                </div>

                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-0.5">
                                        <p className="font-semibold text-sm text-gray-900 truncate">
                                            {chat.display_name || chat.topic || `Chat ${typeInfo.label}`}
                                        </p>
                                        <span className={`text-xs px-1.5 py-0.5 rounded-full shrink-0 ${typeInfo.color}`}>
                                            {typeInfo.label}
                                        </span>
                                    </div>
                                    {lastMsg && (
                                        <p className="text-xs text-gray-400 truncate">
                                            {chat.last_sender && (
                                                <span className="text-gray-500 font-medium">{chat.last_sender}: </span>
                                            )}
                                            {lastMsg}
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
                                    <div className="flex items-center gap-2 justify-end text-xs text-gray-400">
                                        <span className="flex items-center gap-0.5">
                                            <MessageSquare size={11} />
                                            {Number(chat.message_count || 0).toLocaleString()}
                                        </span>
                                        <span className="flex items-center gap-0.5">
                                            <Users size={11} />
                                            {chat.member_count || 0}
                                        </span>
                                    </div>
                                </div>

                                <ChevronRight size={16} className="text-gray-300 group-hover:text-blue-400 shrink-0" />
                            </div>
                        );
                    })}

                    {filtered.length === 0 && (
                        <div className="text-center py-16 text-gray-400">
                            Không tìm thấy chat nào
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}