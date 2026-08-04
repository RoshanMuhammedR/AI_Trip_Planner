import { NextResponse, type NextRequest } from 'next/server';
import { auth } from '@/server/auth';
import { suggestDestinations } from '@/server/places/mapbox';

/**
 * GET /api/places/search?q=…&session=<uuid>
 *
 * Proxy in front of Mapbox `/suggest`. It exists so the browser never holds a
 * Mapbox token — the legacy app handed a Google Places key to a client
 * component, which put it in the bundle and in every outgoing request.
 *
 * The session guard is authorisation, not rate limiting: without it this would
 * be an open geocoding proxy billed to this project's Mapbox account.
 */

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
  }

  const params = request.nextUrl.searchParams;
  const query = params.get('q')?.trim() ?? '';
  const sessionToken = params.get('session') ?? '';

  // Mapbox bills per session token, so an arbitrary client-supplied string is
  // not acceptable here — a caller could otherwise mint a new session on every
  // keystroke and multiply the cost.
  if (!UUID_RE.test(sessionToken)) {
    return NextResponse.json({ error: 'Invalid session token' }, { status: 400 });
  }

  if (query.length < 2) {
    return NextResponse.json({ results: [] });
  }

  try {
    const results = await suggestDestinations(query.slice(0, 120), sessionToken, request.signal);
    return NextResponse.json({ results }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    if (request.signal.aborted) return new NextResponse(null, { status: 499 });

    console.error('[places/search] Suggest failed', error);
    return NextResponse.json({ error: 'Destination search is unavailable.' }, { status: 502 });
  }
}
