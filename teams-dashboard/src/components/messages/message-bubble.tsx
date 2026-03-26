'use client';

import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { FileText, Image, Film, Music, Archive, ExternalLink, Paperclip } from 'lucide-react';

// ── Interfaces ────────────────────────────────────────────────────

interface Attachment {
    name?: string;
    contentUrl?: string;
    contentType?: string;
    thumbnailUrl?: string;
    isSharePoint?: boolean;
}

interface MessageBubbleProps {
    message: {
        id: string;
        sender_name: string;
        body_content: string;
        body_content_type: string;
        created_at: string;
        importance?: string;
        reply_to_id?: string;
        attachments?: string;
    };
    isMe?: boolean;
}

// ── File Helpers ──────────────────────────────────────────────────

function getFileIcon(name: string) {
    const ext = name?.split('.').pop()?.toLowerCase() || '';
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext))
        return <Image size={16} className="text-blue-500" />;
    if (['mp4', 'mov', 'avi', 'mkv'].includes(ext))
        return <Film size={16} className="text-purple-500" />;
    if (['mp3', 'wav', 'ogg'].includes(ext))
        return <Music size={16} className="text-green-500" />;
    if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext))
        return <Archive size={16} className="text-orange-500" />;
    if (ext === 'pdf')
        return <FileText size={16} className="text-red-500" />;
    if (['doc', 'docx'].includes(ext))
        return <FileText size={16} className="text-blue-600" />;
    if (['xls', 'xlsx'].includes(ext))
        return <FileText size={16} className="text-green-600" />;
    if (['ppt', 'pptx'].includes(ext))
        return <FileText size={16} className="text-orange-500" />;
    return <FileText size={16} className="text-gray-500" />;
}

function getFileColor(name: string): string {
    const ext = name?.split('.').pop()?.toLowerCase() || '';
    const colors: Record<string, string> = {
        pdf: 'border-red-200 bg-red-50',
        doc: 'border-blue-200 bg-blue-50',
        docx: 'border-blue-200 bg-blue-50',
        xls: 'border-green-200 bg-green-50',
        xlsx: 'border-green-200 bg-green-50',
        ppt: 'border-orange-200 bg-orange-50',
        pptx: 'border-orange-200 bg-orange-50',
        zip: 'border-yellow-200 bg-yellow-50',
        rar: 'border-yellow-200 bg-yellow-50',
        '7z': 'border-yellow-200 bg-yellow-50',
    };
    return colors[ext] || 'border-gray-200 bg-white';
}

function isLocalImage(src: string): boolean {
    return src.startsWith('/media/');
}

function isRemoteHostedImage(src: string): boolean {
    return src.includes('graph.microsoft.com') && src.includes('hostedContents');
}

// ── Content Helpers ───────────────────────────────────────────────

