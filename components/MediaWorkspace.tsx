'use client';

import React, {useState} from 'react';
import {motion, AnimatePresence} from 'motion/react';
import {
  AlertCircle,
  Check,
  Copy,
  Download,
  Film,
  Image as ImageIcon,
  Music,
  Play,
  Terminal,
  Video,
} from 'lucide-react';
import {
  formatCompactNumber,
  sanitizeFilename,
  type TikTokExtractResult,
} from '@/lib/tiktok';

interface MediaWorkspaceProps {
  result: TikTokExtractResult | null;
  sourceUrl: string;
  isLoading: boolean;
  error: string | null;
  httpStatus: number | null;
  onTrySample: () => void;
}

type InspectorTab = 'json' | 'curl' | 'php';

const ORIGINAL_PHP_SNIPPET = `<?php
// Check if 'link' parameter is missing
if (!isset($_GET['link'])) {
  header('Content-Type: application/json');
  echo json_encode(['error' => 'Missing link parameter']);
  exit();
}
$link = $_GET['link'];
$curl = curl_init();
curl_setopt_array($curl, [
  CURLOPT_URL => 'https://www.tikwm.com/api/',
  CURLOPT_RETURNTRANSFER => true,
  CURLOPT_POST => true,
  CURLOPT_POSTFIELDS => http_build_query(['url' => $link, 'hd' => 1]),
]);
$response = curl_exec($curl);
curl_close($curl);
$data = json_decode($response, true);
if (empty($data['data'])) {
  echo json_encode(['error' => 'Invalid TikTok URL']);
  exit();
}
$result = [
  'username' => $data['data']['author']['unique_id'],
  'views' => $data['data']['play_count'],
  'likes' => $data['data']['digg_count'],
  'comments' => $data['data']['comment_count'],
  'thumbnail' => 'https://www.tikwm.com'.$data['data']['cover'],
  'downloads' => [
    'video_hd' => 'https://www.tikwm.com'.$data['data']['hdplay'],
    'video_sd' => 'https://www.tikwm.com'.$data['data']['wmplay'],
    'music' => 'https://www.tikwm.com'.$data['data']['music']
  ]
];
header('Content-Type: application/json');
echo json_encode($result, JSON_PRETTY_PRINT);`;

