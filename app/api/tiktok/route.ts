import {NextRequest, NextResponse} from 'next/server';
import {
  resolveTikwmMediaUrl,
  type TikTokExtractResult,
  validateTikTokUrl,
} from '@/lib/tiktok';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

interface TikWmApiResponse {
  code?: number;
  msg?: string;
  data?: {
    author?: {
      unique_id?: string;
    };
    play_count?: number;
    digg_count?: number;
    comment_count?: number;
    cover?: string;
    hdplay?: string;
    play?: string;
    wmplay?: string;
    music?: string;
  };
}

function jsonResponse(payload: unknown, status: number): NextResponse {
  return new NextResponse(JSON.stringify(payload, null, 2), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  });
}

async function extractFromTikWm(rawLink: string | null): Promise<NextResponse> {
  if (rawLink === null || rawLink.trim() === '') {
    return jsonResponse({error: 'Missing link parameter'}, 400);
  }

  const validation = validateTikTokUrl(rawLink);
  if (!validation.valid || !validation.normalizedUrl) {
    return jsonResponse({error: validation.error || 'Invalid TikTok URL'}, 400);
  }

  try {
    const formBody = new URLSearchParams({
      url: validation.normalizedUrl,
      hd: '1',
    });

    const upstreamRes = await fetch('https://www.tikwm.com/api/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        'Accept': 'application/json',
        'Referer': 'https://www.tikwm.com/',
        'Origin': 'https://www.tikwm.com',
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
      },
      body: formBody.toString(),
      signal: AbortSignal.timeout(12000),
    });

    if (!upstreamRes.ok) {
      return jsonResponse({error: 'Upstream media service unavailable'}, 502);
    }

    const parsed = (await upstreamRes.json()) as TikWmApiResponse;
    if (!parsed || !parsed.data) {
      return jsonResponse({error: 'Invalid TikTok URL'}, 422);
    }

    const d = parsed.data;
    const result: TikTokExtractResult = {
      username: d.author?.unique_id || 'unknown',
      views: Number(d.play_count ?? 0),
      likes: Number(d.digg_count ?? 0),
      comments: Number(d.comment_count ?? 0),
      thumbnail: resolveTikwmMediaUrl(d.cover),
      downloads: {
        video_hd: resolveTikwmMediaUrl(d.hdplay || d.play),
        video_sd: resolveTikwmMediaUrl(d.wmplay || d.play),
        music: resolveTikwmMediaUrl(d.music),
      },
    };

    return jsonResponse(result, 200);
  } catch (err) {
    const isTimeout =
      err instanceof Error &&
      (err.name === 'TimeoutError' || err.name === 'AbortError');
    return jsonResponse(
      {
        error: isTimeout
          ? 'Upstream request timed out'
          : 'Failed to reach upstream extractor',
      },
      504
    );
  }
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  const link = req.nextUrl.searchParams.get('link');
  return extractFromTikWm(link);
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonResponse({error: 'Invalid JSON request body'}, 400);
  }

  const link =
    typeof body === 'object' &&
    body !== null &&
    'link' in body &&
    typeof (body as {link?: unknown}).link === 'string'
      ? (body as {link: string}).link
      : null;

  return extractFromTikWm(link);
}
