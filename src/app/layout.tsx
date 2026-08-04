import type { Metadata, Viewport } from 'next';
import { headers } from 'next/headers';
import { Geist, Geist_Mono } from 'next/font/google';
import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from '@/components/ui/sonner';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import './globals.css';

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] });
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] });

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'Wayfare — AI trip planner',
    template: '%s · Wayfare',
  },
  description:
    'Describe where you want to go and Wayfare builds a day-by-day itinerary with hotels, timings and an interactive map.',
  keywords: ['trip planner', 'travel itinerary', 'AI travel', 'vacation planner'],
  authors: [{ name: 'Roshan Muhammed R' }],
  openGraph: {
    type: 'website',
    siteName: 'Wayfare',
    title: 'Wayfare — AI trip planner',
    description: 'Day-by-day travel itineraries generated in seconds, mapped and shareable.',
    url: siteUrl,
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Wayfare — AI trip planner',
    description: 'Day-by-day travel itineraries generated in seconds, mapped and shareable.',
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#fdfdfb' },
    { media: '(prefers-color-scheme: dark)', color: '#12181d' },
  ],
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // next-themes injects a small inline script that sets the `dark` class before
  // paint. Under our `strict-dynamic` CSP an un-nonced inline script is blocked,
  // which would reintroduce a flash of the wrong theme — so it gets the same
  // per-request nonce that `src/proxy.ts` minted.
  const nonce = (await headers()).get('x-nonce') ?? undefined;

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} font-sans`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
          nonce={nonce}
        >
          <a
            href="#main"
            className="bg-primary text-primary-foreground focus:ring-ring sr-only rounded-md px-4 py-2 focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50"
          >
            Skip to content
          </a>

          <div className="flex min-h-dvh flex-col">
            <SiteHeader />
            <div className="flex-1">{children}</div>
            <SiteFooter />
          </div>

          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
