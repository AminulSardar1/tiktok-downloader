'use client';

import React, {useState} from 'react';
import {AlertCircle, ArrowUpRight, Download, Film, Search} from 'lucide-react';
import {
  formatCompactNumber,
  sanitizeFilename,
  type TikTokSearchItem,
} from '@/lib/tiktok';

interface SearchResultsProps {
  query: string;
  results: TikTokSearchItem[];
  isLoading: boolean;
  error: string | null;
  onSelectVideo: (item: TikTokSearchItem) => void;
  onQuickSearch: (keyword: string) => void;
}

function SearchCard({
  item,
  onSelectVideo,
}: {
  item: TikTokSearchItem;
  onSelectVideo: (item: TikTokSearchItem) => void;
}) {
  const [imgFailed, setImgFailed] = useState(false);
  const safeUser = sanitizeFilename(item.username, 'tiktok');
  const thumbnailProxyUrl = item.thumbnail
    ? `/api/download?${new URLSearchParams({
        url: item.thumbnail,
        filename: `${safeUser}_cover.jpg`,
        mode: 'inline',
      }).toString()}`
    : '';
  const hdDownloadHref = item.downloads.video_hd
    ? `/api/download?${new URLSearchParams({
        url: item.downloads.video_hd,
        filename: `${safeUser}_hd.mp4`,
        mode: 'download',
      }).toString()}`
    : '';

  return (
    <article className="flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white">
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-950">
        {thumbnailProxyUrl && !imgFailed ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={thumbnailProxyUrl}
            alt={`TikTok video cover by @${item.username}`}
            referrerPolicy="no-referrer"
            onError={() => setImgFailed(true)}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-slate-800 to-slate-950 p-4 text-slate-300">
            <Film className="h-7 w-7 text-slate-400" aria-hidden="true" />
            <span className="mt-2 text-xs font-medium text-white">
              @{item.username}
            </span>
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col justify-between p-5">
        <div>
          <p className="text-xs font-semibold text-slate-900">
            @{item.username}
          </p>
          <p className="mt-1.5 line-clamp-2 text-sm leading-snug text-slate-600">
            {item.title}
          </p>
        </div>

        <div className="mt-4">
          <div className="flex items-center gap-2 border-t border-slate-100 pt-3 text-xs text-slate-500 font-mono tabular-nums">
            <span>{formatCompactNumber(item.views)} views</span>
            <span aria-hidden="true">·</span>
            <span>{formatCompactNumber(item.likes)} likes</span>
            <span aria-hidden="true">·</span>
            <span>{formatCompactNumber(item.comments)} comments</span>
          </div>

          <div className="mt-4 flex items-center gap-2">
            <button
              type="button"
              onClick={() => onSelectVideo(item)}
              className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-lg bg-slate-900 px-3 text-xs font-semibold text-white hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Inspect &amp; Media
              <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
            </button>

            {hdDownloadHref && (
              <a
                href={hdDownloadHref}
                download={`${safeUser}_hd.mp4`}
                aria-label={`Download HD video by @${item.username}`}
                className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0"
              >
                <Download className="h-3.5 w-3.5" aria-hidden="true" />
                HD
              </a>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}

export default function SearchResults({
  query,
  results,
  isLoading,
  error,
  onSelectVideo,
  onQuickSearch,
}: SearchResultsProps) {
  if (isLoading) {
    return (
      <section id="search-results" className="mx-auto max-w-6xl px-6 pt-10">
        <div className="mb-5 flex items-center justify-between">
          <div className="h-5 w-48 animate-pulse rounded bg-slate-200" />
          <div className="h-4 w-24 animate-pulse rounded bg-slate-200" />
        </div>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({length: 6}).map((_, i) => (
            <div
              key={i}
              className="overflow-hidden rounded-xl border border-slate-200 bg-white"
            >
              <div className="aspect-[4/3] w-full animate-pulse bg-slate-100" />
              <div className="p-5 space-y-3">
                <div className="h-4 w-28 animate-pulse rounded bg-slate-100" />
                <div className="h-8 w-full animate-pulse rounded bg-slate-100" />
                <div className="h-9 w-full animate-pulse rounded bg-slate-100" />
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section id="search-results" className="mx-auto max-w-6xl px-6 pt-10">
        <div
          role="alert"
          className="flex items-start gap-3 rounded-xl border border-red-200 bg-white p-6"
        >
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" aria-hidden="true" />
          <div>
            <h2 className="font-display text-base font-semibold text-slate-900">
              Search Unavailable
            </h2>
            <p className="mt-1 text-sm text-slate-600">{error}</p>
          </div>
        </div>
      </section>
    );
  }

  if (!query) {
    return (
      <section id="search-results" className="mx-auto max-w-6xl px-6 pt-10">
        <div className="flex flex-col items-start justify-between gap-4 rounded-xl border border-slate-200 bg-white p-6 sm:flex-row sm:items-center">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-700">
              <Search className="h-4 w-4" aria-hidden="true" />
            </div>
            <div>
              <h2 className="font-display text-base font-bold text-slate-900">
                Search Public TikTok Videos by Keyword
              </h2>
              <p className="mt-1 text-xs text-slate-600">
                Enter any topic, creator handle, or hashtag above to find public videos and extract their HD/SD/MP3 links.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => onQuickSearch('minecraft frogs')}
              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer whitespace-nowrap"
            >
              minecraft frogs
            </button>
            <button
              type="button"
              onClick={() => onQuickSearch('street food')}
              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer whitespace-nowrap"
            >
              street food
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="search-results" className="mx-auto max-w-6xl px-6 pt-10">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="font-display text-lg font-bold text-slate-900">
            Search Results for &ldquo;{query}&rdquo;
          </h2>
          <p className="mt-0.5 text-xs text-slate-500">
            <span className="font-mono tabular-nums">{results.length}</span>{' '}
            {results.length === 1 ? 'video' : 'videos'} resolved with direct media streams
          </p>
        </div>
        <span className="font-mono text-xs text-slate-500">
          GET /api/search?q={encodeURIComponent(query)}
        </span>
      </div>

      {results.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-10 text-center">
          <p className="text-sm font-medium text-slate-900">
            No playable TikTok videos matched &ldquo;{query}&rdquo;
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Try a broader English keyword or a specific @username.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {results.map((item) => (
            <SearchCard
              key={item.id + item.url}
              item={item}
              onSelectVideo={onSelectVideo}
            />
          ))}
        </div>
      )}
    </section>
  );
}
