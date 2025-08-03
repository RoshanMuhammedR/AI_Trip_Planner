import { db } from '@/services/firebaseConfig';
import { collection, getDocs, query, where } from 'firebase/firestore';
import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom';
import UserTripCard from './components/UserTripCard';
const MyTrips = () => {
    const navigate = useNavigate();
    const [trips, setTrips] = useState([]);
    useEffect(() => {
        getUserTrips();
    }, [])

    const getUserTrips = async () => {
        const user = JSON.parse(localStorage.getItem('user'));
        console.log(user);

        if (!user) {
            navigate('/');
            return;
        }
        const q = query(collection(db, 'AITrips'), where("userEmail", '==', user?.email));
        const querySnapShot = await getDocs(q);
        setTrips([]);
        querySnapShot.forEach((doc, idx) => {
            setTrips(prevVal => [...prevVal, doc.data()]);
        })
    }
    return (

        <div className='px-5 sm:px-10 md:px-20 lg:px-32 xl:px-56 2xl:px-72 mt-10'>
            <h2 className='font-bold text-3xl'>My Trips</h2>

            <div className='grid grid-cols-1 md:grid-cols-3 gap-5 mt-10'>
                {trips?.length > 0 ? (
                    trips.map((trip, idx) => (
                        <UserTripCard key={idx} trip={trip} />
                    ))
                ) : (
                    [...Array(6)].map((_, idx) => (
                        <div key={idx} className='h-[300px] w-full bg-slate-200 animate-pulse rounded-xl'></div>
                    ))
                )}

            </div>
        </div>
    )
}

export default MyTrips
