import React from 'react'
import { Link } from 'react-router-dom'
import { usePlacePhoto, handleImageError } from '@/hooks/usePlacePhoto';

const HotelCard = ({ hotel }) => {
    // Include the address so common chain names don't resolve to another city.
    const query = hotel?.hotelName
        ? [hotel.hotelName, hotel.hotelAddress].filter(Boolean).join(',')
        : null
    const photoUrl = usePlacePhoto(query)
    const mapsUrl = 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(query ?? '')

    return (
        <div>
            <Link to={mapsUrl} target='_blank'>
                <div className='hover:scale-110 transition-all cursor-pointer'>
                    <img
                        src={photoUrl}
                        onError={handleImageError}
                        alt={hotel?.hotelName ?? 'Hotel'}
                        className='rounded-xl h-[180px] w-full object-cover'
                    />
                    <div className='my-2 flex flex-col gap-2'>
                        <h2 className='font-medium'>{hotel?.hotelName}</h2>
                        <h2 className='text-sm text-gray-500'>📍 {hotel?.hotelAddress}</h2>
                        <h2 className='text-sm'>💸 {hotel?.price}</h2>
                        <h2 className='text-sm'>⭐ {hotel?.rating}</h2>
                    </div>
                </div>
            </Link>
        </div>
    )
}

export default HotelCard