export default function MediaWorkspace({
  result,
  sourceUrl,
  isLoading,
  error,
  httpStatus,
  onTrySample,
}: MediaWorkspaceProps) {
  const [activeTab, setActiveTab] = useState<InspectorTab>('json');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState<'video' | 'cover'>('video');
  const [imgFailed, setImgFailed] = useState(false);

  const handleCopy = async (key: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => {
        setCopiedKey((prev) => (prev === key ? null : prev));
      }, 1800);
    } catch {
      // Clipboard blocked in restricted context
    }
  };

  const buildDownloadHref = (mediaUrl: string, filename: string, inline = false) => {
    const params = new URLSearchParams({
      url: mediaUrl,
      filename,
      mode: inline ? 'inline' : 'download',
    });
    return `/api/download?${params.toString()}`;
  };

  const encodedLink = encodeURIComponent(
    sourceUrl || 'https://www.tiktok.com/@tiktok/video/7106594312292453675'
  );
  const origin =
    typeof window !== 'undefined' ? window.location.origin : 'https://your-app.example';

  const curlCode = `curl -s "${origin}/api/tiktok?link=${encodedLink}"`;
  const jsonCode = result ? JSON.stringify(result, null, 2) : '';

  const inspectorContent =
    activeTab === 'json'
      ? jsonCode
      : activeTab === 'curl'
        ? curlCode
        : ORIGINAL_PHP_SNIPPET;

  if (isLoading) {
    return (
      <section id="inspector" className="mx-auto max-w-6xl px-6 py-10">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          <div className="lg:col-span-5 rounded-xl border border-slate-200 bg-white p-6">
            <div className="aspect-[9/12] w-full animate-pulse rounded-lg bg-slate-100" />
            <div className="mt-5 h-5 w-40 animate-pulse rounded bg-slate-100" />
            <div className="mt-4 grid grid-cols-3 gap-4 border-t border-slate-100 pt-4">
              <div className="h-10 animate-pulse rounded bg-slate-100" />
              <div className="h-10 animate-pulse rounded bg-slate-100" />
              <div className="h-10 animate-pulse rounded bg-slate-100" />
            </div>
          </div>
          <div className="lg:col-span-7 flex flex-col gap-6">
            <div className="rounded-xl border border-slate-200 bg-white p-6">
              <div className="h-5 w-44 animate-pulse rounded bg-slate-100" />
              <div className="mt-5 space-y-3">
                <div className="h-14 animate-pulse rounded-lg bg-slate-100" />
                <div className="h-14 animate-pulse rounded-lg bg-slate-100" />
                <div className="h-14 animate-pulse rounded-lg bg-slate-100" />
              </div>
            </div>
            <div className="h-64 animate-pulse rounded-xl border border-slate-200 bg-white" />
          </div>
        </div>
      </section>
    );
  }

  if (error && !result) {
    return (
      <section id="inspector" className="mx-auto max-w-6xl px-6 py-10">
        <div
          role="alert"
          className="flex flex-col items-start justify-between gap-4 rounded-xl border border-red-200 bg-white p-6 sm:flex-row sm:items-center"
        >
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" aria-hidden="true" />
            <div>
              <h2 className="font-display text-base font-semibold text-slate-900">
                Extraction Failed {httpStatus ? `(HTTP ${httpStatus})` : ''}
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                {error}. Verify the TikTok post is public and uses a valid TikTok URL.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onTrySample}
            className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-900 hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            Test Sample Link
          </button>
        </div>
      </section>
    );
  }

  if (!result) {
    return (
      <section id="inspector" className="mx-auto max-w-6xl px-6 py-10">
        <div className="grid grid-cols-1 items-stretch gap-8 rounded-xl border border-slate-200 bg-white p-8 lg:grid-cols-12">
          <div className="lg:col-span-7 flex flex-col justify-center">
            <p className="text-xs font-medium text-slate-500">Ready to Extract</p>
            <h2 className="mt-2 font-display text-2xl font-bold tracking-tight text-slate-900">
              No TikTok link loaded yet
            </h2>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-slate-600">
              Enter any public TikTok video link above to fetch the creator handle, engagement counters, thumbnail cover, direct HD/SD video streams, and original MP3 audio.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={onTrySample}
                className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Play className="h-4 w-4" aria-hidden="true" />
                Load Sample TikTok URL
              </button>
              <a
                href="#api-docs"
                className="inline-flex items-center rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0"
              >
                Read API Schema
              </a>
            </div>
          </div>

          <div className="lg:col-span-5 border-t border-slate-200 pt-6 lg:border-t-0 lg:border-l lg:pt-0 lg:pl-8 flex flex-col justify-center">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Extracted Payload Fields
            </h3>
            <dl className="mt-4 divide-y divide-slate-100 text-sm">
              <div className="flex items-center justify-between py-2.5">
                <dt className="font-mono text-xs text-slate-700">username</dt>
                <dd className="text-xs text-slate-500">Author unique handle</dd>
              </div>
              <div className="flex items-center justify-between py-2.5">
                <dt className="font-mono text-xs text-slate-700">views · likes · comments</dt>
                <dd className="text-xs text-slate-500">Numeric engagement counts</dd>
              </div>
              <div className="flex items-center justify-between py-2.5">
                <dt className="font-mono text-xs text-slate-700">downloads.video_hd</dt>
                <dd className="text-xs text-slate-500">Watermark-free MP4 stream</dd>
              </div>
              <div className="flex items-center justify-between py-2.5">
                <dt className="font-mono text-xs text-slate-700">downloads.video_sd</dt>
                <dd className="text-xs text-slate-500">Standard watermarked MP4</dd>
              </div>
              <div className="flex items-center justify-between py-2.5">
                <dt className="font-mono text-xs text-slate-700">downloads.music</dt>
                <dd className="text-xs text-slate-500">Extracted MP3 audio track</dd>
              </div>
            </dl>
          </div>
        </div>
      </section>
    );
  }

  const safeUser = sanitizeFilename(result.username, 'tiktok');
  const thumbnailProxyUrl = result.thumbnail
    ? buildDownloadHref(result.thumbnail, `${safeUser}_cover.jpg`, true)
    : '';
  const videoPreviewProxyUrl = result.downloads.video_hd
    ? buildDownloadHref(result.downloads.video_hd, `${safeUser}_preview.mp4`, true)
    : '';

  const downloadItems = [
    {
      id: 'video_hd',
      label: 'HD Video (No Watermark)',
      format: 'MP4 · High Definition',
      url: result.downloads.video_hd,
      filename: `${safeUser}_hd.mp4`,
      icon: Video,
      primary: true,
    },
    {
      id: 'video_sd',
      label: 'SD Video (Standard)',
      format: 'MP4 · Watermarked',
      url: result.downloads.video_sd,
      filename: `${safeUser}_sd.mp4`,
      icon: Film,
      primary: false,
    },
    {
      id: 'music',
      label: 'Original Audio Track',
      format: 'MP3 · Audio Stream',
      url: result.downloads.music,
      filename: `${safeUser}_audio.mp3`,
      icon: Music,
      primary: false,
    },
  ];

  return (
    <section id="inspector" className="mx-auto max-w-6xl px-6 py-10">
      <AnimatePresence mode="wait">
        <motion.div
          key={`${result.username}-${result.views}`}
          initial={{opacity: 0, y: 8}}
          animate={{opacity: 1, y: 0}}
          exit={{opacity: 0, y: -4}}
          transition={{duration: 0.18, ease: [0.16, 1, 0.3, 1]}}
          className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12"
        >
          {/* Left Column: Media Preview & Engagement Metrics */}
          <div className="lg:col-span-5 rounded-xl border border-slate-200 bg-white p-6">
            <div className="flex items-center justify-between gap-3 pb-4">
              <div className="min-w-0">
                <p className="text-xs font-medium text-slate-500">Creator</p>
                <p className="truncate font-display text-lg font-bold text-slate-900">
                  @{result.username}
                </p>
              </div>
              <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-1 shrink-0">
                <button
                  type="button"
                  onClick={() => setPreviewMode('video')}
                  disabled={!videoPreviewProxyUrl}
                  className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors disabled:opacity-40 whitespace-nowrap shrink-0 cursor-pointer ${
                    previewMode === 'video'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Play className="h-3.5 w-3.5" aria-hidden="true" />
                  Play
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewMode('cover')}
                  className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    previewMode === 'cover'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <ImageIcon className="h-3.5 w-3.5" aria-hidden="true" />
                  Cover
                </button>
              </div>
            </div>

            <div className="relative aspect-[9/12] w-full overflow-hidden rounded-lg border border-slate-200 bg-slate-950">
              {previewMode === 'video' && videoPreviewProxyUrl ? (
                <video
                  key={videoPreviewProxyUrl}
                  src={videoPreviewProxyUrl}
                  poster={thumbnailProxyUrl || undefined}
                  controls
                  playsInline
                  className="h-full w-full object-contain bg-black"
                />
              ) : thumbnailProxyUrl && !imgFailed ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={thumbnailProxyUrl}
                  alt={`TikTok cover thumbnail for @${result.username}`}
                  referrerPolicy="no-referrer"
                  onError={() => setImgFailed(true)}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-slate-800 to-slate-950 p-6 text-center text-slate-300">
                  <Film className="h-10 w-10 text-slate-400" aria-hidden="true" />
                  <p className="mt-3 text-sm font-medium text-white">
                    @{result.username}
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    Thumbnail unavailable in preview
                  </p>
                </div>
              )}
            </div>

            {/* Clean unboxed tabular engagement strip */}
            <dl className="mt-5 grid grid-cols-3 divide-x divide-slate-200 border-t border-slate-200 pt-5">
              <div className="pr-3">
                <dt className="text-xs font-medium text-slate-500">Views</dt>
                <dd className="mt-1 font-mono text-lg font-semibold text-slate-900 tabular-nums">
                  {formatCompactNumber(result.views)}
                </dd>
              </div>
              <div className="px-3">
                <dt className="text-xs font-medium text-slate-500">Likes</dt>
                <dd className="mt-1 font-mono text-lg font-semibold text-slate-900 tabular-nums">
                  {formatCompactNumber(result.likes)}
                </dd>
              </div>
              <div className="pl-3">
                <dt className="text-xs font-medium text-slate-500">Comments</dt>
                <dd className="mt-1 font-mono text-lg font-semibold text-slate-900 tabular-nums">
                  {formatCompactNumber(result.comments)}
                </dd>
              </div>
            </dl>
          </div>

          {/* Right Column: Downloads & Live JSON Inspector */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            <div className="rounded-xl border border-slate-200 bg-white p-6">
              <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-4">
                <div>
                  <h2 className="font-display text-lg font-bold text-slate-900">
                    Direct Media Downloads
                  </h2>
                  <p className="mt-0.5 text-xs text-slate-500">
                    Streams resolved from the extracted TikTok post
                  </p>
                </div>
                <span className="font-mono text-xs font-medium text-emerald-700">
                  HTTP {httpStatus || 200} OK
                </span>
              </div>

              <ul className="divide-y divide-slate-100">
                {downloadItems.map((item) => {
                  const Icon = item.icon;
                  const available = Boolean(item.url);
                  return (
                    <li
                      key={item.id}
                      className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-700">
                          <Icon className="h-4 w-4" aria-hidden="true" />
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-slate-900">
                            {item.label}
                          </p>
                          <p className="text-xs text-slate-500">{item.format}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          disabled={!available}
                          onClick={() => handleCopy(item.id, item.url)}
                          className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                        >
                          {copiedKey === item.id ? (
                            <>
                              <Check className="h-3.5 w-3.5 text-emerald-600" aria-hidden="true" />
                              Copied
                            </>
                          ) : (
                            <>
                              <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                              Copy URL
                            </>
                          )}
                        </button>

                        {available ? (
                          <a
                            href={buildDownloadHref(item.url, item.filename, false)}
                            download={item.filename}
                            className={`inline-flex h-9 items-center gap-1.5 rounded-lg px-4 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                              item.primary
                                ? 'bg-rose-600 text-white hover:bg-rose-700'
                                : 'bg-slate-900 text-white hover:bg-slate-800'
                            }`}
                          >
                            <Download className="h-3.5 w-3.5" aria-hidden="true" />
                            Download
                          </a>
                        ) : (
                          <span className="inline-flex h-9 items-center rounded-lg bg-slate-100 px-4 text-xs font-medium text-slate-400">
                            Unavailable
                          </span>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>

            {/* Live JSON / cURL / PHP Inspector */}
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-6 py-3.5">
                <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-1">
                  <button
                    type="button"
                    onClick={() => setActiveTab('json')}
                    className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      activeTab === 'json'
                        ? 'bg-white text-slate-900 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    JSON Output
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('curl')}
                    className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      activeTab === 'curl'
                        ? 'bg-white text-slate-900 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    cURL Request
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('php')}
                    className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      activeTab === 'php'
                        ? 'bg-white text-slate-900 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Original PHP
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => handleCopy('inspector', inspectorContent)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  {copiedKey === 'inspector' ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-emerald-600" aria-hidden="true" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Terminal className="h-3.5 w-3.5" aria-hidden="true" />
                      Copy Snippet
                    </>
                  )}
                </button>
              </div>

              <div className="max-h-80 overflow-auto bg-slate-950 p-5">
                <pre className="font-mono text-xs leading-relaxed text-slate-200">
                  <code>{inspectorContent}</code>
                </pre>
              </div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </section>
  );
}
