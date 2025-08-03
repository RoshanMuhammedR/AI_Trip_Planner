import React, { useEffect, useState } from 'react'
import { Button } from '../ui/button'
import { FaMapLocationDot } from "react-icons/fa6";
import { Link } from 'react-router-dom';
import { GetPlaceDetails, PHOTO_REF_URL } from '@/services/GlobalAPI';

const PlaceCard = ({place,trip_place}) => {

  const [photoUrl,setPhotoUrl] = useState();
      
      useEffect(()=>{
          place && GetPlacePhoto();
      },[place])
      const GetPlacePhoto = async ()=>{
          const data={
              textQuery:place.placeName+','+trip_place
          }
          const result = await GetPlaceDetails(data);
          const photoName = result.data.places[0].photos[3].name;
          const PhotoURL=PHOTO_REF_URL.replace('{NAME}',photoName);
          setPhotoUrl(PhotoURL);
      }
  return (
    <Link to={'https://www.google.com/maps/search/?api=1&query='+place.placeName+','+trip_place} target='_blank'>
        <div className='border rounded-xl p-3 mt-2 flex gap-5 hover:scale-105 transition-all hover:shadow'>
        <img src={photoUrl?photoUrl:'/placeholder.jpg'} className='size-[150px] rounded-xl object-cover' />
        <div className='flex flex-col gap-2'>
            <h2 className='font-bold text-lg'>{place.placeName}</h2>
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
