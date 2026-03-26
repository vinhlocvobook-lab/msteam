'use client';

import { useEffect, useState } from 'react';
import { ExternalLink } from 'lucide-react';

interface OGData {
    title?: string;
    description?: string;
    image?: string;
    siteName?: string;
    url: string;
}

export function LinkPreview({ url }: { url: string }) {
    const [data, setData] = useState<OGData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        fetch(`/api/og?url=${encodeURIComponent(url)}`)
            .then(r => r.json())
            .then(d => {
                if (d.error) setError(true);
                else setData(d);
            })
            .catch(() => setError(true))
            .finally(() => setLoading(false));
    }, [url]);

    if (loading) return (
        <div className="mt-2 h-16 w-72 bg-gray-100 rounded-lg animate-pulse" />
    );

    if (error || !data?.title) return null;

    return (
        <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 flex gap-3 max-w-sm border rounded-lg overflow-hidden
                 hover:border-blue-300 hover:shadow-sm transition-all bg-white group"
        >
            {/* Thumbnail */}
            {data.image && (
                <img
                    src={data.image}
                    alt=""
                    className="w-20 h-20 object-cover shrink-0"
                    onError={e => (e.currentTarget.style.display = 'none')}
                />
            )}

            {/* Text */}
            <div className="flex-1 p-2 min-w-0">
                {data.siteName && (
                    <p className="text-xs text-gray-400 mb-0.5">{data.siteName}</p>
                )}
                <p className="text-xs font-semibold text-gray-800 line-clamp-2 group-hover:text-blue-600">
                    {data.title}
                </p>
                {data.description && (
                    <p className="text-xs text-gray-500 line-clamp-2 mt-0.5">
                        {data.description}
                    </p>
                )}
                <p className="text-xs text-gray-400 mt-1 flex items-center gap-1 truncate">
                    <ExternalLink size={10} />
                    {new URL(url).hostname}
                </p>
            </div>
        </a>
    );
}