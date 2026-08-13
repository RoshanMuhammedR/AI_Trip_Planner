import React from 'react'
import { Link } from 'react-router-dom'
import { usePlacePhoto, handleImageError } from '@/hooks/usePlacePhoto'
import { Card, CardContent } from '@/components/ui/card'
import { formatDayDate } from '@/lib/tripSchema'

const UserTripCard = ({ trip, actions }) => {
    const photoUrl = usePlacePhoto(trip?.location)
    const days = trip?.duration
    const startDate = formatDayDate(trip?.startDate)

    return (
        <Card className='overflow-hidden py-0 gap-0 h-full transition-shadow hover:shadow-md'>
            <Link to={'/view-trip/' + trip?.id}>
                <img
                    src={photoUrl}
                    onError={handleImageError}
                    alt={trip?.location ?? 'Trip'}
                    className='object-cover w-full h-[200px]'
                />
            </Link>
            <CardContent className='p-4 flex items-start justify-between gap-2'>
                <Link to={'/view-trip/' + trip?.id} className='min-w-0'>
                    <h3 className='font-bold text-lg truncate'>{trip?.location}</h3>
                    <p className='text-sm text-muted-foreground'>
                        {`${days} ${days === 1 ? 'day' : 'days'} · ${trip?.budget} budget`}
                    </p>
                    {startDate && (
                        <p className='text-sm text-muted-foreground'>From {startDate}</p>
                    )}
                </Link>
                {actions}
            </CardContent>
        </Card>
    )
}

export default UserTripCard
