import { addDays, format, parseISO } from 'date-fns'

/** RFC 5545 requires these characters escaped in text values. */
function escapeText(value = '') {
  return String(value)
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n')
}

/**
 * Lines must not exceed 75 octets; continuations start with a single space.
 * Calendar apps reject files that ignore this on long descriptions.
 */
function foldLine(line) {
  if (line.length <= 75) return line
  const chunks = [line.slice(0, 75)]
  let rest = line.slice(75)
  while (rest.length > 74) {
    chunks.push(' ' + rest.slice(0, 74))
    rest = rest.slice(74)
  }
  if (rest) chunks.push(' ' + rest)
  return chunks.join('\r\n')
}

/**
 * One all-day event per itinerary day, with that day's places in the
 * description. Per-place timed events would mean inventing start times the
 * model never provided.
 *
 * @returns an .ics string, or null when the trip has no start date.
 */
export function buildTripIcs(trip) {
  if (!trip?.startDate) return null

  let start
  try {
    start = parseISO(trip.startDate)
  } catch {
    return null
  }

  const stamp = format(new Date(), "yyyyMMdd'T'HHmmss'Z'")
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//AI Trip Planner//EN',
    'CALSCALE:GREGORIAN',
  ]

  trip.itinerary.forEach((day, index) => {
    const dayStart = day.date ? parseISO(day.date) : addDays(start, index)
    const places = (day.plan ?? []).map((p) => p.placeName).filter(Boolean)

    const description = [
      day.bestTimeToVisit ? `Best time: ${day.bestTimeToVisit}` : null,
      places.length ? places.map((p, i) => `${i + 1}. ${p}`).join('\n') : null,
    ]
      .filter(Boolean)
      .join('\n')

    lines.push(
      'BEGIN:VEVENT',
      `UID:${trip.id}-day${day.day}@ai-trip-planner`,
      `DTSTAMP:${stamp}`,
      // All-day events use a DATE value, and DTEND is exclusive.
      `DTSTART;VALUE=DATE:${format(dayStart, 'yyyyMMdd')}`,
      `DTEND;VALUE=DATE:${format(addDays(dayStart, 1), 'yyyyMMdd')}`,
      foldLine(`SUMMARY:${escapeText(`Day ${day.day}: ${day.theme || trip.location}`)}`),
      foldLine(`LOCATION:${escapeText(trip.location)}`),
      description ? foldLine(`DESCRIPTION:${escapeText(description)}`) : null,
      'END:VEVENT'
    )
  })

  lines.push('END:VCALENDAR')
  return lines.filter(Boolean).join('\r\n')
}

export function downloadIcs(trip) {
  const ics = buildTripIcs(trip)
  if (!ics) return false

  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${(trip.location || 'trip').replace(/[^\w-]+/g, '-').toLowerCase()}.ics`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
  return true
}
