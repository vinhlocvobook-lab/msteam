'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

export default function MessagesPage() {
    const [messages, setMessages] = useState<any[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [search, setSearch] = useState('');
    const [sourceType, setSourceType] = useState('all');
    const [loading, setLoading] = useState(false);
    const [searchInput, setSearchInput] = useState('');

    const fetchMessages = useCallback(async () => {
        setLoading(true);
        const params = new URLSearchParams({
            page: String(page),
            ...(search && { q: search }),
            ...(sourceType !== 'all' && { type: sourceType })
        });
        const res = await fetch(`/api/messages?${params}`);
        const data = await res.json();
        setMessages(data.messages);
        setTotal(data.total);
        setTotalPages(data.totalPages);
        setLoading(false);
    }, [page, search, sourceType]);

    useEffect(() => { fetchMessages(); }, [fetchMessages]);

    const handleSearch = () => {
        setSearch(searchInput);
        setPage(1);
    };

    return (
        <div className="p-8 space-y-6">
            <div>
                <h1 className="text-2xl font-bold">Tin nhắn</h1>
                <p className="text-gray-500 mt-1">
                    {total.toLocaleString()} tin nhắn
                </p>
            </div>

            {/* Search & Filter */}
            <div className="flex gap-3">
                <div className="flex-1 flex gap-2">
                    <Input
                        placeholder="Tìm kiếm nội dung..."
                        value={searchInput}
                        onChange={e => setSearchInput(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleSearch()}
                    />
                    <Button onClick={handleSearch}>
                        <Search size={16} />
                    </Button>
                </div>
                <Select value={sourceType} onValueChange={v => { setSourceType(v); setPage(1); }}>
                    <SelectTrigger className="w-40">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Tất cả</SelectItem>
                        <SelectItem value="channel">Channel</SelectItem>
                        <SelectItem value="chat">Chat</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Messages List */}
            <div className="space-y-3">
                {loading ? (
                    <div className="text-center py-12 text-gray-400">Đang tải...</div>
                ) : messages.length === 0 ? (
                    <div className="text-center py-12 text-gray-400">Không tìm thấy tin nhắn</div>
                ) : messages.map((msg) => (
                    <Card key={msg.id} className="hover:shadow-md transition-shadow">
                        <CardContent className="pt-4 pb-4">
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex-1 min-w-0">
                                    {/* Header */}
                                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                                        <span className="font-semibold text-sm text-gray-900">
                                            {msg.sender_name}
                                        </span>
                                        <Badge variant={msg.source_type === 'channel' ? 'default' : 'secondary'}>
                                            {msg.source_type === 'channel' ? '#' : '💬'}{' '}
                                            {msg.channel_name || 'Chat'}
                                        </Badge>
                                        {msg.team_name && (
                                            <span className="text-xs text-gray-400">{msg.team_name}</span>
                                        )}
                                    </div>
                                    {/* Content */}
                                    <div
                                        className="text-sm text-gray-700 line-clamp-3"
                                        dangerouslySetInnerHTML={{
                                            __html: msg.body_content_type === 'html'
                                                ? msg.body_content?.replace(/<[^>]*>/g, ' ').trim() || ''
                                                : msg.body_content || ''
                                        }}
                                    />
                                </div>
                                {/* Time */}
                                <span className="text-xs text-gray-400 whitespace-nowrap shrink-0">
                                    {format(new Date(msg.created_at), 'dd/MM/yyyy HH:mm', { locale: vi })}
                                </span>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-center gap-3">
                    <Button
                        variant="outline" size="sm"
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1}
                    >
                        <ChevronLeft size={16} />
                    </Button>
                    <span className="text-sm text-gray-600">
                        Trang {page} / {totalPages}
                    </span>
                    <Button
                        variant="outline" size="sm"
                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                    >
                        <ChevronRight size={16} />
                    </Button>
                </div>
            )}
        </div>
    );
}