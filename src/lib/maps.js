/**
 * Builds a Google Maps deep link, best target first:
 *
 *   1. placeId  — opens the real place page (photos, hours, reviews, directions)
 *   2. query    — a name search, which still lands on the place card
 *   3. coords   — an anonymous dropped pin; only when there's no usable name
 *
 * Coordinates used to win, but the model's lat/lng are approximate and a bare
 * pin shows none of the place's detail. They stay as the fallback.
 *
 * The query is always encoded — names were once concatenated raw, so anything
 * containing & or # corrupted the URL — and callers append the city or address
 * so a common hotel name can't resolve to another continent.
 */
export function mapsLink({ coordinates, query, placeId }) {
  const base = 'https://www.google.com/maps/search/?api=1&query='

  if (query) {
    const url = `${base}${encodeURIComponent(query)}`
    // query_place_id pins the result exactly; Maps ignores it without a query.
    return placeId ? `${url}&query_place_id=${encodeURIComponent(placeId)}` : url
  }

  if (coordinates?.latitude != null && coordinates?.longitude != null) {
    return `${base}${coordinates.latitude},${coordinates.longitude}`
  }

  return null
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
