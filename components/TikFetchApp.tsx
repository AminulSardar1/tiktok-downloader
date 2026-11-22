'use client';

import React, {useCallback, useState, useSyncExternalStore} from 'react';
import {ExternalLink} from 'lucide-react';
import TopBar from '@/components/TopBar';
import ExtractorHero, {type WorkspaceMode} from '@/components/ExtractorHero';
import SearchResults from '@/components/SearchResults';
import MediaWorkspace from '@/components/MediaWorkspace';
import HistoryTable from '@/components/HistoryTable';
import ApiReference from '@/components/ApiReference';
import {
  type HistoryEntry,
  type TikTokExtractResult,
  type TikTokSearchItem,
  type TikTokSearchResponse,
  validateTikTokUrl,
} from '@/lib/tiktok';

const SAMPLE_TIKTOK_URL =
  'https://www.tiktok.com/@tiktok/video/7106594312292453675';
const HISTORY_STORAGE_KEY = 'tikfetch_history_v1';
const MAX_HISTORY_ITEMS = 25;
const EMPTY_HISTORY: HistoryEntry[] = [];

let cachedRawHistory: string | null = null;
let cachedParsedHistory: HistoryEntry[] = EMPTY_HISTORY;
const historyListeners = new Set<() => void>();

function notifyHistoryChange() {
  historyListeners.forEach((listener) => listener());
}

function subscribeHistory(callback: () => void) {
  historyListeners.add(callback);
  const onStorage = (e: StorageEvent) => {
    if (e.key === HISTORY_STORAGE_KEY) {
      callback();
    }
  };
  window.addEventListener('storage', onStorage);
  return () => {
    historyListeners.delete(callback);
    window.removeEventListener('storage', onStorage);
  };
}

function getHistorySnapshot(): HistoryEntry[] {
  try {
    const raw = localStorage.getItem(HISTORY_STORAGE_KEY);
    if (raw === cachedRawHistory) {
      return cachedParsedHistory;
    }
    cachedRawHistory = raw;
    if (!raw) {
      cachedParsedHistory = EMPTY_HISTORY;
      return cachedParsedHistory;
    }
    const parsed = JSON.parse(raw) as unknown;
    cachedParsedHistory = Array.isArray(parsed)
      ? (parsed as HistoryEntry[])
      : EMPTY_HISTORY;
    return cachedParsedHistory;
  } catch {
    return EMPTY_HISTORY;
  }
}

function getServerHistorySnapshot(): HistoryEntry[] {
  return EMPTY_HISTORY;
}

function writeHistoryStorage(next: HistoryEntry[]) {
  try {
    const serialized = JSON.stringify(next);
    cachedRawHistory = serialized;
    cachedParsedHistory = next;
    localStorage.setItem(HISTORY_STORAGE_KEY, serialized);
    notifyHistoryChange();
  } catch {
    // Ignore storage quota errors
  }
}

