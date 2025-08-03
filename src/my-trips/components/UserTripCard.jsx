import { GetPlaceDetails, PHOTO_REF_URL } from '@/services/GlobalAPI';
import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom';

const UserTripCard = ({ trip }) => {
    const location = trip?.tripData?.location;
    const budget = trip?.tripData?.budget;
    const days = trip?.tripData?.duration;


    const [photoUrl, setPhotoUrl] = useState();
    useEffect(() => {
        trip && GetPlacePhoto();
    }, [trip])
    const GetPlacePhoto = async () => {
        const data = {
            textQuery: location
        }
        const result = await GetPlaceDetails(data);
        const photoName = result.data.places[0].photos[3].name;
        const PhotoURL = PHOTO_REF_URL.replace('{NAME}', photoName);
        setPhotoUrl(PhotoURL);
    }


    return (
        <Link to={'/view-trip/'+trip?.id}>
            <div className='hover:scale-105 hover:shadow-md transition-all'>
                <img src={photoUrl ? photoUrl : '/placeholder.jpg'} className='object-cover rounded-xl w-[500px] h-[300px]' />
                <div>
                    <h2 className='font-bold text-lg'>{location}</h2>
                    <h2>{`${days} ${days == '1' ? 'Day' : 'Days'} trip with ${budget} budget`}</h2>
                </div>
            </div>
        </Link>
    )
}

export default UserTripCard
