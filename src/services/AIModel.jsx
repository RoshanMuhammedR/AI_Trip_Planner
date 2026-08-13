import axios from 'axios'

/**
 * Generation is split into a fast "skeleton" call plus one call per day, fired
 * in parallel. That gives progressive rendering without needing to parse
 * partial JSON mid-stream, keeps each response small enough for a small model
 * to get right, and makes chat-to-refine the same call shape as a day.
 */

async function requestJson(payload) {
  let content
  try {
    const response = await axios.post('/api/generate', payload)
    content = response.data?.content ?? ''
  } catch (error) {
    throw new Error(error.response?.data?.error ?? 'Could not reach the trip generator.')
  }

  // json_object mode returns bare JSON, but the fallback path may still fence it.
  const fenced = content.match(/```(?:json)?([\s\S]*?)```/)
  const jsonString = (fenced ? fenced[1] : content).trim()

  try {
    return JSON.parse(jsonString)
  } catch (e) {
    console.error('Failed to parse model JSON:', e, content.slice(0, 500))
    return null
  }
}

/** Trip shell: hotels + day themes, no places yet. */
export async function generateSkeleton({ location, noOfDays, budget, people, startDate }) {
  const data = await requestJson({
    mode: 'skeleton',
    location,
    noOfDays,
    budget,
    people,
    startDate,
  })
  if (!data || !Array.isArray(data.itinerary)) return null

  return {
    ...data,
    // The shell deliberately carries no places; null marks "not generated yet".
    itinerary: data.itinerary.map((day, i) => ({
      day: day.day ?? i + 1,
      theme: day.theme ?? '',
      bestTimeToVisit: day.bestTimeToVisit ?? '',
      plan: null,
    })),
  }
}

/**
 * The plan array for one day.
 * @param instruction - optional natural-language steer, used by chat-to-refine.
 * @returns array of places, or null if generation/parsing failed.
 */
export async function generateDay({
  location,
  budget,
  people,
  day,
  theme,
  date,
  instruction,
}) {
  const data = await requestJson({
    mode: 'day',
    location,
    budget,
    people,
    day,
    theme,
    date,
    instruction,
  })
  if (!data) return null
  // Accept either {plan:[...]} or a bare array, since small models drift.
  const plan = Array.isArray(data) ? data : data.plan
  return Array.isArray(plan) ? plan : null
}
