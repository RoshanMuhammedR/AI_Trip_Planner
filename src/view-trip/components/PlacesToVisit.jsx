import PlaceCard from '@/components/custom/PlaceCard'
import React from 'react'

const PlacesToVisit = ({trip}) => {
  return (
    <div>
      <h2 className="font-bold text-lg">Places To Visit</h2>
      
      <div>
        {trip?.tripData.itinerary.map((Day,index)=>(
            <div key={index} className='mt-3'>
                <h2 className='font-bold text-lg'>Day {Day.day}</h2>
                <p className='text-gray-600'>{Day.theme}</p>
                <p className="text-sm text-gray-700 mb-3">
                    <span className="font-semibold">Best Time to Visit:</span> {Day.bestTimeToVisit}
                </p>
                <div className='grid md:grid-cols-2 gap-5'>
                    {Day.plan?.map((place,index)=>(
                        <div key={index}>
                            {trip&&<PlaceCard place={place} trip_place={trip?.tripData.location}/>}                        
                        </div>
                    ))}
                </div>
                
            </div>
        ))}
      </div>
    </div>
  )
}

export default PlacesToVisit
