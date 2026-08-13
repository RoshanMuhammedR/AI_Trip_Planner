import {
  AICREDITS_BASE_URL,
  MODEL,
  buildSkeletonMessages,
  buildDayMessages,
} from './_prompts.js'

const MAX_DAYS = 7
const MAX_TEXT = 200

/**
 * Server-side proxy to the AICredits gateway.
 *
 * The API key lives here (as AICREDITS_API_KEY, deliberately WITHOUT the VITE_
 * prefix) so Vite can never inline it into the client bundle. Callers send trip
 * parameters, not prompts — see api/_prompts.js.
 *
 * Modes:
 *   skeleton - trip shell: hotels + day themes. One call, fast.
 *   day      - the plan array for a single day. Fired in parallel, one per day.
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const apiKey = process.env.AICREDITS_API_KEY
  if (!apiKey) {
    console.error('AICREDITS_API_KEY is not set')
    return res.status(500).json({ error: 'Server is not configured for trip generation.' })
  }

  const body = req.body ?? {}
  const { mode } = body

  let messages
  try {
    messages = buildMessages(mode, body)
  } catch (error) {
    return res.status(400).json({ error: error.message })
  }

  try {
    const content = await callModel({ apiKey, messages })
    return res.status(200).json({ content })
  } catch (error) {
    console.error('Trip generation failed:', error)
    const status = error.status === 502 ? 502 : 500
    return res.status(status).json({ error: 'Trip generation service is unavailable.' })
  }
}

function requireText(value, field) {
  if (!value || typeof value !== 'string' || value.length > MAX_TEXT) {
    throw new Error(`A valid ${field} is required.`)
  }
  return value
}

function buildMessages(mode, body) {
  if (mode === 'skeleton') {
    const days = Number(body.noOfDays)
    if (!Number.isFinite(days) || days < 1 || days > MAX_DAYS) {
      throw new Error(`Number of days must be between 1 and ${MAX_DAYS}.`)
    }
    return buildSkeletonMessages({
      location: requireText(body.location, 'location'),
      budget: requireText(body.budget, 'budget'),
      people: requireText(body.people, 'traveller count'),
      noOfDays: days,
      startDate: typeof body.startDate === 'string' ? body.startDate.slice(0, 10) : null,
    })
  }

  if (mode === 'day') {
    const day = Number(body.day)
    if (!Number.isFinite(day) || day < 1 || day > MAX_DAYS) {
      throw new Error('Invalid day number.')
    }
    return buildDayMessages({
      location: requireText(body.location, 'location'),
      budget: requireText(body.budget, 'budget'),
      people: requireText(body.people, 'traveller count'),
      day,
      theme: typeof body.theme === 'string' ? body.theme.slice(0, MAX_TEXT) : null,
      date: typeof body.date === 'string' ? body.date.slice(0, 10) : null,
      // Free-text from the refine bar — capped, and it only ever lands inside a
      // day-plan request, so it can't repurpose the endpoint.
      instruction:
        typeof body.instruction === 'string' ? body.instruction.slice(0, MAX_TEXT) : null,
    })
  }

  throw new Error('Unknown generation mode.')
}

async function callModel({ apiKey, messages, allowJsonMode = true }) {
  const payload = {
    model: MODEL,
    messages,
    ...(allowJsonMode ? { response_format: { type: 'json_object' } } : {}),
  }

  const upstream = await fetch(`${AICREDITS_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  if (!upstream.ok) {
    const detail = await upstream.text()
    // Not every OpenAI-compatible gateway supports response_format. If that's
    // what it rejected, retry once without it — the prompt also asks for JSON.
    if (allowJsonMode && (upstream.status === 400 || upstream.status === 422)) {
      console.warn('response_format rejected, retrying without it:', detail.slice(0, 200))
      return callModel({ apiKey, messages, allowJsonMode: false })
    }
    console.error('AICredits error', upstream.status, detail.slice(0, 500))
    const error = new Error('Upstream error')
    error.status = 502
    throw error
  }

  const data = await upstream.json()
  return data?.choices?.[0]?.message?.content ?? ''
}
