import { addDays, format, parseISO } from 'date-fns'

export const SCHEMA_VERSION = 2

/**
 * Trips saved before schema v2 have string prices, no dates, and always-present
 * day plans. Rather than branching on shape in every component, everything is
 * normalized to the v2 shape here and components read only the result.
 */

/** "Approximately $40 - $150 per night" -> { raw, amount: null } */
function normalizeCost(value) {
  if (value == null) return null
  if (typeof value === 'object') {
    return {
      raw: value.raw ?? null,
      amount: typeof value.amount === 'number' ? value.amount : null,
      currency: value.currency ?? null,
    }
  }
  const raw = String(value)
  // Pull the first number out so v1 trips get at least a rough total.
  const match = raw.replace(/,/g, '').match(/\d+(\.\d+)?/)
  return {
    raw,
    amount: match ? Number(match[0]) : null,
    currency: raw.match(/[$€£₹]/)?.[0] ?? null,
  }
}

function normalizeCoordinates(geo) {
  const lat = geo?.latitude ?? geo?.lat
  const lng = geo?.longitude ?? geo?.lng
  if (typeof lat !== 'number' || typeof lng !== 'number') return null
  return { latitude: lat, longitude: lng }
}

function normalizePlace(place) {
  if (!place) return null
  return {
    placeName: place.placeName ?? '',
    placeDetails: place.placeDetails ?? '',
    placeId: place.placeId ?? null,
    geoCoordinates: normalizeCoordinates(place.geoCoordinates),
    ticketPricing: normalizeCost(place.ticketPricing),
    rating: typeof place.rating === 'number' ? place.rating : null,
    timeToTravel: place.timeToTravel ?? '',
  }
}

function normalizeHotel(hotel) {
  if (!hotel) return null
  return {
    hotelName: hotel.hotelName ?? '',
    hotelAddress: hotel.hotelAddress ?? '',
    description: hotel.description ?? '',
    geoCoordinates: normalizeCoordinates(hotel.geoCoordinates),
    price: normalizeCost(hotel.price),
    rating: typeof hotel.rating === 'number' ? hotel.rating : null,
  }
}

function normalizeDay(day, index, startDate) {
  // plan === null means "not generated yet" (progressive generation in flight).
  // An empty array means the model genuinely returned nothing.
  const plan = Array.isArray(day?.plan) ? day.plan.map(normalizePlace).filter(Boolean) : null

  let date = day?.date ?? null
  if (!date && startDate) {
    try {
      date = format(addDays(parseISO(startDate), index), 'yyyy-MM-dd')
    } catch {
      date = null
    }
  }

  return {
    day: day?.day ?? index + 1,
    date,
    theme: day?.theme ?? '',
    bestTimeToVisit: day?.bestTimeToVisit ?? '',
    plan,
  }
}

/** Sums whatever numeric costs are available. Returns null if nothing is known. */
function computeTotal(itinerary, hotelOptions) {
  let total = 0
  let currency = null
  let found = false

  for (const day of itinerary) {
    for (const place of day.plan ?? []) {
      if (place.ticketPricing?.amount) {
        total += place.ticketPricing.amount
        currency ??= place.ticketPricing.currency
        found = true
      }
    }
  }
  // Hotels are per-night; multiply by nights rather than counting once.
  const nights = Math.max(itinerary.length - 1, 1)
  const cheapest = hotelOptions
    .map((h) => h.price?.amount)
    .filter((n) => typeof n === 'number')
    .sort((a, b) => a - b)[0]
  if (typeof cheapest === 'number') {
    total += cheapest * nights
    currency ??= hotelOptions.find((h) => h.price?.currency)?.price?.currency
    found = true
  }

  return found ? { amount: Math.round(total), currency: currency ?? '$' } : null
}

/**
 * @param doc - raw Firestore document data
 * @returns normalized trip, or null when the document has no usable tripData
 */
export function normalizeTrip(doc) {
  const tripData = doc?.tripData
  if (!tripData) return null

  const startDate = tripData.startDate ?? doc?.userSelection?.startDate ?? null
  const hotelOptions = Array.isArray(tripData.hotelOptions)
    ? tripData.hotelOptions.map(normalizeHotel).filter(Boolean)
    : []
  const itinerary = Array.isArray(tripData.itinerary)
    ? tripData.itinerary.map((day, i) => normalizeDay(day, i, startDate))
    : []

  return {
    id: doc.id,
    userId: doc.userId ?? null,
    userEmail: doc.userEmail ?? null,
    userSelection: doc.userSelection ?? {},
    schemaVersion: tripData.schemaVersion ?? 1,
    location: tripData.location ?? doc?.userSelection?.location ?? '',
    locationPlaceId: doc?.userSelection?.locationPlaceId ?? null,
    startDate,
    duration: tripData.duration ?? itinerary.length ?? 0,
    travelerType: tripData.travelerType ?? doc?.userSelection?.people ?? '',
    budget: tripData.budget ?? doc?.userSelection?.budget ?? '',
    hotelOptions,
    itinerary,
    totalEstimatedCost: computeTotal(itinerary, hotelOptions),
  }
}

/** Indices of days still awaiting generation. */
export function pendingDayIndices(trip) {
  if (!trip) return []
  return trip.itinerary
    .map((day, index) => (day.plan === null ? index : -1))
    .filter((i) => i !== -1)
}

export function formatDayDate(date) {
  if (!date) return null
  try {
    return format(parseISO(date), 'EEE, d MMM')
  } catch {
    return null
  }
}

export function formatCost(cost) {
  if (!cost) return null
  if (typeof cost.amount === 'number') {
    return `${cost.currency ?? ''}${cost.amount.toLocaleString()}`
  }
  return cost.raw ?? null
}
