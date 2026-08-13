import { useCallback, useRef, useState } from 'react'
import { doc, updateDoc } from 'firebase/firestore'
import { toast } from 'sonner'
import { db } from '@/services/firebaseConfig'
import { generateDay } from '@/services/AIModel'

/**
 * Regenerates a single day from a natural-language instruction.
 *
 * Writes only after a successful parse — a failed refine leaves the existing
 * day untouched rather than replacing it with nothing. The previous plan is
 * kept in memory so the change can be undone.
 */
export function useTripRefine({ trip, tripId, onDayChanged }) {
  const [busy, setBusy] = useState(false)
  const writeQueueRef = useRef(Promise.resolve())

  const persist = useCallback(
    (itinerary) => {
      writeQueueRef.current = writeQueueRef.current
        .then(() => updateDoc(doc(db, 'AITrips', tripId), { 'tripData.itinerary': itinerary }))
        .catch((error) => {
          console.error('Failed to save refined day:', error)
          toast.error('Saved locally but could not sync that change.')
        })
      return writeQueueRef.current
    },
    [tripId]
  )

  const refineDay = useCallback(
    async (dayIndex, instruction) => {
      const day = trip?.itinerary?.[dayIndex]
      if (!day || busy) return

      const previousPlan = day.plan
      setBusy(true)
      try {
        const plan = await generateDay({
          location: trip.location,
          budget: trip.budget,
          people: trip.travelerType,
          day: day.day,
          theme: day.theme,
          date: day.date,
          instruction,
        })

        if (!plan) {
          toast.error('Could not apply that change. The day is unchanged.')
          return
        }

        const next = trip.itinerary.map((d, i) => (i === dayIndex ? { ...d, plan } : d))
        onDayChanged(dayIndex, plan)
        await persist(next)

        toast.success(`Day ${day.day} updated`, {
          action: {
            label: 'Undo',
            onClick: () => {
              const reverted = trip.itinerary.map((d, i) =>
                i === dayIndex ? { ...d, plan: previousPlan } : d
              )
              onDayChanged(dayIndex, previousPlan)
              persist(reverted)
            },
          },
        })
      } catch (error) {
        console.error('Refine failed:', error)
        toast.error(error.message ?? 'Could not apply that change.')
      } finally {
        setBusy(false)
      }
    },
    [trip, busy, onDayChanged, persist]
  )

  return { refineDay, busy }
}
