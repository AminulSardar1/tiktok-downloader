# TikTok Downloader — TikTok Video, Audio & Metadata API Extractor

A Next.js App Router application and JSON API for extracting watermark-free HD video, standard video, MP3 audio tracks, cover thumbnails, and engagement metrics (`username`, `views`, `likes`, `comments`) from TikTok URLs.

Made by **Aminul Sardar** ([Facebook](https://www.facebook.com/profile.php?id=100071880593545)).

---

## Features

- **REST JSON API (`GET /api/tiktok?link=...`)**: Preserves the `?link=` query contract and clean JSON schema (`username`, `views`, `likes`, `comments`, `thumbnail`, `downloads`). Also supports `POST /api/tiktok`.
- **TikTok Search API (`GET /api/search?q=...`)**: Searches public TikTok videos by keyword or topic out of the box (with optional `RAPIDAPI_KEY` or `GEMINI_API_KEY` fallback) and returns resolved metadata and download streams.
- **Media Proxy (`GET /api/download`)**: Validates TikTok/TikWM CDN hosts and streams HD MP4, SD MP4, MP3 audio, and cover images cleanly without CORS or hotlink issues.
- **Interactive Web Workspace**: Switch between URL Extraction and TikTok Search, preview covers or stream video inline, download media files directly, inspect live JSON/cURL/PHP snippets, and revisit recent extractions saved locally in browser history.

---

## Local Development

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Start the development server**

   ```bash
   npm run dev
   ```

3. Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## How to Deploy to Vercel

This repository is pre-configured for Vercel (`vercel.json` + Next.js App Router serverless API routes) and works out of the box with no mandatory environment variables. Optionally, you can set `RAPIDAPI_KEY` or `GEMINI_API_KEY` in **Vercel Project → Settings → Environment Variables** for enhanced search fallback.

### Option 1: Deploy via GitHub + Vercel Dashboard (Recommended)

1. Push this project to a GitHub, GitLab, or Bitbucket repository:

   ```bash
   git init
   git add .
   git commit -m "Initial TikTok Downloader commit"
   git branch -M main
   git remote add origin https://github.com/<your-username>/<your-repo>.git
   git push -u origin main
   ```

2. Sign in to [vercel.com](https://vercel.com) and click **Add New… → Project**.
3. Select your repository and click **Import**.
4. Leave the default build settings as detected by Vercel:
   - **Framework Preset**: `Next.js`
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next` (default)
5. Click **Deploy**. Your live URL (e.g. `https://your-project.vercel.app`) will be ready in about a minute.

### Option 2: Deploy via Vercel CLI

1. Install the Vercel CLI globally:

   ```bash
   npm install -g vercel
   ```

2. Log in to your Vercel account:

   ```bash
   vercel login
   ```

3. Deploy a preview build from the project root:

   ```bash
   vercel
   ```

4. Deploy to production:

   ```bash
   vercel --prod
   ```

---

## API Usage

### `GET /api/tiktok?link={tiktok_url}`

```bash
curl "https://your-project.vercel.app/api/tiktok?link=https://www.tiktok.com/@tiktok/video/7106594312292453675"
```

#### Example Response (`200 OK`)

```json
{
  "username": "tiktok",
  "views": 1234567,
  "likes": 89012,
  "comments": 3456,
  "thumbnail": "https://www.tikwm.com/...",
  "downloads": {
    "video_hd": "https://www.tikwm.com/...",
    "video_sd": "https://www.tikwm.com/...",
    "music": "https://www.tikwm.com/..."
  }
}
```

#### Error Responses

- `400 Bad Request` — `{"error": "Missing link parameter"}` or `{"error": "Invalid TikTok URL"}`
- `422 Unprocessable Entity` — `{"error": "Invalid TikTok URL"}`

### `GET /api/search?q={keyword}&count={1-10}`

```bash
curl "https://your-project.vercel.app/api/search?q=minecraft%20frogs&count=6"
```

---

## Project Structure

- `app/page.tsx` — Home page
- `app/api/tiktok/route.ts` — TikTok metadata & stream extraction endpoint
- `app/api/search/route.ts` — TikTok keyword/topic search endpoint
- `app/api/download/route.ts` — Host-allowlisted media download & preview proxy
- `components/` — UI components (`TopBar`, `ExtractorHero`, `SearchResults`, `MediaWorkspace`, `HistoryTable`, `ApiReference`, `TikFetchApp`)
- `lib/tiktok.ts` — URL validation, media host allowlisting, and formatting helpers
- `vercel.json` — Vercel Next.js project configuration