function decodeHtmlEntities(text: string): string {
    return text
        .replace(/&nbsp;/gi, ' ')
        .replace(/&amp;/gi, '&')
        .replace(/&lt;/gi, '<')
        .replace(/&gt;/gi, '>')
        .replace(/&quot;/gi, '"')
        .replace(/&#39;/gi, "'")
        .replace(/&apos;/gi, "'")
        .replace(/&#(\d+);/gi, (_, dec) => String.fromCharCode(Number(dec)))
        .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
}

function extractLinks(html: string): { text: string; url: string }[] {
    const links: { text: string; url: string }[] = [];
    const regex = /<a[^>]+href=["']([^"']+)["'][^>]*>(.*?)<\/a>/gi;
    let match;
    while ((match = regex.exec(html)) !== null) {
        const url = match[1];
        const text = decodeHtmlEntities(match[2].replace(/<[^>]*>/g, '').trim());
        if (url && !url.startsWith('mailto:') && text) {
            links.push({ url, text });
        }
    }
    return links;
}

function extractImages(html: string): string[] {
    const images: string[] = [];
    const regex = /<img[^>]+src=["']([^"']+)["'][^>]*/gi;
    let match;
    while ((match = regex.exec(html)) !== null) {
        const src = match[1];
        // Chỉ lấy ảnh local (/media/) hoặc ảnh đã được download
        // Bỏ qua hosted content chưa được download (vẫn là graph.microsoft.com)
        if (!isRemoteHostedImage(src)) {
            images.push(src);
        }
    }
    return images;
}

function parseTextContent(html: string, contentType: string): string {
    if (!html) return '';
    if (contentType !== 'html') return decodeHtmlEntities(html.trim());

    return decodeHtmlEntities(
        html
            .replace(/<br\s*\/?>/gi, '\n')
            .replace(/<\/p>/gi, '\n')
            .replace(/<\/div>/gi, '\n')
            .replace(/<a[^>]+>(.*?)<\/a>/gi, '$1')
            .replace(/<[^>]*>/g, '')
            .replace(/\n{3,}/g, '\n\n')
            .trim()
    );
}

// ── Sub-components ────────────────────────────────────────────────

function LinkPreview({ links }: { links: { text: string; url: string }[] }) {
    if (!links.length) return null;
    return (
        <div className="mt-2 space-y-1">
            {links.map((link, i) => (
                <a
                    key={i}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-xs text-blue-500 hover:text-blue-700
                     hover:underline truncate max-w-full"
                >
                    <ExternalLink size={11} className="shrink-0" />
                    <span className="truncate">{link.text || link.url}</span>
                </a>
            ))}
        </div>
    );
}

function ImagePreview({ src, alt }: { src: string; alt?: string }) {
    // Bỏ qua ảnh hosted chưa được download
    if (isRemoteHostedImage(src)) return null;

    return (
        <a href={src} target="_blank" rel="noopener noreferrer">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
                src={src}
                alt={alt || 'image'}
                className="mt-2 max-w-[280px] max-h-[200px] rounded-lg object-cover
                   border border-gray-200 hover:opacity-90 transition-opacity cursor-zoom-in"
                onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
        </a>
    );
}

function AttachmentCard({ att, isMe }: { att: Attachment; isMe: boolean }) {
    if (!att || !att.name) return null;

    const name = att.name;
    const ext = name.split('.').pop()?.toLowerCase() || '';
    const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext);

    // Ảnh có thumbnailUrl local → preview
    if (isImage && att.thumbnailUrl && isLocalImage(att.thumbnailUrl)) {
        return (
            <div className="mt-2">
                <a href={att.contentUrl || att.thumbnailUrl} target="_blank" rel="noopener noreferrer">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src={att.thumbnailUrl}
                        alt={name}
                        className="max-w-[280px] max-h-[200px] rounded-lg object-cover
                       border border-gray-200 hover:opacity-90 cursor-zoom-in"
                        onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                </a>
                <p className="text-xs text-gray-400 mt-1">{name}</p>
            </div>
        );
    }

    // File card (SharePoint, zip, rar, pdf, office...)
    return (
        <a
            href={att.contentUrl || '#'}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
                'flex items-center gap-3 mt-2 px-3 py-2.5 rounded-xl border',
                'max-w-[280px] transition-all hover:shadow-sm cursor-pointer',
                isMe ? 'bg-blue-400 border-blue-300' : getFileColor(name)
            )}
        >
            {/* Icon */}
            <div className={cn(
                'w-9 h-9 rounded-lg flex items-center justify-center shrink-0',
                isMe ? 'bg-blue-300' : 'bg-white border border-gray-100'
            )}>
                {getFileIcon(name)}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
                <p className={cn(
                    'text-xs font-semibold truncate',
                    isMe ? 'text-white' : 'text-gray-800'
                )}>
                    {name}
                </p>
                <div className="flex items-center gap-1 mt-0.5">
                    {att.isSharePoint && (
                        <span className={cn('text-xs', isMe ? 'text-blue-100' : 'text-gray-400')}>
                            SharePoint
                        </span>
                    )}
                    {ext && (
                        <span className={cn(
                            'text-xs uppercase font-medium',
                            isMe ? 'text-blue-100' : 'text-gray-400'
                        )}>
                            {att.isSharePoint ? '·' : ''} {ext}
                        </span>
                    )}
                </div>
            </div>

            {/* Open */}
            {att.contentUrl ? (
                <ExternalLink size={14} className={cn('shrink-0', isMe ? 'text-blue-100' : 'text-gray-400')} />
            ) : (
                <Paperclip size={14} className={cn('shrink-0', isMe ? 'text-blue-100' : 'text-gray-300')} />
            )}
        </a>
    );
}

// ── Main Component ────────────────────────────────────────────────

export function MessageBubble({ message, isMe = false }: MessageBubbleProps) {
    const isHtml = message.body_content_type === 'html';
    const rawHtml = message.body_content || '';

    const textContent = parseTextContent(rawHtml, message.body_content_type);
    const links = isHtml ? extractLinks(rawHtml) : [];
    const inlineImages = isHtml ? extractImages(rawHtml) : [];

    // Parse attachments
    let attachments: Attachment[] = [];
    try {
        if (message.attachments) {
            const raw = typeof message.attachments === 'string'
                ? JSON.parse(message.attachments)
                : message.attachments;
            attachments = (Array.isArray(raw) ? raw : [raw])
                .filter((a: any) => a != null && typeof a === 'object' && a.name);
        }
    } catch {
        attachments = [];
    }

    const hasContent = textContent || links.length || inlineImages.length || attachments.length;
    if (!hasContent) return null;

    // Lọc links trùng với attachment URLs
    const attachmentUrls = new Set(attachments.map(a => a.contentUrl).filter(Boolean));
    const filteredLinks = links.filter(l => !attachmentUrls.has(l.url));

    return (
        <div className={cn('flex gap-2 mb-3 group', isMe && 'flex-row-reverse')}>
            {/* Avatar */}
            <div className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center',
                'text-xs font-bold shrink-0 mt-1',
                isMe ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'
            )}>
                {message.sender_name?.charAt(0)?.toUpperCase()}
            </div>

            {/* Content */}
            <div className={cn('max-w-[70%]', isMe && 'items-end flex flex-col')}>
                {/* Meta */}
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
                    {message.reply_to_id && (
                        <span className="text-xs text-gray-300" title="Reply">↩</span>
                    )}
                </div>

                {/* Bubble */}
                <div className={cn(
                    'px-3 py-2 rounded-2xl text-sm leading-relaxed',
                    isMe
                        ? 'bg-blue-500 text-white rounded-tr-sm'
                        : 'bg-gray-100 text-gray-800 rounded-tl-sm'
                )}>
                    {/* Text */}
                    {textContent && (
                        <p className="whitespace-pre-wrap break-words">{textContent}</p>
                    )}

                    {/* Inline images (local /media/ hoặc external) */}
                    {inlineImages.map((src, i) => (
                        <ImagePreview key={i} src={src} />
                    ))}

                    {/* Links */}
                    {filteredLinks.length > 0 && (
                        <LinkPreview links={filteredLinks} />
                    )}

                    {/* Attachments */}
                    {attachments.map((att, i) => (
                        <AttachmentCard key={i} att={att} isMe={isMe} />
                    ))}
                </div>
            </div>
        </div>
    );
}