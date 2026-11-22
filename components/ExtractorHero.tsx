'use client';

import React, {useRef} from 'react';
import {
  ArrowRight,
  ClipboardPaste,
  Link2,
  Loader2,
  Search,
  X,
} from 'lucide-react';

export type WorkspaceMode = 'extract' | 'search';

interface ExtractorHeroProps {
  mode: WorkspaceMode;
  onModeChange: (mode: WorkspaceMode) => void;
  url: string;
  onUrlChange: (value: string) => void;
  searchInput: string;
  onSearchInputChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  isLoading: boolean;
  error: string | null;
}

export default function ExtractorHero({
  mode,
  onModeChange,
  url,
  onUrlChange,
  searchInput,
  onSearchInputChange,
  onSubmit,
  isLoading,
  error,
}: ExtractorHeroProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const activeValue = mode === 'extract' ? url : searchInput;
  const setActiveValue = mode === 'extract' ? onUrlChange : onSearchInputChange;

  const handlePaste = async () => {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard?.readText) {
        const text = await navigator.clipboard.readText();
        if (text) {
          setActiveValue(text.trim());
          inputRef.current?.focus();
        }
      }
    } catch {
      inputRef.current?.focus();
    }
  };

  return (
    <section
      id="extractor"
      className="border-b border-slate-200 bg-white pt-12 pb-12 sm:pt-16 sm:pb-14"
    >
      <div className="mx-auto max-w-6xl px-6">
        <div className="max-w-3xl">
          <p className="text-xs font-medium text-slate-500 tracking-wide">
            TikTok Search, Media &amp; Metadata Extractor
          </p>
          <h1
            className="mt-2 font-display text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl lg:text-[2.65rem] lg:leading-[1.12]"
            style={{textWrap: 'balance'}}
          >
            Search TikTok videos or extract HD video, audio, and metrics from any link
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-slate-600">
            Search public TikTok posts by keyword or paste a direct video URL to resolve watermark-free HD video, standard video, MP3 audio, and structured JSON output.
          </p>
        </div>

        <div className="mt-8 inline-flex items-center gap-1 rounded-lg bg-slate-100 p-1">
          <button
            type="button"
            onClick={() => onModeChange('extract')}
            className={`inline-flex items-center gap-1.5 rounded-md px-3.5 py-2 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              mode === 'extract'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Link2 className="h-3.5 w-3.5" aria-hidden="true" />
            Extract by URL
          </button>
          <button
            type="button"
            onClick={() => onModeChange('search')}
            className={`inline-flex items-center gap-1.5 rounded-md px-3.5 py-2 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              mode === 'search'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Search className="h-3.5 w-3.5" aria-hidden="true" />
            Search TikTok
          </button>
        </div>

        <form onSubmit={onSubmit} className="mt-4 max-w-4xl" noValidate>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-stretch">
            <div className="relative flex-1">
              <label htmlFor="tiktok-primary-input" className="sr-only">
                {mode === 'extract' ? 'TikTok Video URL' : 'TikTok Search Keyword'}
              </label>
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400">
                {mode === 'extract' ? (
                  <Link2 className="h-4 w-4" aria-hidden="true" />
                ) : (
                  <Search className="h-4 w-4" aria-hidden="true" />
                )}
              </div>
              <input
                ref={inputRef}
                id="tiktok-primary-input"
                type={mode === 'extract' ? 'url' : 'search'}
                inputMode={mode === 'extract' ? 'url' : 'search'}
                autoComplete="off"
                spellCheck={false}
                value={activeValue}
                onChange={(e) => setActiveValue(e.target.value)}
                placeholder={
                  mode === 'extract'
                    ? 'https://www.tiktok.com/@username/video/7106594312292453675'
                    : 'Search by keyword, topic, or @creator (e.g. minecraft frogs)'
                }
                className={`h-12 w-full rounded-lg border border-slate-300 bg-white pl-11 pr-24 text-sm text-slate-900 placeholder:text-slate-400 transition-colors focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 ${
                  mode === 'extract' ? 'font-mono' : 'font-sans'
                }`}
              />
              <div className="absolute inset-y-0 right-2 flex items-center gap-1">
                {activeValue ? (
                  <button
                    type="button"
                    onClick={() => {
                      setActiveValue('');
                      inputRef.current?.focus();
                    }}
                    aria-label="Clear input"
                    className="inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors cursor-pointer"
                  >
                    <X className="h-4 w-4" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handlePaste}
                    className="inline-flex h-8 items-center gap-1.5 rounded-md px-2.5 text-xs font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    <ClipboardPaste className="h-3.5 w-3.5" aria-hidden="true" />
                    Paste
                  </button>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-rose-600 px-6 text-sm font-semibold text-white transition-colors hover:bg-rose-700 disabled:opacity-60 disabled:cursor-not-allowed whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-600 focus-visible:ring-offset-2 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  {mode === 'extract' ? 'Extracting' : 'Searching'}
                </>
              ) : (
                <>
                  {mode === 'extract' ? 'Extract Media' : 'Search Videos'}
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </>
              )}
            </button>
          </div>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
            <div className="flex flex-wrap items-center gap-2">
              {mode === 'extract' ? (
                <>
                  <span>Supports standard links, vm.tiktok.com, and vt.tiktok.com short URLs</span>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono text-slate-600">GET /api/tiktok?link=...</span>
                </>
              ) : (
                <>
                  <span>Searches public TikTok videos and resolves direct download streams</span>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono text-slate-600">GET /api/search?q=...</span>
                </>
              )}
            </div>
            {error && (
              <p role="alert" className="font-medium text-red-600">
                {error}
              </p>
            )}
          </div>
        </form>
      </div>
    </section>
  );
}
