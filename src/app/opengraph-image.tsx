import { ImageResponse } from 'next/og';

export const alt = 'Wayfare — AI trip planner';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

/**
 * Social preview card, rendered at request time and cached by the CDN.
 *
 * Generated rather than checked in, so it never drifts from the product and
 * costs no repository weight — the legacy project shipped 2.4 MB of unused
 * landing-page PNGs.
 */
export default function OpenGraphImage() {
  return new ImageResponse(
    <div
      style={{
        height: '100%',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '80px',
        background: 'linear-gradient(135deg, #0d3b45 0%, #135664 55%, #c4762e 100%)',
        color: 'white',
        fontFamily: 'sans-serif',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, opacity: 0.85 }}>
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            border: '4px solid white',
            display: 'flex',
          }}
        />
        <span style={{ fontSize: 30, letterSpacing: 1 }}>Wayfare</span>
      </div>

      <div style={{ fontSize: 78, fontWeight: 700, lineHeight: 1.1, marginTop: 40 }}>
        Your next trip, planned in about a minute.
      </div>

      <div style={{ fontSize: 32, marginTop: 28, opacity: 0.85 }}>
        Day-by-day itineraries · Real places · Mapped and shareable
      </div>
    </div>,
    size,
  );
}
