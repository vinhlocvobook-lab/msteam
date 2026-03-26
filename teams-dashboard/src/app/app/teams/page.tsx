'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Hash, MessageSquare, Clock, Search, Users } from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

export default function TeamsPage() {
    const [teams, setTeams] = useState<any[]>([]);
    const [filtered, setFiltered] = useState<any[]>([]);
    const [search, setSearch] = useState('');
    const router = useRouter();

    useEffect(() => {
        fetch('/api/teams').then(r => r.json()).then(data => {
            setTeams(data);
            setFiltered(data);
        });
    }, []);

    useEffect(() => {
        if (!search) { setFiltered(teams); return; }
        setFiltered(teams.filter(t =>
            t.display_name?.toLowerCase().includes(search.toLowerCase())
        ));
    }, [search, teams]);

    return (
        <div className="p-8 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Teams & Channels</h1>
                    <p className="text-gray-500 mt-1">{teams.length} teams</p>
                </div>
                <div className="relative w-72">
                    <Search size={16} className="absolute left-3 top-2.5 text-gray-400" />
                    <Input
                        placeholder="Tìm team..."
                        className="pl-9"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {filtered.map((team) => (
                    <Card
                        key={team.id}
                        className="hover:shadow-md transition-all cursor-pointer hover:border-blue-300"
                        onClick={() => router.push(`/teams/${team.id}`)}
                    >
                        <CardHeader className="pb-2">
                            <CardTitle className="text-base line-clamp-2 leading-snug">
                                {team.display_name}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="flex items-center gap-4 text-sm text-gray-600">
                                <span className="flex items-center gap-1">
                                    <Hash size={14} className="text-blue-500" />
                                    {team.channel_count} channels
                                </span>
                                <span className="flex items-center gap-1">
                                    <MessageSquare size={14} className="text-green-500" />
                                    {Number(team.message_count || 0).toLocaleString()}
                                </span>
                            </div>
                            {team.last_activity ? (
                                <p className="text-xs text-gray-400 flex items-center gap-1">
                                    <Clock size={12} />
                                    {format(new Date(team.last_activity), 'dd/MM/yyyy HH:mm', { locale: vi })}
                                </p>
                            ) : (
                                <p className="text-xs text-gray-400">Chưa có tin nhắn</p>
                            )}
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}