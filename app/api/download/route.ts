import {NextRequest, NextResponse} from 'next/server';
import {isAllowedMediaUrl, sanitizeFilename} from '@/lib/tiktok';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const MAX_REDIRECTS = 2;

async function fetchValidatedMedia(
  initialUrl: string
): Promise<Response | NextResponse> {
  let currentUrl = initialUrl;

  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    if (!isAllowedMediaUrl(currentUrl)) {
      return NextResponse.json(
        {error: 'Unsupported media host'},
        {status: 400}
      );
    }

    const res = await fetch(currentUrl, {
      method: 'GET',
      redirect: 'manual',
      headers: {
        'User-Agent': 'TikFetch/1.0',
        'Referer': 'https://www.tikwm.com/',
      },
      signal: AbortSignal.timeout(25000),
    });

    if (res.status >= 300 && res.status < 400) {
      const location = res.headers.get('location');
      if (!location) {
        return NextResponse.json(
          {error: 'Invalid upstream redirect'},
          {status: 502}
        );
      }
      try {
        currentUrl = new URL(location, currentUrl).toString();
      } catch {
        return NextResponse.json(
          {error: 'Malformed upstream redirect'},
          {status: 502}
        );
      }
      continue;
    }

    return res;
  }

  return NextResponse.json(
    {error: 'Too many upstream redirects'},
    {status: 502}
  );
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  const mediaUrl = req.nextUrl.searchParams.get('url');
  const rawFilename = req.nextUrl.searchParams.get('filename') || 'tiktok_media';
  const mode = req.nextUrl.searchParams.get('mode') === 'inline' ? 'inline' : 'attachment';

  if (!mediaUrl || !isAllowedMediaUrl(mediaUrl)) {
    return NextResponse.json(
      {error: 'Invalid or unsupported media URL'},
      {status: 400}
    );
  }

  try {
    const upstream = await fetchValidatedMedia(mediaUrl);
    if (upstream instanceof NextResponse) {
      return upstream;
    }

    if (!upstream.ok || !upstream.body) {
      return NextResponse.json(
        {error: 'Unable to retrieve media file'},
        {status: 502}
      );
    }

    const contentType =
      upstream.headers.get('content-type') || 'application/octet-stream';
    const contentLength = upstream.headers.get('content-length');
    const safeFilename = sanitizeFilename(rawFilename, 'tiktok_media');

    const headers = new Headers();
    headers.set('Content-Type', contentType);
    headers.set(
      'Content-Disposition',
      `${mode}; filename="${safeFilename}"`
    );
    headers.set('X-Content-Type-Options', 'nosniff');
    if (contentLength) {
      headers.set('Content-Length', contentLength);
    }

    return new NextResponse(upstream.body, {
      status: 200,
      headers,
    });
  } catch {
    return NextResponse.json(
      {error: 'Media download failed'},
      {status: 502}
    );
  }
}
