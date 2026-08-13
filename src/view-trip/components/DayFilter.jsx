import { dayColor } from '@/lib/maps'

/**
 * The single day-scoping control for the workspace: it filters the itinerary
 * list and the map pins/routes together, and doubles as the colour key for the
 * markers. Previously the map carried its own legend+filter while the panel
 * would have needed day tabs — two controls doing one job.
 */
const DayFilter = ({
  dayNumbers,
  itinerary,
  selectedDay,
  onSelectDay,
  hasHotels,
  showHotels,
  onToggleHotels,
}) => {
  if (dayNumbers.length === 0) return null

  return (
    <div className='flex flex-wrap items-center gap-1.5' data-print-hide>
      <button
        type='button'
        onClick={() => onSelectDay(null)}
        aria-pressed={selectedDay === null}
        className={`rounded-full border px-2.5 py-1 text-xs transition-colors
          ${selectedDay === null ? 'border-primary bg-accent font-medium' : 'hover:bg-accent'}`}
      >
        All days
      </button>

      {dayNumbers.map((dayIndex) => {
        const isSelected = selectedDay === dayIndex
        return (
          <button
            key={dayIndex}
            type='button'
            // Clicking the active day again clears the filter.
            onClick={() => onSelectDay(isSelected ? null : dayIndex)}
            aria-pressed={isSelected}
            className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition-colors
              ${isSelected ? 'border-primary bg-accent font-medium' : 'hover:bg-accent'}`}
          >
            <span
              className='size-2.5 rounded-full'
              style={{ backgroundColor: dayColor(dayIndex) }}
            />
            Day {itinerary?.[dayIndex]?.day ?? dayIndex + 1}
          </button>
        )
      })}

      {hasHotels && (
        <button
          type='button'
          onClick={() => onToggleHotels(!showHotels)}
          aria-pressed={showHotels}
          className={`ml-auto flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition-colors
            ${showHotels ? 'border-primary bg-accent font-medium' : 'hover:bg-accent opacity-60'}`}
        >
          <span className='size-2.5 rotate-45 rounded-[2px] bg-gray-900' />
          Hotels
        </button>
      )}
    </div>
  )
}

export default DayFilter
