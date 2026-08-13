import { Button } from '@/components/ui/button';
import React from 'react'
import { IoIosSend } from "react-icons/io";
import { usePlacePhoto, handleImageError } from '@/hooks/usePlacePhoto';


const InfoSection = ({ trip }) => {
  const location = trip?.userSelection?.location
  const photoUrl = usePlacePhoto(location)

  return (
    <div>
      <img
        src={photoUrl}
        onError={handleImageError}
        alt={location ?? 'Trip destination'}
        className='h-[340px] w-full object-cover rounded-xl'
      />

      <div className='flex justify-between items-center'>
        <div className='my-5 flex flex-col gap-2'>
          <h2 className='font-bold text-2xl'>{location}</h2>
          <div className='flex flex-col gap-5 mt-3 lg:flex-row text-lg'>
            <h2 className='p-1 px-3 bg-gray-200 rounded-full text-gray-500 '>
              📅 {trip?.userSelection?.noOfDays} Day(s)
            </h2>
            <h2 className='p-1 px-3 bg-gray-200 rounded-full text-gray-500 '>
              💰 {trip?.userSelection?.budget} Budget
            </h2>
            <h2 className='p-1 px-3 bg-gray-200 rounded-full text-gray-500 '>
              👤 No. Of Travellers - {trip?.userSelection?.people}
            </h2>
          </div>
        </div>
        <Button><IoIosSend /></Button>
      </div>

    </div>
  )
}

export default InfoSection
