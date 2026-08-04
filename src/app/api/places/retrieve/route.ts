import { NextResponse, type NextRequest } from 'next/server';
import { auth } from '@/server/auth';
import { retrieveDestination } from '@/server/places/mapbox';

/**
 * GET /api/places/retrieve?id=<mapbox_id>&session=<uuid>
 *
 * Second half of the Search Box flow. `/suggest` deliberately returns no
 * coordinates; this resolves the one suggestion the user actually chose.
 *
 * Calling this ends the Mapbox billing session, so the client rotates its
 * session token immediately afterwards.
 */

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
  }

  const params = request.nextUrl.searchParams;
  const mapboxId = params.get('id')?.trim() ?? '';
  const sessionToken = params.get('session') ?? '';

  if (!mapboxId || !UUID_RE.test(sessionToken)) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  try {
    const result = await retrieveDestination(mapboxId, sessionToken, request.signal);

    if (!result) {
      return NextResponse.json({ error: 'That place could not be resolved.' }, { status: 404 });
    }

    return NextResponse.json({ result }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    if (request.signal.aborted) return new NextResponse(null, { status: 499 });

    console.error('[places/retrieve] Retrieve failed', error);
    return NextResponse.json({ error: 'Could not resolve that place.' }, { status: 502 });
  }
}
