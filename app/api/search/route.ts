import {GoogleGenAI} from '@google/genai';
import {NextRequest, NextResponse} from 'next/server';
import {
  resolveTikwmMediaUrl,
  type TikTokSearchItem,
  type TikTokSearchResponse,
  validateTikTokUrl,
} from '@/lib/tiktok';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

interface TikWmVideoData {
  id?: string;
  video_id?: string;
  title?: string;
  author?: {
    unique_id?: string;
    nickname?: string;
  };
  play_count?: number;
  digg_count?: number;
  comment_count?: number;
  cover?: string;
  origin_cover?: string;
  hdplay?: string;
  play?: string;
  wmplay?: string;
  music?: string;
}

interface TikWmSingleResponse {
  code?: number;
  data?: TikWmVideoData;
}

interface TikWmChallengeSearchResponse {
  code?: number;
  data?: {
    challenge_list?: Array<{
      id?: string;
      cha_name?: string;
    }>;
  };
}

interface TikWmChallengePostsResponse {
  code?: number;
  data?: {
    videos?: TikWmVideoData[];
  };
}

interface RapidApiSearchResponse {
  code?: number;
  data?: {
    videos?: TikWmVideoData[];
  };
}

const TIKWM_HEADERS = {
  'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
  'Accept': 'application/json',
  'Referer': 'https://www.tikwm.com/',
  'Origin': 'https://www.tikwm.com',
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
};

function jsonResponse(payload: unknown, status: number): NextResponse {
  return new NextResponse(JSON.stringify(payload, null, 2), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  });
}

function mapVideoToSearchItem(
  video: TikWmVideoData,
  fallbackUrl?: string
): TikTokSearchItem {
  const username = video.author?.unique_id || 'unknown';
  const id = video.video_id || video.id || String(Date.now());
  const canonicalUrl =
    fallbackUrl || `https://www.tiktok.com/@${username}/video/${id}`;

  return {
    id,
    url: canonicalUrl,
    title: (video.title || '').trim() || `TikTok video by @${username}`,
    username,
    nickname: video.author?.nickname || undefined,
    views: Number(video.play_count ?? 0),
    likes: Number(video.digg_count ?? 0),
    comments: Number(video.comment_count ?? 0),
    thumbnail: resolveTikwmMediaUrl(video.cover || video.origin_cover),
    downloads: {
      video_hd: resolveTikwmMediaUrl(video.hdplay || video.play),
      video_sd: resolveTikwmMediaUrl(video.wmplay || video.play),
      music: resolveTikwmMediaUrl(video.music),
    },
  };
}

