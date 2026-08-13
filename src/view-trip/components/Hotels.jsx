import React from 'react'
import HotelCard from './HotelCard'

const Hotels = ({ trip, hideHeading = false }) => {
  const hotels = trip?.hotelOptions ?? []
  if (hotels.length === 0) return null

  return (
    <div className={hideHeading ? '' : 'mt-8'}>
      {!hideHeading && <h2 className='font-bold text-xl'>Hotel Recommendations</h2>}

      <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 mt-3'>
        {hotels.map((hotel, index) => (
          <HotelCard hotel={hotel} key={`${hotel.hotelName}-${index}`} />
        ))}
      </div>
    </div>
  )
}

export default Hotels
