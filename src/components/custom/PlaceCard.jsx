import React from 'react'
import { Button } from '../ui/button'
import { FaMapLocationDot } from "react-icons/fa6";
import { Link } from 'react-router-dom';
import { usePlacePhoto, handleImageError } from '@/hooks/usePlacePhoto';

const PlaceCard = ({ place, trip_place }) => {
  const query = place?.placeName ? `${place.placeName},${trip_place}` : null
  const photoUrl = usePlacePhoto(query)
  const mapsUrl = 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(query ?? '')

  return (
    <Link to={mapsUrl} target='_blank'>
      <div className='border rounded-xl p-3 mt-2 flex flex-col lg:flex-row gap-5 hover:scale-105 transition-all hover:shadow'>
        <img
          src={photoUrl}
          onError={handleImageError}
          alt={place?.placeName ?? 'Place'}
          className='size-[150px] rounded-xl object-cover'
        />
        <div className='flex flex-col gap-2'>
          <h2 className='font-bold text-lg'>{place?.placeName}</h2>
          <p className='text-sm text-gray-600'>{place?.placeDetails}</p>
          <h2 className='mt-2'>⏰ {place?.timeToTravel}</h2>
          <div>
            <Button>
              <FaMapLocationDot />
            </Button>
          </div>
        </div>
      </div>
    </Link>
  )
}

export default PlaceCard
