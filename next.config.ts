import type { NextConfig } from 'next';

/**
 * Security headers applied to every response.
 *
 * `Content-Security-Policy` is deliberately NOT here — it is emitted per-request
 * from `src/middleware.ts` so each response can carry a fresh script nonce.
 */
const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(self), interest-cohort=()',
  },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,

  // Fail the production build on type errors rather than shipping them.
  // (Next 16 no longer runs ESLint during `build`; CI runs `npm run lint`.)
  typescript: { ignoreBuildErrors: false },

  images: {
    // Every remote image source is explicitly allow-listed. The legacy app piped
    // a Google Places key into every <img src>; these hosts need no credentials.
    remotePatterns: [
      { protocol: 'https', hostname: 'upload.wikimedia.org' },
      { protocol: 'https', hostname: 'commons.wikimedia.org' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
    ],
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60 * 60 * 24 * 30,
  },

  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }];
  },
};

export default nextConfig;
