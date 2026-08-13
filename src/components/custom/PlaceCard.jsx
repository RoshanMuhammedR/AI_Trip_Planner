import React from 'react'
import { usePlaceLookup, handleImageError } from '@/hooks/usePlacePhoto'
import { formatCost } from '@/lib/tripSchema'
import { mapsLink } from '@/lib/maps'
import { Card } from '@/components/ui/card'

const PlaceCard = ({ place, trip_place, onHover, isActive }) => {
  const query = place?.placeName ? `${place.placeName}, ${trip_place}` : null
  const { photoUrl, placeId } = usePlaceLookup(query)
  const price = formatCost(place?.ticketPricing)

  return (
    <a
      href={mapsLink({ coordinates: place?.geoCoordinates, query, placeId })}
      target='_blank'
      rel='noreferrer'
      className='group block h-full'
      onMouseEnter={() => onHover?.(place)}
      onMouseLeave={() => onHover?.(null)}
    >
      <Card
        className={`h-full p-3 flex-row gap-4 transition-shadow group-hover:shadow-md ${
          isActive ? 'ring-2 ring-primary' : ''
        }`}
      >
        <img
          src={photoUrl}
          onError={handleImageError}
          alt={place?.placeName ?? 'Place'}
          className='size-[130px] shrink-0 rounded-lg object-cover'
        />
        <div className='flex flex-col gap-1.5 min-w-0'>
          <h4 className='font-bold leading-snug'>{place?.placeName}</h4>
          <p className='text-sm text-muted-foreground line-clamp-3'>{place?.placeDetails}</p>
          <div className='flex items-center gap-3 text-sm mt-auto pt-1 flex-wrap'>
            {place?.timeToTravel && <span>⏰ {place.timeToTravel}</span>}
          </div>
          <div className='flex items-center gap-3 text-sm flex-wrap'>
            {/* ticketPricing and rating were generated and stored but never shown. */}
            {price && <span>🎟️ {price === '$0' || price === '0' ? 'Free' : price}</span>}
            {place?.rating != null && <span>⭐ {place.rating}</span>}
          </div>
        </div>
      </Card>
    </a>
  )
}

export default PlaceCard
