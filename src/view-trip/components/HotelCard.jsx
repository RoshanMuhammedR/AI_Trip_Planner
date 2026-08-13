import React from 'react'
import { usePlacePhoto, handleImageError } from '@/hooks/usePlacePhoto'
import { formatCost } from '@/lib/tripSchema'
import { mapsLink } from '@/lib/maps'
import { Card, CardContent } from '@/components/ui/card'

const HotelCard = ({ hotel }) => {
    // Include the address so common chain names don't resolve to another city.
    const query = hotel?.hotelName
        ? [hotel.hotelName, hotel.hotelAddress].filter(Boolean).join(', ')
        : null
    const photoUrl = usePlacePhoto(query)
    const price = formatCost(hotel?.price)

    return (
        <a
            href={mapsLink({ coordinates: hotel?.geoCoordinates, query })}
            target='_blank'
            rel='noreferrer'
            className='group block'
        >
            <Card className='overflow-hidden h-full py-0 gap-0 transition-shadow group-hover:shadow-md'>
                <img
                    src={photoUrl}
                    onError={handleImageError}
                    alt={hotel?.hotelName ?? 'Hotel'}
                    className='h-[180px] w-full object-cover'
                />
                <CardContent className='p-4 flex flex-col gap-1.5'>
                    <h3 className='font-medium leading-snug'>{hotel?.hotelName}</h3>
                    {hotel?.hotelAddress && (
                        <p className='text-sm text-muted-foreground line-clamp-2'>
                            📍 {hotel.hotelAddress}
                        </p>
                    )}
                    <div className='flex items-center gap-3 text-sm mt-1'>
                        {price && <span>💸 {price}</span>}
                        {hotel?.rating != null && <span>⭐ {hotel.rating}</span>}
                    </div>
                    {/* Previously generated, stored, and never shown. */}
                    {hotel?.description && (
                        <p className='text-sm text-muted-foreground line-clamp-3 mt-1'>
                            {hotel.description}
                        </p>
                    )}
                </CardContent>
            </Card>
        </a>
    )
}

export default HotelCard
