import { db } from '@/services/firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';
import React, { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { toast } from 'sonner';
import InfoSection from '../components/InfoSection';
import Hotels from '../components/Hotels';
import PlacesToVisit from '../components/PlacesToVisit';
import Container from '@/components/layout/Container';

const ViewTrip = () => {
  const [trip,setTrip] = useState();
  const {tripId} = useParams();
  
  const getTripData = async ()=>{
    const docRef = doc(db,'AITrips',tripId);
    const docSnap = await getDoc(docRef);

    if(docSnap.exists()){
      setTrip(docSnap.data())
    }else{
      toast('No Trip Found!');
    }
  }

  useEffect(()=>{
    tripId&&getTripData();
  }
    ,[tripId])

  return (
    <Container className='py-10'>
      {/* info section */}
      <InfoSection trip={trip}/>
      {/* Hotel section */}
      <Hotels trip={trip}/>
      {/* place to visit  */}
      <PlacesToVisit trip={trip} />
    </Container>
  )
}

export default ViewTrip
