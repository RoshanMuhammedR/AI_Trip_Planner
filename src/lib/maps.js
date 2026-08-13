/**
 * Builds a Google Maps deep link.
 *
 * Prefers stored coordinates over a text query: names were previously
 * concatenated unencoded, so anything containing & or # corrupted the URL, and
 * a bare hotel name could resolve to a different continent.
 */
export function mapsLink({ coordinates, query }) {
  const base = 'https://www.google.com/maps/search/?api=1&query='
  if (coordinates?.latitude != null && coordinates?.longitude != null) {
    return `${base}${coordinates.latitude},${coordinates.longitude}`
  }
  return `${base}${encodeURIComponent(query ?? '')}`
}

/** Distinct, colour-blind-friendly hues for per-day map markers. */
export const DAY_COLORS = [
  '#2C3E50',
  '#E67E22',
  '#16A085',
  '#8E44AD',
  '#C0392B',
  '#2980B9',
  '#7F8C8D',
]

export const dayColor = (dayIndex) => DAY_COLORS[dayIndex % DAY_COLORS.length]
