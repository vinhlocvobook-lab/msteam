'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
    LayoutDashboard, Users, MessageSquare, MessageCircle,
    BarChart2, Hash, Settings
} from 'lucide-react';

const navItems = [
    { href: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { href: '/teams', icon: Hash, label: 'Teams & Channels' },
    { href: '/chats', icon: MessageCircle, label: 'Chats' },        // ← mới
    { href: '/messages', icon: MessageSquare, label: 'Tin nhắn' },
    { href: '/analytics', icon: BarChart2, label: 'Phân tích' },
];

export function Sidebar() {
    const pathname = usePathname();

    return (
        <aside className="w-64 min-h-screen bg-gray-900 text-white flex flex-col">
            {/* Logo */}
            <div className="p-6 border-b border-gray-700">
                <h1 className="text-lg font-bold text-white">🏢 Teams Archive</h1>
                <p className="text-xs text-gray-400 mt-1">Minhphu Network</p>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-4 space-y-1">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors',
                                isActive
                                    ? 'bg-blue-600 text-white'
                                    : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                            )}
                        >
                            <Icon size={18} />
                            {item.label}
                        </Link>
                    );
                })}
            </nav>

            <div className="p-4 border-t border-gray-700 text-xs text-gray-500">
                Teams Collector v1.0
            </div>
        </aside>
    );
}