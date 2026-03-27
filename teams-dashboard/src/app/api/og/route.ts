import { NextResponse } from 'next/server';

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const url = searchParams.get('url');
    if (!url) return NextResponse.json({ error: 'No URL' }, { status: 400 });

    try {
        const res = await fetch(url, {
            headers: { 'User-Agent': 'Mozilla/5.0 (compatible; TeamsArchiveBot/1.0)' },
            signal: AbortSignal.timeout(5000)
        });
        const html = await res.text();

        const getMeta = (prop: string) =>
            html.match(new RegExp(`<meta[^>]+property=["']${prop}["'][^>]+content=["']([^"']+)["']`, 'i'))?.[1] ||
            html.match(new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+property=["']${prop}["']`, 'i'))?.[1] ||
            null;

        const getMetaName = (name: string) =>
            html.match(new RegExp(`<meta[^>]+name=["']${name}["'][^>]+content=["']([^"']+)["']`, 'i'))?.[1] ||
            null;

        const title =
            getMeta('og:title') ||
            html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1] ||
            null;

        return NextResponse.json({
            title: title?.trim() || null,
            description: getMeta('og:description') || getMetaName('description') || null,
            image: getMeta('og:image') || null,
            siteName: getMeta('og:site_name') || new URL(url).hostname,
            url
        });
    } catch {
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}