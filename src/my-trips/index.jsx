import { db } from '@/services/firebaseConfig';
import { collection, getDocs, query, where } from 'firebase/firestore';
import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import UserTripCard from './components/UserTripCard';
import Container from '@/components/layout/Container';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';

const MyTrips = () => {
    const navigate = useNavigate();
    const { user, initializing } = useAuth();
    const [trips, setTrips] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Wait for Firebase to resolve auth before deciding to redirect,
        // otherwise a signed-in user gets bounced on first paint.
        if (initializing) return;
        if (!user) {
            navigate('/');
            return;
        }

        let cancelled = false;

        const getUserTrips = async () => {
            setLoading(true);
            try {
                // Query by email (not uid) so trips saved before the auth
                // migration still belong to their owner.
                const q = query(collection(db, 'AITrips'), where('userEmail', '==', user.email));
                const snapshot = await getDocs(q);
                if (cancelled) return;
                // Collect then set once — appending per-doc duplicated entries
                // under StrictMode's double mount.
                setTrips(snapshot.docs.map((doc) => doc.data()));
            } catch (error) {
                console.error('Failed to load trips:', error);
                if (!cancelled) toast.error('Could not load your trips.');
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        getUserTrips();
        return () => { cancelled = true };
    }, [user, initializing, navigate]);

    return (
        <Container className='mt-10'>
            <h2 className='font-bold text-3xl'>My Trips</h2>

            {loading ? (
                <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5 mt-10'>
                    {[...Array(6)].map((_, idx) => (
                        <div key={idx} className='h-[300px] w-full bg-slate-200 animate-pulse rounded-xl' />
                    ))}
                </div>
            ) : trips.length === 0 ? (
                <div className='mt-16 text-center'>
                    <p className='text-lg font-medium'>No trips yet</p>
                    <p className='mt-2 text-gray-500'>Plan your first one and it’ll show up here.</p>
                    <Link to='/create-trip' className='mt-6 inline-block'>
                        <Button size='lg'>Create a trip</Button>
                    </Link>
                </div>
            ) : (
                <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5 mt-10'>
                    {trips.map((trip) => (
                        <UserTripCard key={trip.id} trip={trip} />
                    ))}
                </div>
            )}
        </Container>
    )
}

export default MyTrips
