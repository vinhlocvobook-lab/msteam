'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Hash, MessageSquare, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

export default function TeamsPage() {
    const [teams, setTeams] = useState<any[]>([]);

    useEffect(() => {
        fetch('/api/teams').then(r => r.json()).then(setTeams);
    }, []);

    return (
        <div className="p-8 space-y-6">
            <div>
                <h1 className="text-2xl font-bold">Teams & Channels</h1>
                <p className="text-gray-500 mt-1">{teams.length} teams</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {teams.map((team) => (
                    <Card key={team.id} className="hover:shadow-md transition-shadow">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base line-clamp-2">{team.display_name}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <div className="flex items-center gap-4 text-sm text-gray-600">
                                <span className="flex items-center gap-1">
                                    <Hash size={14} /> {team.channel_count} channels
                                </span>
                                <span className="flex items-center gap-1">
                                    <MessageSquare size={14} /> {Number(team.message_count).toLocaleString()}
                                </span>
                            </div>
                            {team.last_activity && (
                                <p className="text-xs text-gray-400 flex items-center gap-1">
                                    <Clock size={12} />
                                    {format(new Date(team.last_activity), 'dd/MM/yyyy HH:mm', { locale: vi })}
                                </p>
                            )}
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}