export default function TikFetchApp() {
  const [mode, setMode] = useState<WorkspaceMode>('extract');
  const [urlInput, setUrlInput] = useState('');
  const [activeSourceUrl, setActiveSourceUrl] = useState('');
  const [result, setResult] = useState<TikTokExtractResult | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractError, setExtractError] = useState<string | null>(null);
  const [httpStatus, setHttpStatus] = useState<number | null>(null);
  const [workspaceKey, setWorkspaceKey] = useState(0);

  const [searchInput, setSearchInput] = useState('');
  const [activeSearchQuery, setActiveSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<TikTokSearchItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const history = useSyncExternalStore(
    subscribeHistory,
    getHistorySnapshot,
    getServerHistorySnapshot
  );

  const saveHistoryEntry = useCallback(
    (sourceUrl: string, data: TikTokExtractResult) => {
      const newEntry: HistoryEntry = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        sourceUrl,
        extractedAt: new Date().toISOString(),
        data,
      };
      const currentHistory = getHistorySnapshot();
      const deduplicated = currentHistory.filter(
        (item) => item.sourceUrl !== sourceUrl
      );
      writeHistoryStorage([newEntry, ...deduplicated].slice(0, MAX_HISTORY_ITEMS));
    },
    []
  );

  const runExtraction = useCallback(
    async (rawLink: string) => {
      const check = validateTikTokUrl(rawLink);
      if (!check.valid || !check.normalizedUrl) {
        setExtractError(check.error || 'Invalid TikTok URL');
        setHttpStatus(400);
        return;
      }

      setIsExtracting(true);
      setExtractError(null);
      setActiveSourceUrl(check.normalizedUrl);

      try {
        const res = await fetch(
          `/api/tiktok?link=${encodeURIComponent(check.normalizedUrl)}`,
          {method: 'GET'}
        );
        setHttpStatus(res.status);
        const rawText = await res.text();
        let payload: TikTokExtractResult | {error?: string} | null = null;
        try {
          payload = JSON.parse(rawText) as
            | TikTokExtractResult
            | {error?: string};
        } catch {
          payload = null;
        }

        if (!res.ok || !payload || 'error' in payload || !('username' in payload)) {
          setResult(null);
          setExtractError(
            payload && 'error' in payload && payload.error
              ? payload.error
              : `Extraction failed (HTTP ${res.status})`
          );
          return;
        }

        const extracted: TikTokExtractResult = payload;
        setResult(extracted);
        setWorkspaceKey((k) => k + 1);
        saveHistoryEntry(check.normalizedUrl, extracted);
      } catch {
        setResult(null);
        setHttpStatus(502);
        setExtractError('Unable to reach /api/tiktok endpoint');
      } finally {
        setIsExtracting(false);
      }
    },
    [saveHistoryEntry]
  );

  const runSearch = useCallback(async (rawKeyword: string) => {
    const trimmed = rawKeyword.trim();
    if (!trimmed) {
      setSearchError('Enter a keyword, topic, or @creator to search');
      return;
    }

    setIsSearching(true);
    setSearchError(null);
    setActiveSearchQuery(trimmed);

    try {
      const res = await fetch(
        `/api/search?q=${encodeURIComponent(trimmed)}&count=6`,
        {method: 'GET'}
      );
      const rawText = await res.text();
      let payload: TikTokSearchResponse | {error?: string} | null = null;
      try {
        payload = JSON.parse(rawText) as
          | TikTokSearchResponse
          | {error?: string};
      } catch {
        payload = null;
      }

      if (!res.ok || !payload || 'error' in payload || !('results' in payload)) {
        setSearchResults([]);
        setSearchError(
          payload && 'error' in payload && payload.error
            ? payload.error
            : `Search failed (HTTP ${res.status})`
        );
        return;
      }

      setSearchResults(payload.results);
    } catch {
      setSearchResults([]);
      setSearchError('Unable to reach /api/search endpoint');
    } finally {
      setIsSearching(false);
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === 'extract') {
      runExtraction(urlInput);
    } else {
      runSearch(searchInput);
    }
  };

  const handleTrySample = () => {
    setMode('extract');
    setUrlInput(SAMPLE_TIKTOK_URL);
    runExtraction(SAMPLE_TIKTOK_URL);
    const el = document.getElementById('inspector');
    if (el) {
      el.scrollIntoView({behavior: 'smooth', block: 'start'});
    }
  };

  const handleSelectSearchNav = () => {
    setMode('search');
    const el = document.getElementById('extractor');
    if (el) {
      el.scrollIntoView({behavior: 'smooth', block: 'start'});
    }
  };

  const handleSelectSearchVideo = (item: TikTokSearchItem) => {
    const extracted: TikTokExtractResult = {
      username: item.username,
      views: item.views,
      likes: item.likes,
      comments: item.comments,
      thumbnail: item.thumbnail,
      downloads: item.downloads,
    };
    setUrlInput(item.url);
    setActiveSourceUrl(item.url);
    setResult(extracted);
    setExtractError(null);
    setHttpStatus(200);
    setWorkspaceKey((k) => k + 1);
    saveHistoryEntry(item.url, extracted);
    const el = document.getElementById('inspector');
    if (el) {
      el.scrollIntoView({behavior: 'smooth', block: 'start'});
    }
  };

  const handleLoadHistoryEntry = (entry: HistoryEntry) => {
    setUrlInput(entry.sourceUrl);
    setActiveSourceUrl(entry.sourceUrl);
    setResult(entry.data);
    setExtractError(null);
    setHttpStatus(200);
    setWorkspaceKey((k) => k + 1);
    const el = document.getElementById('inspector');
    if (el) {
      el.scrollIntoView({behavior: 'smooth', block: 'start'});
    }
  };

  const handleDeleteHistoryEntry = (id: string) => {
    writeHistoryStorage(history.filter((item) => item.id !== id));
  };

  const handleClearHistory = () => {
    writeHistoryStorage([]);
  };

  const activeError = mode === 'extract' ? extractError : searchError;
  const isBusy = mode === 'extract' ? isExtracting : isSearching;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <TopBar
        onTrySample={handleTrySample}
        onSelectSearch={handleSelectSearchNav}
        isLoading={isExtracting || isSearching}
      />

      <main className="flex-1">
        <ExtractorHero
          mode={mode}
          onModeChange={(nextMode) => {
            setMode(nextMode);
            setExtractError(null);
            setSearchError(null);
          }}
          url={urlInput}
          onUrlChange={(val) => {
            setUrlInput(val);
            if (extractError) setExtractError(null);
          }}
          searchInput={searchInput}
          onSearchInputChange={(val) => {
            setSearchInput(val);
            if (searchError) setSearchError(null);
          }}
          onSubmit={handleSubmit}
          isLoading={isBusy}
          error={activeError}
        />

        {mode === 'search' && (
          <SearchResults
            query={activeSearchQuery}
            results={searchResults}
            isLoading={isSearching}
            error={searchError}
            onSelectVideo={handleSelectSearchVideo}
            onQuickSearch={(kw) => {
              setSearchInput(kw);
              runSearch(kw);
            }}
          />
        )}

        <MediaWorkspace
          key={workspaceKey}
          result={result}
          sourceUrl={activeSourceUrl}
          isLoading={isExtracting}
          error={extractError}
          httpStatus={httpStatus}
          onTrySample={handleTrySample}
        />

        <HistoryTable
          entries={history}
          onLoadEntry={handleLoadHistoryEntry}
          onDeleteEntry={handleDeleteHistoryEntry}
          onClearHistory={handleClearHistory}
        />

        <ApiReference />
      </main>

      <footer className="border-t border-slate-200 bg-white py-6">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-6 text-xs text-slate-600 sm:flex-row">
          <div className="flex flex-wrap items-center justify-center gap-2">
            <span className="font-medium text-slate-900">TikTok Downloader</span>
            <span aria-hidden="true" className="text-slate-300">·</span>
            <span>Made by Aminul Sardar</span>
            <span aria-hidden="true" className="text-slate-300">·</span>
            <a
              href="https://www.facebook.com/profile.php?id=100071880593545"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 font-medium text-slate-900 underline decoration-slate-300 underline-offset-4 hover:decoration-slate-900 transition-colors"
            >
              Facebook
              <ExternalLink className="h-3 w-3" aria-hidden="true" />
            </a>
          </div>
          <p className="font-mono text-slate-500">/api/tiktok · /api/search</p>
        </div>
      </footer>
    </div>
  );
}
