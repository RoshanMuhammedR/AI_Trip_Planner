// Prompt construction lives server-side so /api/generate can only ever produce
// trip itineraries. If the client passed raw `messages[]`, the endpoint would be
// a free general-purpose LLM proxy for anyone who found it.
// Files prefixed with _ are not routable by Vercel.

export const MODEL = 'google/gemini-3.1-flash-lite-preview'
export const AICREDITS_BASE_URL = 'https://api.aicredits.in/v1'

const RULES = [
  'Reply with JSON only. No prose, no markdown fences.',
  'Costs must be numeric in `amount` with an ISO-ish `currency` symbol; use 0 for free.',
  'Coordinates must be real decimal degrees for the actual place.',
].join(' ')

/**
 * Phase 1 of generation: the trip shell. Small and fast, so the user sees a
 * real page in a couple of seconds instead of waiting on the whole itinerary.
 */
const SKELETON_EXAMPLE = JSON.stringify({
  location: 'Las Vegas, NV, USA',
  duration: 2,
  travelerType: '2 people',
  budget: 'Cheap',
  hotelOptions: [
    {
      hotelName: 'Excalibur Hotel & Casino',
      hotelAddress: '3850 S Las Vegas Blvd, Las Vegas, NV 89109, USA',
      price: { amount: 60, currency: '$' },
      geoCoordinates: { latitude: 36.0986, longitude: -115.1758 },
      rating: 3.5,
      description: 'Castle-themed hotel on the Strip with affordable rooms and a large casino.',
    },
  ],
  itinerary: [
    { day: 1, theme: 'South Strip Exploration', bestTimeToVisit: 'Late afternoon to evening' },
    { day: 2, theme: 'Downtown and Fremont Street', bestTimeToVisit: 'Evening' },
  ],
})

/** Phase 2: one call per day, run in parallel. */
const DAY_EXAMPLE = JSON.stringify({
  plan: [
    {
      placeName: 'Bellagio Conservatory & Botanical Gardens',
      placeDetails: 'A 14,000 sq ft floral display inside the Bellagio, changed seasonally.',
      geoCoordinates: { latitude: 36.1126, longitude: -115.1767 },
      ticketPricing: { amount: 0, currency: '$' },
      rating: 4.8,
      timeToTravel: '15 min walk from the Flamingo',
    },
  ],
})

export function buildSkeletonMessages({ location, noOfDays, budget, people, startDate }) {
  const dateLine = startDate
    ? ` The trip starts on ${startDate}; take that season and any local events into account.`
    : ''

  return [
    {
      role: 'system',
      content:
        'You are a travel planner that returns strict JSON matching the requested schema. ' +
        RULES,
    },
    {
      role: 'user',
      content:
        `Plan a ${noOfDays}-day trip to Las Vegas for 2 people on a Cheap budget. ` +
        'Return hotelOptions and a day-by-day itinerary shell (day, theme, bestTimeToVisit only — no places yet).',
    },
    { role: 'assistant', content: SKELETON_EXAMPLE },
    {
      role: 'user',
      content:
        `Plan a ${noOfDays}-day trip to ${location} for ${people} on a ${budget} budget.${dateLine} ` +
        `Return 3-5 hotelOptions and exactly ${noOfDays} itinerary entries with day, theme and ` +
        'bestTimeToVisit only — do not include a plan array. Same JSON shape as before.',
    },
  ]
}

export function buildDayMessages({ location, budget, people, day, theme, date, instruction }) {
  const dateLine = date ? ` The date is ${date}.` : ''
  const themeLine = theme ? ` The theme for this day is "${theme}".` : ''
  // Used by chat-to-refine; absent for a first generation.
  const instructionLine = instruction
    ? ` Additional requirement from the traveller: ${instruction}`
    : ''

  return [
    {
      role: 'system',
      content:
        'You are a travel planner that returns strict JSON matching the requested schema. ' +
        RULES,
    },
    {
      role: 'user',
      content:
        'Give me the plan array for day 1 of a Cheap trip to Las Vegas for 2 people. ' +
        'Theme: "South Strip Exploration".',
    },
    { role: 'assistant', content: DAY_EXAMPLE },
    {
      role: 'user',
      content:
        `Give me the plan array for day ${day} of a ${budget} trip to ${location} for ${people}.` +
        `${themeLine}${dateLine}${instructionLine} ` +
        'Include 3-5 places in visiting order. Same JSON shape as before — an object with a "plan" array.',
    },
  ]
}
