import React from 'react'
import PlaceCard from '@/components/custom/PlaceCard'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { formatDayDate } from '@/lib/tripSchema'
import { dayColor } from '@/lib/maps'
import DayRefinePopover from './DayRefinePopover'

/**
 * The scrolling itinerary. Replaces PlacesToVisit, adding per-day refine and
 * respecting the shared day filter.
 *
 * Place keys stay `${dayIndex}-${i}` and each card keeps id={`place-${key}`} —
 * useMapPoints builds the identical string and the map's scroll-to-card
 * depends on the two matching.
 */
const ItineraryPanel = ({
  trip,
  generatingDays,
  failedDays,
  onRetryDay,
  canRetry,
  activeKey,
  onHoverPlace,
  selectedDay,
  canRefine,
  onRefineDay,
  refining,
}) => {
  const itinerary = trip?.itinerary ?? []

  const visibleDays = itinerary
    .map((day, index) => ({ day, index }))
    .filter(({ index }) => selectedDay === null || index === selectedDay)

  return (
    <div className='px-4 pb-4'>
      {visibleDays.map(({ day, index }) => {
        const hasFailed = failedDays?.has(index)
        const isGenerating = generatingDays?.has(index)
        const dayDate = formatDayDate(day.date)

        return (
          <section key={day.day ?? index} className='pt-5' data-print-keep>
            <div className='flex items-start justify-between gap-2'>
              <div className='min-w-0'>
                <div className='flex items-baseline gap-2 flex-wrap'>
                  <span
                    className='size-2.5 shrink-0 rounded-full'
                    style={{ backgroundColor: dayColor(index) }}
                    aria-hidden='true'
                  />
                  <h3 className='font-bold text-lg'>Day {day.day}</h3>
                  {dayDate && <span className='text-sm text-muted-foreground'>{dayDate}</span>}
                </div>
                {day.theme && <p className='text-sm text-muted-foreground'>{day.theme}</p>}
                {day.bestTimeToVisit && (
                  <p className='text-xs text-muted-foreground mt-0.5'>
                    Best time: {day.bestTimeToVisit}
                  </p>
                )}
              </div>

              {canRefine && day.plan !== null && (
                <DayRefinePopover
                  dayIndex={index}
                  dayNumber={day.day}
                  onRefine={onRefineDay}
                  busy={refining}
                />
              )}
            </div>

            <div className='mt-3'>
              {day.plan === null ? (
                hasFailed ? (
                  <div className='rounded-xl border border-dashed p-5 text-center'>
                    <p className='text-sm text-muted-foreground'>
                      This day couldn’t be generated.
                    </p>
                    {canRetry && (
                      <Button variant='outline' size='sm' className='mt-3' onClick={() => onRetryDay?.(index)}>
                        Try again
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className='flex flex-col gap-3' aria-busy={isGenerating}>
                    {[...Array(2)].map((_, i) => (
                      <Skeleton key={i} className='h-[150px] w-full rounded-xl' />
                    ))}
                  </div>
                )
              ) : day.plan.length === 0 ? (
                <p className='text-sm text-muted-foreground'>No places suggested for this day.</p>
              ) : (
                <div className='flex flex-col gap-3'>
                  {day.plan.map((place, i) => {
                    const key = `${index}-${i}`
                    return (
                      <div key={key} id={`place-${key}`} data-print-keep>
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
            </div>
          </section>
        )
      })}
    </div>
  )
}

export default ItineraryPanel
