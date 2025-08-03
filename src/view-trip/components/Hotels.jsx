import React from 'react'
import { Link } from 'react-router-dom'
import HotelCard from './HotelCard'

const Hotels = ({trip}) => {
  return (
    <div>
      <h2 className='font-bold text-xl mt-5'>Hotel Recomendations</h2>

      <div className='grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-5'>
        {trip?.tripData?.hotelOptions.map((hotel,index)=>(
          <HotelCard hotel={hotel} key={index}/>
        ))}
      </div>
    </div>
  )
}

export default Hotels
