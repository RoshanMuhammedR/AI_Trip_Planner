import React from 'react'
import { Link } from 'react-router-dom';
import { usePlacePhoto, handleImageError } from '@/hooks/usePlacePhoto';

const UserTripCard = ({ trip }) => {
    const location = trip?.tripData?.location;
    const budget = trip?.tripData?.budget;
    const days = trip?.tripData?.duration;

    const photoUrl = usePlacePhoto(location)

    return (
        <Link to={'/view-trip/' + trip?.id}>
            <div className='hover:scale-105 hover:shadow-md transition-all'>
                <img
                    src={photoUrl}
                    onError={handleImageError}
                    alt={location ?? 'Trip'}
                    className='object-cover rounded-xl w-full h-[300px]'
                />
                <div>
                    <h2 className='font-bold text-lg'>{location}</h2>
                    <h2>{`${days} ${days == '1' ? 'Day' : 'Days'} trip with ${budget} budget`}</h2>
                </div>
            </div>
        </Link>
    )
}

export default UserTripCard
