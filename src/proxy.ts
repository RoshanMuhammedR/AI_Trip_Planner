import { NextResponse, type NextRequest } from 'next/server';

/** Routes that are pointless to visit signed-out. */
const PROTECTED_PREFIXES = ['/plan', '/trips'];

/** Auth.js v5 session cookie, secure variant first. */
const SESSION_COOKIES = ['__Secure-authjs.session-token', 'authjs.session-token'];

function buildCsp(nonce: string, isDev: boolean): string {
  const directives: Record<string, string[]> = {
    'default-src': ["'self'"],

    // 'strict-dynamic' lets Next's nonced bootstrap script load the chunks it
    // needs without enumerating every hashed filename here.
    // Dev additionally needs 'unsafe-eval' for React Refresh.
    'script-src': [
      "'self'",
      `'nonce-${nonce}'`,
      "'strict-dynamic'",
      ...(isDev ? ["'unsafe-eval'"] : []),
    ],

    // Tailwind's runtime-injected styles and MapLibre's inline canvas styles
    // both require this. Style injection is a materially lower risk than script
    // injection, which stays nonce-locked above.
    'style-src': ["'self'", "'unsafe-inline'"],

    'img-src': [
      "'self'",
      'blob:',
      'data:',
      'https://upload.wikimedia.org',
      'https://commons.wikimedia.org',
      'https://lh3.googleusercontent.com',
    ],

    'font-src': ["'self'", 'data:'],

    // Map style + vector tiles are fetched from the browser. Everything else
    // (Gemini, Mapbox search, Wikimedia lookups) is server-side, so no other
    // origin needs to be reachable from client JavaScript. Adding a
    // third-party API call from the client would fail here rather than
    // quietly shipping a credential to the browser.
    'connect-src': ["'self'", 'https://tiles.openfreemap.org', ...(isDev ? ['ws:'] : [])],

    // MapLibre renders tiles in a web worker created from a blob URL.
    'worker-src': ["'self'", 'blob:'],

    'frame-ancestors': ["'none'"],
    'form-action': ["'self'"],
    'base-uri': ["'self'"],
    'object-src': ["'none'"],
  };

  const csp = Object.entries(directives)
    .map(([key, values]) => `${key} ${values.join(' ')}`)
    .join('; ');

  return isDev ? csp : `${csp}; upgrade-insecure-requests`;
}

/**
 * This proxy (Next 16's renamed middleware) does two things:
 *
 *   1. Emits a per-request CSP nonce. Next.js detects the nonce in the
 *      `Content-Security-Policy` request header and stamps it onto the scripts
 *      it renders, so no inline script needs 'unsafe-inline'.
 *
 *   2. Redirects signed-out visitors away from app routes.
 *
 * (2) is a convenience, NOT a security control. It only checks that a session
 * cookie exists, not that it is valid — validating would mean a database round
 * trip on every request. Real enforcement lives in `requireUser()` and in the
 * query layer, both of which run on every data access.
 */
export default function proxy(request: NextRequest) {
  const isDev = process.env.NODE_ENV === 'development';

  const nonce = Buffer.from(crypto.randomUUID()).toString('base64');
  const csp = buildCsp(nonce, isDev);

  const { pathname } = request.nextUrl;
  const isProtected = PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );

  if (isProtected && !SESSION_COOKIES.some((name) => request.cookies.has(name))) {
    const signIn = new URL('/signin', request.url);
    signIn.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(signIn);
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-nonce', nonce);
  requestHeaders.set('Content-Security-Policy', csp);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set('Content-Security-Policy', csp);

  return response;
}

export const config = {
  matcher: [
    /*
     * Everything except static assets and image optimisation output. The
     * negative lookahead keeps the middleware off the hot path for files that
     * carry no HTML and therefore need no nonce.
     */
    {
      source:
        '/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif|ico)$).*)',
      missing: [
        { type: 'header', key: 'next-router-prefetch' },
        { type: 'header', key: 'purpose', value: 'prefetch' },
      ],
    },
  ],
};
