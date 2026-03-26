'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer, RadarChart,
    PolarGrid, PolarAngleAxis, Radar
} from 'recharts';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

export default function AnalyticsPage() {
    const [data, setData] = useState<any>(null);

    useEffect(() => {
        fetch('/api/analytics')
            .then(r => r.json())
            .then(setData);
    }, []);

    if (!data) return (
        <div className="p-8 text-center text-gray-400 animate-pulse">
            Đang phân tích dữ liệu...
        </div>
    );

    const { topSenders, hourlyActivity, weekdayActivity, topChannels } = data;

    const weekdays = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
    const weekdayData = weekdayActivity.map((d: any) => ({
        ...d,
        day: weekdays[d.dow - 1] || d.day_name
    }));

    return (
        <div className="p-8 space-y-8">
            <div>
                <h1 className="text-2xl font-bold">Phân tích</h1>
                <p className="text-gray-500 mt-1">Thống kê hoạt động chi tiết</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Hoạt động theo giờ */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Hoạt động theo giờ</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={220}>
                            <BarChart data={hourlyActivity}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                <XAxis dataKey="hour" tickFormatter={h => `${h}h`} tick={{ fontSize: 11 }} />
                                <YAxis tick={{ fontSize: 11 }} />
                                <Tooltip labelFormatter={h => `${h}:00`} />
                                <Bar dataKey="total" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Hoạt động theo ngày trong tuần */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Hoạt động theo thứ</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={220}>
                            <BarChart data={weekdayData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                                <YAxis tick={{ fontSize: 11 }} />
                                <Tooltip />
                                <Bar dataKey="total" fill="#10b981" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Top Senders */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Top người gửi</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {topSenders.map((sender: any, i: number) => (
                                <div key={sender.sender_name} className="flex items-center gap-3">
                                    <span className="text-sm text-gray-400 w-5 text-right">{i + 1}</span>
                                    <Avatar className="w-8 h-8">
                                        <AvatarFallback className="text-xs bg-blue-100 text-blue-700">
                                            {sender.sender_name?.charAt(0)?.toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium truncate">{sender.sender_name}</p>
                                        <div className="w-full bg-gray-100 rounded-full h-1.5 mt-1">
                                            <div
                                                className="bg-blue-500 h-1.5 rounded-full"
                                                style={{
                                                    width: `${(sender.total / topSenders[0].total) * 100}%`
                                                }}
                                            />
                                        </div>
                                    </div>
                                    <span className="text-sm font-semibold text-gray-700">
                                        {Number(sender.total).toLocaleString()}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Top Channels */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Top channels</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {topChannels.map((ch: any, i: number) => (
                                <div key={i} className="flex items-center gap-3">
                                    <span className="text-sm text-gray-400 w-5 text-right">{i + 1}</span>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium truncate">#{ch.channel_name}</p>
                                        <p className="text-xs text-gray-400 truncate">{ch.team_name}</p>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-sm font-semibold">{Number(ch.message_count).toLocaleString()}</span>
                                        <p className="text-xs text-gray-400">{ch.unique_senders} người</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}