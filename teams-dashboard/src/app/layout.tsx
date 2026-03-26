import type { Metadata } from 'next';
import { Inter, Geist } from 'next/font/google';
import './globals.css';
import { Sidebar } from '@/components/layout/sidebar';
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
    title: 'Teams Archive Dashboard',
    description: 'Quản lý và phân tích Microsoft Teams'
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="vi" className={cn("font-sans", geist.variable)}>
            <body className={inter.className}>
                <div className="flex min-h-screen bg-gray-50">
                    <Sidebar />
                    <main className="flex-1 overflow-auto">
                        {children}
                    </main>
                </div>
            </body>
        </html>
    );
}