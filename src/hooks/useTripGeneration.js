import { useEffect, useRef, useState } from 'react'
import { doc, updateDoc } from 'firebase/firestore'
import { db } from '@/services/firebaseConfig'
import { generateDay } from '@/services/AIModel'
import { pendingDayIndices } from '@/lib/tripSchema'

/**
 * Fills in any day whose plan is still null, one request per day in parallel.
 *
 * Generation continues on the trip page rather than the create form, so a
 * reload mid-generation resumes wherever it left off instead of leaving a
 * permanently half-built trip.
 *
 * @param onDayGenerated - (index, plan) => void, so the page can render each
 *   day the moment it lands rather than waiting for the Firestore round-trip.
 */
export function useTripGeneration({ trip, tripId, isOwner, onDayGenerated }) {
  const startedRef = useRef(new Set())
  // Firestore can't address an array index in a field path, so each write sends
  // the whole itinerary. Serializing them stops a slow write from clobbering a
  // faster one with a stale array.
  const writeQueueRef = useRef(Promise.resolve())
  const itineraryRef = useRef(null)
  const [generatingDays, setGeneratingDays] = useState(() => new Set())
  const [failedDays, setFailedDays] = useState(() => new Set())

  useEffect(() => {
    if (!trip || !tripId || !isOwner) return

    const pending = pendingDayIndices(trip).filter((i) => !startedRef.current.has(i))
    if (pending.length === 0) return

    itineraryRef.current ??= trip.itinerary.map((d) => ({ ...d }))

    const queueWrite = () => {
      const snapshot = itineraryRef.current.map((d) => ({ ...d }))
      writeQueueRef.current = writeQueueRef.current
        .then(() => updateDoc(doc(db, 'AITrips', tripId), { 'tripData.itinerary': snapshot }))
        .catch((error) => console.error('Failed to persist generated day:', error))
      return writeQueueRef.current
    }

    pending.forEach((index) => {
      startedRef.current.add(index)
      setGeneratingDays((prev) => new Set(prev).add(index))

      const day = trip.itinerary[index]

      generateDay({
        location: trip.location,
        budget: trip.budget,
        people: trip.travelerType,
        day: day.day,
        theme: day.theme,
        date: day.date,
      })
        .then((plan) => {
          if (!plan) {
            setFailedDays((prev) => new Set(prev).add(index))
            return
          }
          itineraryRef.current[index] = { ...itineraryRef.current[index], plan }
          onDayGenerated?.(index, plan)
          return queueWrite()
        })
        .catch((error) => {
          console.error(`Day ${day.day} generation failed:`, error)
          setFailedDays((prev) => new Set(prev).add(index))
        })
        .finally(() => {
          setGeneratingDays((prev) => {
            const next = new Set(prev)
            next.delete(index)
            return next
          })
        })
    })
  }, [trip, tripId, isOwner, onDayGenerated])

  /** Lets the user retry a day that came back unparseable. */
  const retryDay = (index) => {
    startedRef.current.delete(index)
    setFailedDays((prev) => {
      const next = new Set(prev)
      next.delete(index)
      return next
    })
  }

  return { generatingDays, failedDays, retryDay }
}
