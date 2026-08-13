import { AICREDITS_BASE_URL, MODEL, buildTripMessages } from './_prompts.js'

const MAX_DAYS = 5

/**
 * Server-side proxy to the AICredits gateway.
 *
 * The API key lives here (as AICREDITS_API_KEY, deliberately WITHOUT the VITE_
 * prefix) so Vite can never inline it into the client bundle. Callers send trip
 * parameters, not prompts — see api/_prompts.js.
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

  const { location, noOfDays, budget, people } = req.body ?? {}

  // Validate before spending credits — these all come from the client.
  const days = Number(noOfDays)
  if (!location || typeof location !== 'string' || location.length > 200) {
    return res.status(400).json({ error: 'A valid location is required.' })
  }
  if (!Number.isFinite(days) || days < 1 || days > MAX_DAYS) {
    return res.status(400).json({ error: `Number of days must be between 1 and ${MAX_DAYS}.` })
  }
  if (!budget || !people) {
    return res.status(400).json({ error: 'Budget and traveller count are required.' })
  }

  try {
    const upstream = await fetch(`${AICREDITS_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: MODEL,
        messages: buildTripMessages({ location, noOfDays: days, budget, people }),
      }),
    })

    if (!upstream.ok) {
      const detail = await upstream.text()
      console.error('AICredits error', upstream.status, detail)
      // Don't leak upstream error bodies to the browser.
      return res.status(502).json({ error: 'Trip generation service is unavailable.' })
    }

    const data = await upstream.json()
    const content = data?.choices?.[0]?.message?.content ?? ''
    return res.status(200).json({ content })
  } catch (error) {
    console.error('Trip generation failed:', error)
    return res.status(500).json({ error: 'Trip generation failed.' })
  }
}
