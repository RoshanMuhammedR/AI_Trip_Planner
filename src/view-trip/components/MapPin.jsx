import { dayColor } from '@/lib/maps'

/**
 * Pin rendered inside an AdvancedMarker. Being real DOM (rather than a canvas
 * symbol) is the reason AdvancedMarker was worth a Map ID: hover and active
 * states are plain CSS transitions, and the active marker just re-renders
 * instead of the whole marker set being rebuilt.
 */
const MapPin = ({ point, isActive }) => {
  const isHotel = point.kind === 'hotel'
  const color = isHotel ? '#111827' : dayColor(point.dayIndex)

  if (isHotel) {
    // Diamond, so hotels read as a different class of thing at a glance.
    return (
      <div
        className={`flex items-center justify-center transition-transform duration-150
          ${isActive ? 'scale-125' : 'hover:scale-110'}`}
        title={point.name}
      >
        <div
          className='size-5 rotate-45 rounded-[3px] border-2 border-white shadow-md'
          style={{ backgroundColor: color }}
        />
      </div>
    )
  }

  return (
    <div
      className={`relative flex flex-col items-center transition-transform duration-150 origin-bottom
        ${isActive ? 'scale-125 z-10' : 'hover:scale-110'}`}
      title={`Day ${point.day}: ${point.name}`}
    >
      <div
        className='flex size-7 items-center justify-center rounded-full border-2 border-white text-xs font-bold text-white shadow-md'
        style={{ backgroundColor: color }}
      >
        {point.order}
      </div>
      {/* Tail, so the pin points at its exact coordinate. */}
      <div
        className='-mt-[3px] size-0 border-x-[5px] border-t-[7px] border-x-transparent'
        style={{ borderTopColor: color }}
      />
    </div>
  )
}

export default MapPin
