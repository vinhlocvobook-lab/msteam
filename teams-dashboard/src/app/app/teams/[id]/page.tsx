'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MessageSquare, Users, ArrowLeft, Clock, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

export default function TeamDetailPage({
    params
}: {
    params: Promise<{ id: string }>
}) {
    const { id } = use(params); // ← unwrap Promise
    const [channels, setChannels] = useState<any[]>([]);
    const [teamName, setTeamName] = useState('');
    const router = useRouter();

    useEffect(() => {
        fetch(`/api/teams/${id}/channels`)
            .then(r => r.json())
            .then(setChannels);

        fetch('/api/teams')
            .then(r => r.json())
            .then((teams: any[]) => {
                const team = teams.find(t => t.id === id);
                if (team) setTeamName(team.display_name);
            });
    }, [id]);

    return (
        <div className="p-8 space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="sm" onClick={() => router.back()}>
                    <ArrowLeft size={16} className="mr-1" /> Quay lại
                </Button>
                <div>
                    <h1 className="text-2xl font-bold line-clamp-1">{teamName}</h1>
                    <p className="text-gray-500 mt-0.5">{channels.length} channels</p>
                </div>
            </div>

            <div className="space-y-3">
                {channels.map((ch) => (
                    <Card
                        key={ch.id}
                        className="hover:shadow-md transition-all cursor-pointer hover:border-blue-300"
                        onClick={() => router.push(`/teams/${id}/channels/${ch.id}`)}
                    >
                        <CardContent className="py-4 flex items-center justify-between gap-4">
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    <span className="text-blue-500 font-bold">#</span>
                                    <span className="font-medium truncate">{ch.display_name}</span>
                                    {ch.message_count === 0 && (
                                        <Badge variant="secondary" className="text-xs">Trống</Badge>
                                    )}
                                </div>
                                {ch.description && (
                                    <p className="text-xs text-gray-400 mt-1 truncate ml-4">
                                        {ch.description}
                                    </p>
                                )}
                            </div>
                            <div className="flex items-center gap-6 text-sm text-gray-500 shrink-0">
                                <span className="flex items-center gap-1">
                                    <MessageSquare size={14} />
                                    {Number(ch.message_count || 0).toLocaleString()}
                                </span>
                                <span className="flex items-center gap-1">
                                    <Users size={14} />
                                    {ch.unique_senders || 0}
                                </span>
                                {ch.last_activity && (
                                    <span className="flex items-center gap-1 text-xs">
                                        <Clock size={12} />
                                        {format(new Date(ch.last_activity), 'dd/MM HH:mm', { locale: vi })}
                                    </span>
                                )}
                                {ch.web_url && (
                                    <a
                                        href={ch.web_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        onClick={e => e.stopPropagation()}
                                        className="text-blue-500 hover:text-blue-700"
                                    >
                                        <ExternalLink size={14} />
                                    </a>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}