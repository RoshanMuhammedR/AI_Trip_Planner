import { Button } from '@/components/ui/button';
import { GetPlaceDetails, PHOTO_REF_URL } from '@/services/GlobalAPI';
import React, { useEffect, useState } from 'react'
import { IoIosSend } from "react-icons/io";


const InfoSection = ({trip}) => {
    const [photoUrl,setPhotoUrl] = useState();

    useEffect(()=>{
        trip && GetPlacePhoto();
    },[trip])
    const GetPlacePhoto = async ()=>{
        const data={
            textQuery:trip?.userSelection?.location
        }
        const result = await GetPlaceDetails(data);
        const photoName = result.data.places[0].photos[3].name;
        const PhotoURL=PHOTO_REF_URL.replace('{NAME}',photoName);
        setPhotoUrl(PhotoURL);
        
    }
  return (
    <div>
      <img src={photoUrl?photoUrl:'/placeholder.jpg'}  className='h-[340px] w-full object-cover rounded-xl'/>

    <div className='flex justify-between items-center'>
        <div className='my-5 flex flex-col gap-2'>
            <h2 className='font-bold text-2xl'>{trip?.userSelection?.location}</h2>
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
