import type {Metadata} from 'next';
import {Plus_Jakarta_Sans, DM_Sans, JetBrains_Mono} from 'next/font/google';
import './globals.css';

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  variable: '--font-jakarta',
  display: 'swap',
});

const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-dm-sans',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-jetbrains-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'TikTok Downloader — TikTok Media & Metadata API Extractor',
  description:
    'Extract TikTok HD/SD video, MP3 audio, and engagement metrics with a live JSON API endpoint.',
  openGraph: {
    title: 'TikTok Downloader — TikTok Media & Metadata API Extractor',
    description:
      'Extract TikTok HD/SD video, MP3 audio, and engagement metrics with a live JSON API endpoint.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'TikTok Downloader — TikTok Media & Metadata API Extractor',
    description:
      'Extract TikTok HD/SD video, MP3 audio, and engagement metrics with a live JSON API endpoint.',
  },
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html
      lang="en"
      className={`${plusJakartaSans.variable} ${dmSans.variable} ${jetbrainsMono.variable}`}
    >
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased selection:bg-rose-100 selection:text-rose-900" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
