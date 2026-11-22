'use client';

import React, {useState} from 'react';
import {Check, Copy} from 'lucide-react';

export default function ApiReference() {
  const [copied, setCopied] = useState(false);

  const endpointSample = `/api/tiktok?link=https://www.tiktok.com/@tiktok/video/7106594312292453675`;

  const handleCopyEndpoint = async () => {
    try {
      const fullUrl =
        typeof window !== 'undefined'
          ? `${window.location.origin}${endpointSample}`
          : endpointSample;
      await navigator.clipboard.writeText(fullUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard blocked
    }
  };

  return (
    <section id="api-docs" className="mx-auto max-w-6xl px-6 pt-4 pb-16">
      <div className="rounded-xl border border-slate-200 bg-white p-6 sm:p-8">
        <div className="flex flex-col gap-4 border-b border-slate-200 pb-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-display text-xl font-bold text-slate-900">
              JSON API Reference
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Drop-in Next.js REST endpoint preserving the <code className="font-mono text-xs text-slate-800">?link=</code> contract and response structure.
            </p>
          </div>
          <button
            type="button"
            onClick={handleCopyEndpoint}
            className="inline-flex h-9 items-center gap-1.5 self-start rounded-lg border border-slate-300 bg-white px-3.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0 cursor-pointer sm:self-auto"
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-600" aria-hidden="true" />
                Copied Endpoint
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                Copy Sample URL
              </>
            )}
          </button>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-8 lg:grid-cols-12">
          <div className="lg:col-span-6">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Endpoint &amp; Parameters
            </h3>
            <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 font-mono text-xs text-slate-800">
              GET /api/tiktok?link=&#123;encoded_tiktok_url&#125;
            </div>

            <dl className="mt-5 divide-y divide-slate-100 text-sm">
              <div className="py-3">
                <dt className="font-mono text-xs font-semibold text-slate-900">
                  link <span className="font-sans font-normal text-rose-600">· required</span>
                </dt>
                <dd className="mt-1 text-xs leading-relaxed text-slate-600">
                  A valid HTTP/HTTPS TikTok video URL (<code className="font-mono">tiktok.com</code>, <code className="font-mono">vm.tiktok.com</code>, or <code className="font-mono">vt.tiktok.com</code>). Missing or non-TikTok URLs return <code className="font-mono">400 Bad Request</code>.
                </dd>
              </div>
              <div className="py-3">
                <dt className="font-mono text-xs font-semibold text-slate-900">
                  POST /api/tiktok
                </dt>
                <dd className="mt-1 text-xs leading-relaxed text-slate-600">
                  Also accepts a JSON body <code className="font-mono">&#123;&quot;link&quot;: &quot;...&quot;&#125;</code> and returns the identical JSON payload.
                </dd>
              </div>
              <div className="py-3">
                <dt className="font-mono text-xs font-semibold text-slate-900">
                  GET /api/search?q=&#123;keyword&#125;&amp;count=6
                </dt>
                <dd className="mt-1 text-xs leading-relaxed text-slate-600">
                  Searches public TikTok videos by keyword or <code className="font-mono">@creator</code> (up to 10 results) and returns resolved metadata plus <code className="font-mono">downloads</code> for each match.
                </dd>
              </div>
              <div className="py-3">
                <dt className="font-mono text-xs font-semibold text-slate-900">
                  GET /api/download
                </dt>
                <dd className="mt-1 text-xs leading-relaxed text-slate-600">
                  Validates media CDN hosts and streams extracted video or MP3 files directly as browser attachments.
                </dd>
              </div>
            </dl>
          </div>

          <div className="lg:col-span-6">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Response Fields
            </h3>
            <div className="mt-3 overflow-hidden rounded-lg border border-slate-200">
              <table className="w-full border-collapse text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 font-semibold text-slate-600">
                    <th className="py-2.5 px-3.5">Field</th>
                    <th className="py-2.5 px-3.5">Type</th>
                    <th className="py-2.5 px-3.5">Description</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  <tr>
                    <td className="py-2.5 px-3.5 font-mono text-slate-900">username</td>
                    <td className="py-2.5 px-3.5 font-mono text-slate-500">string</td>
                    <td className="py-2.5 px-3.5">Author unique handle</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3.5 font-mono text-slate-900">views</td>
                    <td className="py-2.5 px-3.5 font-mono text-slate-500">number</td>
                    <td className="py-2.5 px-3.5">Total play count</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3.5 font-mono text-slate-900">likes</td>
                    <td className="py-2.5 px-3.5 font-mono text-slate-500">number</td>
                    <td className="py-2.5 px-3.5">Total like (digg) count</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3.5 font-mono text-slate-900">comments</td>
                    <td className="py-2.5 px-3.5 font-mono text-slate-500">number</td>
                    <td className="py-2.5 px-3.5">Total comment count</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3.5 font-mono text-slate-900">thumbnail</td>
                    <td className="py-2.5 px-3.5 font-mono text-slate-500">string</td>
                    <td className="py-2.5 px-3.5">Cover image URL</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3.5 font-mono text-slate-900">downloads</td>
                    <td className="py-2.5 px-3.5 font-mono text-slate-500">object</td>
                    <td className="py-2.5 px-3.5">
                      <code className="font-mono">video_hd</code>, <code className="font-mono">video_sd</code>, <code className="font-mono">music</code>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
