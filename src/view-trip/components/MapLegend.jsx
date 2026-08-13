import { dayColor } from '@/lib/maps'

/**
 * Colour key for the day markers, doubling as a filter. Without this the pin
 * colours carry no meaning — you can see there are five colours but not which
 * day each one is.
 */
const MapLegend = ({
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
    <div className='flex flex-wrap items-center gap-1.5 border-t bg-card p-2'>
      {dayNumbers.map((dayIndex) => {
        const isSelected = selectedDay === dayIndex
        return (
          <button
            key={dayIndex}
            type='button'
            // Clicking the selected day again clears the filter.
            onClick={() => onSelectDay(isSelected ? null : dayIndex)}
            aria-pressed={isSelected}
            className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition-colors
              ${isSelected ? 'border-primary bg-accent font-medium' : 'hover:bg-accent'}
              ${selectedDay !== null && !isSelected ? 'opacity-50' : ''}`}
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
          className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition-colors
            ${showHotels ? 'border-primary bg-accent font-medium' : 'hover:bg-accent opacity-60'}`}
        >
          <span className='size-2.5 rotate-45 rounded-[2px] bg-gray-900' />
          Hotels
        </button>
      )}
    </div>
  )
}

export default MapLegend
