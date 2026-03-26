'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, MessageSquare, Users, Clock, Search, ChevronRight } from 'lucide-react';
import { MessageThread } from '@/components/messages/message-thread';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { cn } from '@/lib/utils';

function stripHtml(html: string) {
    return html?.replace(/<[^>]*>/g, ' ').replace(/&nbsp;/gi, ' ')
        .replace(/\s+/g, ' ').trim() || '';
}

const CHAT_TYPE_LABEL: Record<string, { label: string; icon: string }> = {
    oneOnOne: { label: 'Chat 1:1', icon: '👤' },
    group: { label: 'Group Chat', icon: '👥' },
    meeting: { label: 'Meeting Chat', icon: '📹' }
};

export default function ChatDetailPage({
    params
}: {
    params: Promise<{ id: string }>
}) {
    const { id } = use(params);
    const [currentChat, setCurrentChat] = useState<any>(null);
    const [allChats, setAllChats] = useState<any[]>([]);
    const [search, setSearch] = useState('');
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const router = useRouter();

    useEffect(() => {
        // Load current chat info
        fetch(`/api/chats?id=${id}`)
            .then(r => r.json())
            .then(setCurrentChat);

        // Load all chats cho sidebar
        fetch('/api/chats?page=1')
            .then(r => r.json())
            .then(data => setAllChats(data.chats || []));
    }, [id]);

    // const filteredChats = search
    //     ? allChats.filter(c =>
    //         c.topic?.toLowerCase().includes(search.toLowerCase()) ||
    //         c.last_sender?.toLowerCase().includes(search.toLowerCase())
    //     )
    //     : allChats;

    const filteredChats = search
        ? allChats.filter(c =>
            c.display_name?.toLowerCase().includes(search.toLowerCase()) ||  // ← thêm
            c.topic?.toLowerCase().includes(search.toLowerCase()) ||
            c.last_sender?.toLowerCase().includes(search.toLowerCase())
        )
        : allChats;

    const typeInfo = CHAT_TYPE_LABEL[currentChat?.chat_type] ||
        { label: currentChat?.chat_type || 'Chat', icon: '💬' };

    return (
        <div className="flex h-screen overflow-hidden">

            {/* ── Sidebar ── */}
            <aside className={cn(
                'flex flex-col bg-gray-50 border-r transition-all duration-200 shrink-0',
                sidebarOpen ? 'w-72' : 'w-0 overflow-hidden'
            )}>
                {/* Header */}
                <div className="p-4 border-b bg-white">
                    <Button
                        variant="ghost" size="sm"
                        className="mb-2 -ml-1 text-gray-500"
                        onClick={() => router.push('/chats')}
                    >
                        <ArrowLeft size={14} className="mr-1" /> Tất cả Chats
                    </Button>
                    <p className="text-sm font-semibold text-gray-700">Danh sách Chat</p>
                </div>

                {/* Search */}
                <div className="p-3 border-b">
                    <div className="relative">
                        <Search size={13} className="absolute left-2.5 top-2 text-gray-400" />
                        <Input
                            placeholder="Tìm chat..."
                            className="pl-7 h-7 text-xs"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                    </div>
                </div>

                {/* Chat List */}
                <div className="flex-1 overflow-y-auto py-1">
                    {filteredChats.map(chat => {
                        const info = CHAT_TYPE_LABEL[chat.chat_type] || { label: chat.chat_type, icon: '💬' };
                        const isActive = chat.id === id;
                        const lastMsg = chat.last_message ? stripHtml(chat.last_message) : '';

                        return (
                            <button
                                key={chat.id}
                                onClick={() => router.push(`/chats/${chat.id}`)}
                                className={cn(
                                    'w-full flex items-center gap-2.5 px-3 py-2.5 text-left transition-colors',
                                    isActive ? 'bg-blue-50' : 'hover:bg-gray-100'
                                )}
                            >
                                {/* Avatar */}
                                <div className={cn(
                                    'w-8 h-8 rounded-full flex items-center justify-center text-sm shrink-0',
                                    isActive ? 'bg-blue-500' : 'bg-gray-200'
                                )}>
                                    {info.icon}
                                </div>
                                {/* Info */}
                                <div className="flex-1 min-w-0 text-left">
                                    <p className={cn(
                                        'text-xs font-medium truncate',
                                        isActive ? 'text-blue-700' : 'text-gray-700'
                                    )}>
                                        {/* {chat.topic || `${info.icon} ${info.label}`} */}
                                        {chat.display_name || chat.topic || `${info.icon} ${info.label}`}
                                    </p>
                                    {lastMsg && (
                                        <p className="text-xs text-gray-400 truncate">{lastMsg}</p>
                                    )}
                                </div>
                                {/* Message count */}
                                {chat.message_count > 0 && (
                                    <span className="text-xs text-gray-400 shrink-0">
                                        {Number(chat.message_count).toLocaleString()}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>
            </aside>

            {/* ── Main Content ── */}
            <div className="flex-1 flex flex-col min-w-0">

                {/* Header */}
                <div className="bg-white border-b px-4 py-3 flex items-center gap-3 shrink-0">
                    {/* Toggle sidebar */}
                    <Button
                        variant="ghost" size="sm"
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                        className="text-gray-400 hover:text-gray-600"
                    >
                        <ChevronRight size={16} className={cn(
                            'transition-transform',
                            sidebarOpen && 'rotate-180'
                        )} />
                    </Button>

                    {currentChat ? (
                        <>
                            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center
                              justify-center text-lg shrink-0">
                                {typeInfo.icon}
                            </div>
                            <div className="flex-1 min-w-0">
                                <h1 className="font-semibold truncate text-sm">
                                    {/* {currentChat.topic || typeInfo.label} */}
                                    {currentChat.display_name || currentChat.topic || typeInfo.label}
                                </h1>
                                <div className="flex items-center gap-3 text-xs text-gray-400">
                                    <span className="flex items-center gap-1">
                                        <MessageSquare size={11} />
                                        {Number(currentChat.message_count || 0).toLocaleString()} tin nhắn
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <Users size={11} />
                                        {currentChat.member_count || 0} người
                                    </span>
                                    {currentChat.last_activity && (
                                        <span className="flex items-center gap-1">
                                            <Clock size={11} />
                                            {format(new Date(currentChat.last_activity), 'dd/MM/yyyy HH:mm', { locale: vi })}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </>
                    ) : (
                        <span className="text-gray-400 text-sm">Đang tải...</span>
                    )}
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-hidden bg-white">
                    <MessageThread apiUrl={`/api/chats/${id}/messages`} />
                </div>
            </div>
        </div>
    );
}