function buildSearchCandidates(rawQuery: string): string[] {
  const cleaned = rawQuery.replace(/^[@#]+/, '').trim();
  const candidates: string[] = [];
  if (cleaned) candidates.push(cleaned);

  const compact = cleaned.replace(/\s+/g, '');
  if (compact && compact !== cleaned) {
    candidates.push(compact);
  }

  const words = cleaned
    .split(/\s+/)
    .map((w) => w.trim())
    .filter((w) => w.length >= 2);
  if (words.length > 1) {
    const longestFirst = [...words].sort((a, b) => b.length - a.length);
    for (const w of longestFirst) {
      if (!candidates.includes(w)) {
        candidates.push(w);
      }
    }
  }

  return candidates.slice(0, 4);
}

async function searchChallengeId(keyword: string): Promise<string | null> {
  try {
    const res = await fetch('https://www.tikwm.com/api/challenge/search', {
      method: 'POST',
      headers: TIKWM_HEADERS,
      body: new URLSearchParams({keywords: keyword, count: '3'}).toString(),
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as TikWmChallengeSearchResponse;
    const first = data?.data?.challenge_list?.[0];
    return first?.id || null;
  } catch {
    return null;
  }
}

async function searchViaTikWmChallenge(
  query: string,
  count: number
): Promise<TikTokSearchItem[]> {
  const candidates = buildSearchCandidates(query);
  let challengeId: string | null = null;

  for (const candidate of candidates) {
    challengeId = await searchChallengeId(candidate);
    if (challengeId) break;
  }

  if (!challengeId) {
    return [];
  }

  const postsRes = await fetch('https://www.tikwm.com/api/challenge/posts', {
    method: 'POST',
    headers: TIKWM_HEADERS,
    body: new URLSearchParams({
      challenge_id: challengeId,
      count: String(count),
      hd: '1',
    }).toString(),
    signal: AbortSignal.timeout(10000),
  });

  if (!postsRes.ok) {
    return [];
  }

  const postsData = (await postsRes.json()) as TikWmChallengePostsResponse;
  const videos = postsData?.data?.videos;
  if (!Array.isArray(videos)) {
    return [];
  }

  return videos.slice(0, count).map((v) => mapVideoToSearchItem(v));
}

function extractCandidateTikTokUrls(text: string): string[] {
  const regex =
    /https?:\/\/(?:www\.|m\.|vm\.|vt\.)?tiktok\.com\/(?:@[\w.-]+\/video\/\d+|t\/[\w-]+|[\w-]+)\/?/gi;
  const matches = text.match(regex) || [];
  const unique = new Set<string>();

  for (const raw of matches) {
    const cleaned = raw.replace(/[),.;'"`>\]]+$/, '');
    const checked = validateTikTokUrl(cleaned);
    if (checked.valid && checked.normalizedUrl) {
      if (
        /\/video\/\d+/.test(checked.normalizedUrl) ||
        /(?:vm|vt)\.tiktok\.com/.test(checked.normalizedUrl) ||
        /\/t\//.test(checked.normalizedUrl)
      ) {
        unique.add(checked.normalizedUrl);
      }
    }
  }

  return Array.from(unique);
}

async function hydrateViaTikWm(
  videoUrl: string
): Promise<TikTokSearchItem | null> {
  try {
    const body = new URLSearchParams({url: videoUrl, hd: '1'});
    const res = await fetch('https://www.tikwm.com/api/', {
      method: 'POST',
      headers: TIKWM_HEADERS,
      body: body.toString(),
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) return null;
    const parsed = (await res.json()) as TikWmSingleResponse;
    if (!parsed?.data) return null;
    return mapVideoToSearchItem(parsed.data, videoUrl);
  } catch {
    return null;
  }
}

async function searchViaRapidApi(
  query: string,
  count: number,
  apiKey: string
): Promise<TikTokSearchItem[]> {
  const endpoint = new URL('https://tiktok-scraper7.p.rapidapi.com/feed/search');
  endpoint.searchParams.set('keywords', query);
  endpoint.searchParams.set('count', String(count));
  endpoint.searchParams.set('cursor', '0');
  endpoint.searchParams.set('HD', '1');

  const res = await fetch(endpoint.toString(), {
    method: 'GET',
    headers: {
      'x-rapidapi-key': apiKey,
      'x-rapidapi-host': 'tiktok-scraper7.p.rapidapi.com',
    },
    signal: AbortSignal.timeout(12000),
  });

  if (!res.ok) {
    throw new Error(`RapidAPI request failed (${res.status})`);
  }

  const data = (await res.json()) as RapidApiSearchResponse;
  const videos = data?.data?.videos;
  if (!Array.isArray(videos)) return [];

  return videos.slice(0, count).map((v) => mapVideoToSearchItem(v));
}

async function searchViaGeminiGrounding(
  query: string,
  count: number
): Promise<TikTokSearchItem[]> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return [];

  const ai = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });

  const prompt = `Search for real public TikTok video pages matching the query: "${query}".
Use Google Search with site:tiktok.com to find up to ${Math.min(count + 4, 10)} direct TikTok video URLs formatted like https://www.tiktok.com/@username/video/1234567890123456789.
List each discovered TikTok video URL clearly on its own line.`;

  const response = await ai.models.generateContent({
    model: 'gemini-4-hydrogen',
    contents: prompt,
    config: {
      tools: [{googleSearch: {}}],
    },
  });

  const candidateTexts: string[] = [];
  if (response.text) {
    candidateTexts.push(response.text);
  }

  const chunks =
    response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
  for (const chunk of chunks) {
    if (chunk.web?.uri) candidateTexts.push(chunk.web.uri);
    if (chunk.web?.title) candidateTexts.push(chunk.web.title);
  }

  const discoveredUrls = extractCandidateTikTokUrls(
    candidateTexts.join('\n')
  ).slice(0, Math.min(count + 2, 10));

  if (discoveredUrls.length === 0) {
    return [];
  }

  const hydrated = await Promise.all(
    discoveredUrls.map((url) => hydrateViaTikWm(url))
  );

  return hydrated
    .filter((item): item is TikTokSearchItem => item !== null)
    .slice(0, count);
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  const rawQuery = req.nextUrl.searchParams.get('q') || '';
  const query = rawQuery.trim().slice(0, 120);

  if (!query) {
    return jsonResponse({error: 'Missing search query parameter (q)'}, 400);
  }

  const rawCount = Number(req.nextUrl.searchParams.get('count') || '6');
  const count = Number.isFinite(rawCount)
    ? Math.max(1, Math.min(10, Math.floor(rawCount)))
    : 6;

  try {
    const rapidApiKey = process.env.RAPIDAPI_KEY?.trim();
    let results: TikTokSearchItem[] = [];

    if (rapidApiKey) {
      results = await searchViaRapidApi(query, count, rapidApiKey);
    } else {
      results = await searchViaTikWmChallenge(query, count);

      if (results.length === 0 && process.env.GEMINI_API_KEY) {
        try {
          results = await searchViaGeminiGrounding(query, count);
        } catch {
          // Gracefully keep empty results if optional Gemini grounding hits rate limits
          results = [];
        }
      }
    }

    const payload: TikTokSearchResponse = {
      query,
      count: results.length,
      results,
    };

    return jsonResponse(payload, 200);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : 'Search request failed';
    return jsonResponse({error: message}, 502);
  }
}
