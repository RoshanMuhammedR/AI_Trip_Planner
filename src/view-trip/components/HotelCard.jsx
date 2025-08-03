import { GetPlaceDetails, PHOTO_REF_URL } from '@/services/GlobalAPI';
import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

const HotelCard = ({hotel}) => {
    const [photoUrl,setPhotoUrl] = useState();
    
    useEffect(()=>{
        hotel && GetPlacePhoto();
    },[hotel])
    const GetPlacePhoto = async ()=>{
        const data={
            textQuery:hotel?.hotelName
        }
        const result = await GetPlaceDetails(data);
        const photoName = result.data.places[0].photos[3].name;
        const PhotoURL=PHOTO_REF_URL.replace('{NAME}',photoName);
        setPhotoUrl(PhotoURL);
        
    }
    return (
        <div>
            <Link to={'https://www.google.com/maps/search/?api=1&query=' + hotel?.hotelName + ',' + hotel.hotelAddress} target='_blank'>
                <div className='hover:scale-110 transition-all cursor-pointer'>
                    <img src={photoUrl?photoUrl:'/placeholder.jpg'} className='rounded-xl h-[180px] w-full object-cover' />
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
