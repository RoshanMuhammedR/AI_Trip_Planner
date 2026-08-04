import type { MetadataRoute } from 'next';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // Shared trips live under /t/. They are unlisted-by-link, not public, so
      // they must not be crawled — and the app routes need a session anyway.
      disallow: ['/api/', '/trips', '/trips/', '/plan', '/signin', '/t/'],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
