import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

interface MessageBubbleProps {
    message: {
        id: string;
        sender_name: string;
        body_content: string;
        body_content_type: string;
        created_at: string;
        importance?: string;
    };
    isMe?: boolean;
}

function stripHtml(html: string): string {
    return html?.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim() || '';
}

export function MessageBubble({ message, isMe = false }: MessageBubbleProps) {
    const content = message.body_content_type === 'html'
        ? stripHtml(message.body_content)
        : message.body_content;

    if (!content) return null;

    return (
        <div className={cn('flex gap-2 mb-3', isMe && 'flex-row-reverse')}>
            {/* Avatar */}
            <div className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-1',
                isMe ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'
            )}>
                {message.sender_name?.charAt(0)?.toUpperCase()}
            </div>

            {/* Bubble */}
            <div className={cn('max-w-[70%]', isMe && 'items-end flex flex-col')}>
                <div className="flex items-baseline gap-2 mb-1">
                    {!isMe && (
                        <span className="text-xs font-semibold text-gray-700">
                            {message.sender_name}
                        </span>
                    )}
                    <span className="text-xs text-gray-400">
                        {format(new Date(message.created_at), 'HH:mm dd/MM', { locale: vi })}
                    </span>
                    {message.importance === 'high' && (
                        <span className="text-xs text-red-500">❗</span>
                    )}
                </div>
                <div className={cn(
                    'px-3 py-2 rounded-2xl text-sm leading-relaxed',
                    isMe
                        ? 'bg-blue-500 text-white rounded-tr-sm'
                        : 'bg-gray-100 text-gray-800 rounded-tl-sm'
                )}>
                    {content}
                </div>
            </div>
        </div>
    );
}