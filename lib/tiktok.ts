export interface TikTokDownloads {
  video_hd: string;
  video_sd: string;
  music: string;
}

export interface TikTokExtractResult {
  username: string;
  views: number;
  likes: number;
  comments: number;
  thumbnail: string;
  downloads: TikTokDownloads;
}

export interface HistoryEntry {
  id: string;
  sourceUrl: string;
  extractedAt: string;
  data: TikTokExtractResult;
}

export interface TikTokSearchItem extends TikTokExtractResult {
  id: string;
  url: string;
  title: string;
  nickname?: string;
}

export interface TikTokSearchResponse {
  query: string;
  count: number;
  results: TikTokSearchItem[];
}

const ALLOWED_TIKTOK_HOSTS = new Set([
  'tiktok.com',
  'www.tiktok.com',
  'm.tiktok.com',
  'vm.tiktok.com',
  'vt.tiktok.com',
  'v.tiktok.com',
]);

const ALLOWED_MEDIA_HOST_SUFFIXES = [
  'tikwm.com',
  'tiktokcdn.com',
  'tiktokcdn-us.com',
  'tiktokcdn-eu.com',
  'tiktokv.com',
  'tiktok.com',
  'byteoversea.com',
  'ibytedtos.com',
  'muscdn.com',
  'musical.ly',
];

function isIpLiteral(hostname: string): boolean {
  // Reject IPv4 literals and bracketed IPv6 literals
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(hostname)) return true;
  if (hostname.includes(':') || hostname.startsWith('[')) return true;
  return false;
}

export function validateTikTokUrl(rawInput: string): {
  valid: boolean;
  normalizedUrl?: string;
  error?: string;
} {
  const trimmed = rawInput.trim();
  if (!trimmed) {
    return {valid: false, error: 'Missing link parameter'};
  }

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return {valid: false, error: 'Invalid TikTok URL'};
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return {valid: false, error: 'Invalid TikTok URL'};
  }

  if (parsed.username || parsed.password) {
    return {valid: false, error: 'Invalid TikTok URL'};
  }

  const host = parsed.hostname.toLowerCase();
  if (isIpLiteral(host) || host === 'localhost') {
    return {valid: false, error: 'Invalid TikTok URL'};
  }

  const isAllowed =
    ALLOWED_TIKTOK_HOSTS.has(host) || host.endsWith('.tiktok.com');
  if (!isAllowed) {
    return {valid: false, error: 'Invalid TikTok URL'};
  }

  return {valid: true, normalizedUrl: parsed.toString()};
}

export function isAllowedMediaUrl(rawUrl: string): boolean {
  if (!rawUrl || typeof rawUrl !== 'string') return false;
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    return false;
  }

  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
    return false;
  }

  if (parsed.username || parsed.password) {
    return false;
  }

  const host = parsed.hostname.toLowerCase();
  if (
    !host ||
    host === 'localhost' ||
    host.endsWith('.local') ||
    host.endsWith('.internal') ||
    isIpLiteral(host)
  ) {
    return false;
  }

  return ALLOWED_MEDIA_HOST_SUFFIXES.some(
    (suffix) => host === suffix || host.endsWith(`.${suffix}`)
  );
}

export function resolveTikwmMediaUrl(rawPath: unknown): string {
  if (typeof rawPath !== 'string') return '';
  const trimmed = rawPath.trim();
  if (!trimmed) return '';
  if (trimmed.startsWith('https://') || trimmed.startsWith('http://')) {
    return trimmed;
  }
  const normalizedPath = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  return `https://www.tikwm.com${normalizedPath}`;
}

export function sanitizeFilename(name: string, fallback: string): string {
  const cleaned = name
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/_+/g, '_')
    .slice(0, 80);
  return cleaned || fallback;
}

export function formatCompactNumber(value: number): string {
  if (!Number.isFinite(value)) return '0';
  return new Intl.NumberFormat('en-US').format(value);
}
