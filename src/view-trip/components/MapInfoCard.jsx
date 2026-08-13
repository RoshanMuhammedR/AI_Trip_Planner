import { usePlacePhoto, handleImageError } from '@/hooks/usePlacePhoto'
import { formatCost } from '@/lib/tripSchema'
import { mapsLink } from '@/lib/maps'
import { ExternalLink, CornerDownRight } from 'lucide-react'

/** Contents of the InfoWindow shown when a marker is clicked. */
const MapInfoCard = ({ point, tripLocation, onScrollToCard }) => {
  const isHotel = point.kind === 'hotel'
  const data = point.place
  const query = isHotel
    ? [data.hotelName, data.hotelAddress].filter(Boolean).join(', ')
    : `${data.placeName}, ${tripLocation}`
  const photoUrl = usePlacePhoto(query)
  const cost = formatCost(isHotel ? data.price : data.ticketPricing)

  return (
    <div className='w-[220px]'>
      <img
        src={photoUrl}
        onError={handleImageError}
        alt={point.name}
        className='h-[110px] w-full rounded-md object-cover'
      />
      <h4 className='mt-2 font-semibold leading-snug text-[13px] text-gray-900'>
        {point.name}
      </h4>

      <div className='mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[12px] text-gray-600'>
        {!isHotel && <span>Day {point.day}</span>}
        {data.rating != null && <span>⭐ {data.rating}</span>}
        {cost && <span>{isHotel ? '💸' : '🎟️'} {cost === '$0' ? 'Free' : cost}</span>}
      </div>

      <div className='mt-2 flex flex-col gap-1'>
        {/* Hotels have no itinerary card to scroll to. */}
        {!isHotel && (
          <button
            type='button'
            onClick={() => onScrollToCard?.(point)}
            className='flex items-center gap-1.5 text-[12px] font-medium text-primary hover:underline'
          >
            <CornerDownRight className='size-3.5' />
            Show in itinerary
          </button>
        )}
        <a
          href={mapsLink({ coordinates: { latitude: point.lat, longitude: point.lng }, query })}
          target='_blank'
          rel='noreferrer'
          className='flex items-center gap-1.5 text-[12px] font-medium text-primary hover:underline'
        >
          <ExternalLink className='size-3.5' />
          Open in Google Maps
        </a>
      </div>
    </div>
  )
}

export default MapInfoCard
