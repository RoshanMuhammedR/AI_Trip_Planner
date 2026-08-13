import axios from 'axios'

/**
 * Requests a trip plan from our own serverless endpoint, which holds the
 * AICredits key and builds the prompt. The client never sees either.
 *
 * @returns the parsed travelPlan object, or null if generation/parsing failed.
 */
export async function generateTrip({ location, noOfDays, budget, people }) {
  let content
  try {
    const response = await axios.post('/api/generate', { location, noOfDays, budget, people })
    content = response.data?.content ?? ''
  } catch (error) {
    // Surface the server's user-facing message when it sent one.
    const message = error.response?.data?.error ?? 'Could not reach the trip generator.'
    throw new Error(message)
  }

  // The model usually wraps JSON in a ```json fence, but not always.
  const jsonMatch = content.match(/```json([\s\S]*?)```/)
  const jsonString = jsonMatch ? jsonMatch[1].trim() : content.trim()

  try {
    const jsonData = JSON.parse(jsonString)
    return jsonData?.travelPlan ?? null
  } catch (e) {
    console.error('Failed to parse trip JSON:', e, content)
    return null
  }
}
