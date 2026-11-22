'use client';

import React, {useMemo, useState} from 'react';
import {RotateCcw, Search, Trash2} from 'lucide-react';
import {formatCompactNumber, type HistoryEntry} from '@/lib/tiktok';

interface HistoryTableProps {
  entries: HistoryEntry[];
  onLoadEntry: (entry: HistoryEntry) => void;
  onDeleteEntry: (id: string) => void;
  onClearHistory: () => void;
}

export default function HistoryTable({
  entries,
  onLoadEntry,
  onDeleteEntry,
  onClearHistory,
}: HistoryTableProps) {
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return entries;
    return entries.filter(
      (item) =>
        item.data.username.toLowerCase().includes(q) ||
        item.sourceUrl.toLowerCase().includes(q)
    );
  }, [entries, query]);

  return (
    <section id="history" className="mx-auto max-w-6xl px-6 py-8">
      <div className="rounded-xl border border-slate-200 bg-white">
        <div className="flex flex-col gap-4 border-b border-slate-200 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-display text-lg font-bold text-slate-900">
              Recent Extractions
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">
              Saved locally in this browser ·{' '}
              <span className="font-mono tabular-nums">{entries.length}</span>{' '}
              {entries.length === 1 ? 'record' : 'records'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400"
                aria-hidden="true"
              />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Filter by @username or link"
                aria-label="Filter recent extractions"
                className="h-9 w-56 rounded-lg border border-slate-300 bg-white pl-8 pr-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:outline-none"
              />
            </div>

            {entries.length > 0 && (
              <button
                type="button"
                onClick={onClearHistory}
                className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                Clear All
              </button>
            )}
          </div>
        </div>

        {entries.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <p className="text-sm font-medium text-slate-900">
              No extracted videos in your local history yet
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Extracted TikTok metadata and download links will appear here for quick reloading.
            </p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="px-6 py-10 text-center">
            <p className="text-sm font-medium text-slate-900">
              No matching records for &ldquo;{query}&rdquo;
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-xs font-semibold text-slate-600">
                  <th className="py-3 pl-6 pr-4">Creator</th>
                  <th className="py-3 px-4">Source URL</th>
                  <th className="py-3 px-4 text-right">Views</th>
                  <th className="py-3 px-4 text-right">Likes</th>
                  <th className="py-3 px-4 text-right">Comments</th>
                  <th className="py-3 pl-4 pr-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((entry) => (
                  <tr
                    key={entry.id}
                    className="transition-colors hover:bg-slate-50/80"
                  >
                    <td className="py-3 pl-6 pr-4 font-medium text-slate-900 whitespace-nowrap">
                      @{entry.data.username}
                    </td>
                    <td className="max-w-xs py-3 px-4">
                      <span className="block truncate font-mono text-xs text-slate-500">
                        {entry.sourceUrl}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-xs text-slate-700 tabular-nums whitespace-nowrap">
                      {formatCompactNumber(entry.data.views)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-xs text-slate-700 tabular-nums whitespace-nowrap">
                      {formatCompactNumber(entry.data.likes)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-xs text-slate-700 tabular-nums whitespace-nowrap">
                      {formatCompactNumber(entry.data.comments)}
                    </td>
                    <td className="py-3 pl-4 pr-6 text-right whitespace-nowrap">
                      <div className="inline-flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => onLoadEntry(entry)}
                          className="inline-flex h-8 items-center gap-1 rounded-md border border-slate-300 bg-white px-2.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                        >
                          <RotateCcw className="h-3 w-3" aria-hidden="true" />
                          Load
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteEntry(entry.id)}
                          aria-label={`Remove @${entry.data.username} from history`}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors cursor-pointer"
                        >
                          <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}
