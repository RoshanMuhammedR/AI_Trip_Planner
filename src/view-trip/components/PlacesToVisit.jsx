import PlaceCard from '@/components/custom/PlaceCard'
import React from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { formatDayDate } from '@/lib/tripSchema'

const PlacesToVisit = ({
  trip,
  generatingDays,
  failedDays,
  onRetryDay,
  canRetry,
  activeKey,
  onHoverPlace,
}) => {
  const itinerary = trip?.itinerary ?? []

  return (
    <div className='mt-8'>
      <h2 className='font-bold text-xl'>Places To Visit</h2>

      <div>
        {itinerary.map((day, index) => {
          const isGenerating = generatingDays?.has(index)
          const hasFailed = failedDays?.has(index)
          const dayDate = formatDayDate(day.date)

          return (
            <section key={day.day ?? index} className='mt-6'>
              <div className='flex items-baseline gap-3 flex-wrap'>
                <h3 className='font-bold text-lg'>Day {day.day}</h3>
                {dayDate && <span className='text-sm text-gray-500'>{dayDate}</span>}
              </div>
              {day.theme && <p className='text-gray-600'>{day.theme}</p>}
              {day.bestTimeToVisit && (
                <p className='text-sm text-gray-700 mb-3'>
                  <span className='font-semibold'>Best Time to Visit:</span> {day.bestTimeToVisit}
                </p>
              )}

              {day.plan === null ? (
                hasFailed ? (
                  <div className='rounded-xl border border-dashed p-6 text-center'>
                    <p className='text-sm text-gray-600'>
                      This day couldn’t be generated.
                    </p>
                    {canRetry && (
                      <Button
                        variant='outline'
                        className='mt-3'
                        onClick={() => onRetryDay?.(index)}
                      >
                        Try again
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className='grid md:grid-cols-2 gap-5' aria-busy={isGenerating}>
                    {[...Array(2)].map((_, i) => (
                      <Skeleton key={i} className='h-[176px] w-full rounded-xl' />
                    ))}
                  </div>
                )
              ) : day.plan.length === 0 ? (
                <p className='text-sm text-gray-500'>No places suggested for this day.</p>
              ) : (
                <div className='grid md:grid-cols-2 gap-5'>
                  {day.plan.map((place, i) => {
                    // Must match the key TripMap builds for its markers.
                    const key = `${index}-${i}`
                    return (
                      <div key={key} id={`place-${key}`}>
                        <PlaceCard
                          place={place}
                          trip_place={trip.location}
                          isActive={activeKey === key}
                          onHover={(p) => onHoverPlace?.(p ? key : null)}
                        />
                      </div>
                    )
                  })}
                </div>
              )}
            </section>
          )
        })}
      </div>
    </div>
  )
}

export default PlacesToVisit
