'use client';

import { useEffect, useRef, useState } from 'react';
import { MessageBubble } from './message-bubble';
import { Button } from '@/components/ui/button';
import { ChevronUp } from 'lucide-react';

interface MessageThreadProps {
    apiUrl: string;
    currentUserId?: string;
}

export function MessageThread({ apiUrl, currentUserId }: MessageThreadProps) {
    const [messages, setMessages] = useState<any[]>([]);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(false);
    const bottomRef = useRef<HTMLDivElement>(null);

    const fetchMessages = async (p: number, prepend = false) => {
        setLoading(true);
        const res = await fetch(`${apiUrl}?page=${p}`);
        const data = await res.json();
        setMessages(prev => prepend ? [...data.messages, ...prev] : data.messages);
        setTotalPages(data.totalPages);
        setTotal(data.total);
        setLoading(false);
    };

    useEffect(() => {
        fetchMessages(1);
    }, [apiUrl]);

    useEffect(() => {
        if (page === 1) {
            bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages]);

    return (
        <div className="flex flex-col h-full">
            {/* Load more */}
            {page < totalPages && (
                <div className="flex justify-center py-2">
                    <Button
                        variant="ghost" size="sm"
                        onClick={() => {
                            const next = page + 1;
                            setPage(next);
                            fetchMessages(next, true);
                        }}
                        disabled={loading}
                    >
                        <ChevronUp size={14} className="mr-1" />
                        Tải thêm ({total - messages.length} tin nhắn cũ hơn)
                    </Button>
                </div>
            )}

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-2 space-y-1">
                {loading && messages.length === 0 ? (
                    <div className="text-center py-8 text-gray-400">Đang tải...</div>
                ) : messages.length === 0 ? (
                    <div className="text-center py-8 text-gray-400">Chưa có tin nhắn</div>
                ) : (
                    messages.map(msg => (
                        <MessageBubble
                            key={msg.id}
                            message={msg}
                            isMe={msg.sender_id === currentUserId}
                        />
                    ))
                )}
                <div ref={bottomRef} />
            </div>
        </div>
    );
}