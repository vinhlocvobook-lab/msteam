'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageSquare, Users, Hash, TrendingUp } from 'lucide-react';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid,
    Tooltip, Legend, ResponsiveContainer, BarChart, Bar
} from 'recharts';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

export default function DashboardPage() {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/stats')
            .then(r => r.json())
            .then(d => { setData(d); setLoading(false); });
    }, []);

    if (loading) return (
        <div className="p-8 flex items-center justify-center h-full">
            <div className="text-gray-500 animate-pulse">Đang tải dữ liệu...</div>
        </div>
    );

    const { overview, dailyMessages } = data;

    const statsCards = [
        {
            title: 'Tổng tin nhắn',
            value: overview.total_messages.toLocaleString(),
            sub: `+${overview.messages_last_24h} hôm nay`,
            icon: MessageSquare,
            color: 'text-blue-600'
        },
        {
            title: 'Người dùng',
            value: overview.total_senders,
            sub: `${overview.total_teams} teams`,
            icon: Users,
            color: 'text-green-600'
        },
        {
            title: 'Channels',
            value: overview.total_channels,
            sub: `${overview.channel_messages.toLocaleString()} tin nhắn`,
            icon: Hash,
            color: 'text-purple-600'
        },
        {
            title: '7 ngày qua',
            value: overview.messages_last_7d.toLocaleString(),
            sub: `${overview.chat_messages.toLocaleString()} chat msgs`,
            icon: TrendingUp,
            color: 'text-orange-600'
        }
    ];

    const chartData = dailyMessages.map((d: any) => ({
        ...d,
        date: format(new Date(d.date), 'dd/MM', { locale: vi })
    }));

    return (
        <div className="p-8 space-y-8">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
                <p className="text-gray-500 mt-1">Tổng quan hoạt động Microsoft Teams</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {statsCards.map((card) => {
                    const Icon = card.icon;
                    return (
                        <Card key={card.title}>
                            <CardContent className="pt-6">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <p className="text-sm text-gray-500">{card.title}</p>
                                        <p className="text-3xl font-bold mt-1">{card.value}</p>
                                        <p className="text-xs text-gray-400 mt-1">{card.sub}</p>
                                    </div>
                                    <Icon className={`${card.color} mt-1`} size={24} />
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            {/* Message Activity Chart */}
            <Card>
                <CardHeader>
                    <CardTitle>Hoạt động 30 ngày qua</CardTitle>
                </CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                            <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                            <YAxis tick={{ fontSize: 12 }} />
                            <Tooltip />
                            <Legend />
                            <Line
                                type="monotone" dataKey="channels"
                                stroke="#3b82f6" name="Channel" strokeWidth={2}
                            />
                            <Line
                                type="monotone" dataKey="chats"
                                stroke="#10b981" name="Chat" strokeWidth={2}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>
        </div>
    );
}