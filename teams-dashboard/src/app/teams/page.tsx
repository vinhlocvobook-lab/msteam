'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Hash, MessageSquare, Clock, Search, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

export default function TeamsPage() {
    const [teams, setTeams] = useState<any[]>([]);
    const [filtered, setFiltered] = useState<any[]>([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        fetch('/api/teams')
            .then(r => r.json())
            .then(data => {
                setTeams(data);
                setFiltered(data);
                setLoading(false);
            });
    }, []);

    useEffect(() => {
        if (!search) { setFiltered(teams); return; }
        setFiltered(teams.filter(t =>
            t.display_name?.toLowerCase().includes(search.toLowerCase())
        ));
    }, [search, teams]);

    const handleTeamClick = async (teamId: string) => {
        // Lấy channel đầu tiên rồi navigate vào luôn
        const res = await fetch(`/api/teams/${teamId}/channels`);
        const channels = await res.json();
        if (channels.length > 0) {
            router.push(`/teams/${teamId}/channels/${channels[0].id}`);
        } else {
            router.push(`/teams/${teamId}/channels/empty`);
        }
    };

    return (
        <div className="p-8 space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Teams & Channels</h1>
                <p className="text-gray-500 mt-1">{teams.length} teams</p>
            </div>

            {/* Search */}
            <div className="relative max-w-md">
                <Search size={16} className="absolute left-3 top-2.5 text-gray-400" />
                <Input
                    placeholder="Tìm team..."
                    className="pl-9"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                />
            </div>

            {/* Teams List */}
            {loading ? (
                <div className="space-y-3">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />
                    ))}
                </div>
            ) : (
                <div className="space-y-2">
                    {filtered.map((team) => (
                        <div
                            key={team.id}
                            onClick={() => handleTeamClick(team.id)}
                            className="flex items-center gap-4 p-4 bg-white rounded-xl border
                         hover:border-blue-300 hover:shadow-md transition-all cursor-pointer group"
                        >
                            {/* Avatar */}
                            <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center
                              justify-center text-white font-bold text-lg shrink-0">
                                {team.display_name?.charAt(0)?.toUpperCase()}
                            </div>

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                                <p className="font-semibold text-gray-900 truncate">
                                    {team.display_name}
                                </p>
                                {team.description && (
                                    <p className="text-xs text-gray-400 truncate mt-0.5">
                                        {team.description}
                                    </p>
                                )}
                                <div className="flex items-center gap-3 mt-1.5">
                                    <span className="flex items-center gap-1 text-xs text-gray-500">
                                        <Hash size={11} /> {team.channel_count} channels
                                    </span>
                                    <span className="flex items-center gap-1 text-xs text-gray-500">
                                        <MessageSquare size={11} />
                                        {Number(team.message_count || 0).toLocaleString()} messages
                                    </span>
                                    {team.last_activity && (
                                        <span className="flex items-center gap-1 text-xs text-gray-400">
                                            <Clock size={11} />
                                            {format(new Date(team.last_activity), 'dd/MM/yyyy', { locale: vi })}
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Arrow */}
                            <ChevronRight
                                size={18}
                                className="text-gray-300 group-hover:text-blue-400 transition-colors shrink-0"
                            />
                        </div>
                    ))}

                    {filtered.length === 0 && (
                        <div className="text-center py-16 text-gray-400">
                            Không tìm thấy team nào
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}