'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
    ArrowLeft, Hash, MessageSquare, Users,
    Search, Clock, ExternalLink, ChevronRight
} from 'lucide-react';
import { MessageThread } from '@/components/messages/message-thread';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { cn } from '@/lib/utils';

export default function ChannelMessagesPage({
    params
}: {
    params: Promise<{ id: string; channelId: string }>
}) {
    const { id, channelId } = use(params);
    const [team, setTeam] = useState<any>(null);
    const [channels, setChannels] = useState<any[]>([]);
    const [activeChannel, setActiveChannel] = useState<any>(null);
    const [search, setSearch] = useState('');
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const router = useRouter();

    useEffect(() => {
        // Load team info
        fetch(`/api/teams?id=${id}`)
            .then(r => r.json())
            .then(setTeam);

        // Load channels
        fetch(`/api/teams/${id}/channels`)
            .then(r => r.json())
            .then((data: any[]) => {
                setChannels(data);
                const current = data.find(c => c.id === channelId);
                if (current) setActiveChannel(current);
            });
    }, [id, channelId]);

    const filteredChannels = search
        ? channels.filter(c =>
            c.display_name?.toLowerCase().includes(search.toLowerCase())
        )
        : channels;

    return (
        <div className="flex h-screen overflow-hidden">

            {/* ── Sidebar ── */}
            <aside className={cn(
                'flex flex-col bg-gray-50 border-r transition-all duration-200 shrink-0',
                sidebarOpen ? 'w-72' : 'w-0 overflow-hidden'
            )}>
                {/* Team Header */}
                <div className="p-4 border-b bg-white">
                    <Button
                        variant="ghost" size="sm"
                        className="mb-2 -ml-1 text-gray-500"
                        onClick={() => router.push('/teams')}
                    >
                        <ArrowLeft size={14} className="mr-1" /> Tất cả Teams
                    </Button>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center
                            justify-center text-white font-bold shrink-0">
                            {team?.display_name?.charAt(0)?.toUpperCase()}
                        </div>
                        <div className="min-w-0">
                            <p className="font-semibold text-sm truncate leading-tight">
                                {team?.display_name}
                            </p>
                            <p className="text-xs text-gray-400">{channels.length} channels</p>
                        </div>
                    </div>
                </div>

                {/* Search channels */}
                <div className="p-3 border-b">
                    <div className="relative">
                        <Search size={13} className="absolute left-2.5 top-2 text-gray-400" />
                        <Input
                            placeholder="Tìm channel..."
                            className="pl-7 h-7 text-xs"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                    </div>
                </div>

                {/* Channel List */}
                <div className="flex-1 overflow-y-auto py-2">
                    {filteredChannels.map((ch) => (
                        <button
                            key={ch.id}
                            onClick={() => {
                                setActiveChannel(ch);
                                router.push(`/teams/${id}/channels/${ch.id}`);
                            }}
                            className={cn(
                                'w-full flex items-center gap-2 px-3 py-2 text-left transition-colors',
                                ch.id === channelId
                                    ? 'bg-blue-50 text-blue-700'
                                    : 'text-gray-700 hover:bg-gray-100'
                            )}
                        >
                            <Hash size={14} className={cn(
                                'shrink-0',
                                ch.id === channelId ? 'text-blue-500' : 'text-gray-400'
                            )} />
                            <span className="flex-1 text-sm truncate">{ch.display_name}</span>
                            {ch.message_count > 0 && (
                                <span className="text-xs text-gray-400 shrink-0">
                                    {Number(ch.message_count).toLocaleString()}
                                </span>
                            )}
                        </button>
                    ))}
                </div>
            </aside>

            {/* ── Main Content ── */}
            <div className="flex-1 flex flex-col min-w-0">

                {/* Channel Header */}
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

                    {activeChannel ? (
                        <>
                            <Hash size={18} className="text-blue-500 shrink-0" />
                            <div className="flex-1 min-w-0">
                                <h1 className="font-semibold truncate">{activeChannel.display_name}</h1>
                                {activeChannel.description && (
                                    <p className="text-xs text-gray-400 truncate">{activeChannel.description}</p>
                                )}
                            </div>

                            {/* Stats */}
                            <div className="hidden md:flex items-center gap-4 text-xs text-gray-500">
                                <span className="flex items-center gap-1">
                                    <MessageSquare size={12} />
                                    {Number(activeChannel.message_count || 0).toLocaleString()} messages
                                </span>
                                <span className="flex items-center gap-1">
                                    <Users size={12} />
                                    {activeChannel.unique_senders || 0} người
                                </span>
                                {activeChannel.last_activity && (
                                    <span className="flex items-center gap-1">
                                        <Clock size={12} />
                                        {format(new Date(activeChannel.last_activity), 'dd/MM/yyyy HH:mm', { locale: vi })}
                                    </span>
                                )}
                            </div>

                            {activeChannel.web_url && (
                                <a
                                    href={activeChannel.web_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-400 hover:text-blue-600 ml-2"
                                    title="Mở trong Teams"
                                >
                                    <ExternalLink size={16} />
                                </a>
                            )}
                        </>
                    ) : (
                        <span className="text-gray-400 text-sm">Chọn một channel</span>
                    )}
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-hidden bg-white">
                    {channelId === 'empty' ? (
                        <div className="flex items-center justify-center h-full text-gray-400">
                            <div className="text-center">
                                <Hash size={48} className="mx-auto mb-3 opacity-20" />
                                <p>Team này chưa có channel nào</p>
                            </div>
                        </div>
                    ) : (
                        <MessageThread
                            apiUrl={`/api/teams/${id}/channels/${channelId}/messages`}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}