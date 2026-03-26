'use client';

import { use, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function TeamPage({
    params
}: {
    params: Promise<{ id: string }>
}) {
    const { id } = use(params);
    const router = useRouter();

    useEffect(() => {
        fetch(`/api/teams/${id}/channels`)
            .then(r => r.json())
            .then((channels: any[]) => {
                if (channels.length > 0) {
                    router.replace(`/teams/${id}/channels/${channels[0].id}`);
                } else {
                    router.replace(`/teams/${id}/channels/empty`);
                }
            });
    }, [id, router]);

    return (
        <div className= "flex items-center justify-center h-full" >
        <div className="text-gray-400 animate-pulse" > Đang tải...</div>
            </div>
  );
}