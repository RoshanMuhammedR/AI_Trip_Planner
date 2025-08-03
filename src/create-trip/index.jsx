import React, { useEffect, useState } from 'react'
import GooglePlacesAutocomplete from 'react-google-places-autocomplete'
import { loadGoogleScript } from '@/utils/loadGoogleScript.js'
import { Input } from '@/components/ui/input';
import { budgetOptions, companionsOptions, PROMPT } from '@/constants/options';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { main } from '@/services/AIModel';

import { AiOutlineLoading3Quarters } from "react-icons/ai";
import { FcGoogle } from "react-icons/fc";


import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogClose,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { useGoogleLogin } from '@react-oauth/google';
import axios from 'axios';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '@/services/firebaseConfig';
import { useNavigate } from 'react-router-dom';


function CreateTrip() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [place, setPlace] = useState();
  const [form, setForm] = useState();
  const [showDialogue, setShowDialogue] = useState(false);
  const [searching, setSearching] = useState(false);
  const handleFormChange = (name, value) => {
    setForm({
      ...form,
      [name]: value
    })
  }

  const navigate = useNavigate();

  const login = useGoogleLogin({
    onSuccess: (codeResp) => GetUserProfile(codeResp),
    onError: (error) => console.log(error)
  })


  const onGenerate = async () => {

    const user = localStorage.getItem('user');

    if (!user) {
      setShowDialogue(true);
      return;
    }


    if (form?.noOfDays > 5 || !form?.budget || !form?.location || !form?.people) {
      toast('Please fill all details correctly')
      return;
    }
    setSearching(true);
    const FINAL_PROMPT = PROMPT
      .replace('{location}', form.location)
      .replace('{noOfDays}', form.noOfDays)
      .replace('{budget}', form.budget)
      .replace('{people}', form.people)
      .replace('{noOfDays}', form.noOfDays)

    const result = await main(FINAL_PROMPT);
    saveAiTrip(result);
    setSearching(false);

  }

  const saveAiTrip = async (TripData) => {
    const user = JSON.parse(localStorage.getItem('user'));
    const docID = Date.now().toString();
    await setDoc(doc(db, "AITrips", docID), {
      userSelection: form,
      tripData: TripData,
      userEmail: user?.email,
      id: docID
    });
    navigate('/view-trip/' + docID);
  }

  const GetUserProfile = async (token) => {
    if (!token?.access_token) {
      console.error("Access token is missing");
      return null;
    }

    try {
      const response = await axios.get('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: {
          Authorization: `Bearer ${token.access_token}`,
          Accept: 'application/json',
        },
      });
      localStorage.setItem('user', JSON.stringify(response.data));
      setShowDialogue(false);
      onGenerate();
    } catch (error) {
      console.error("Error fetching user profile:", error.response?.data || error.message);
      return null;
    }
  };


  useEffect(() => {
    loadGoogleScript()
    const interval = setInterval(() => {
      if (window.google) {
        setIsLoaded(true)
        clearInterval(interval)
      }
    }, 100)
  }, []);

  return (
    <div className='px-5 sm:px-10 md:px-20 lg:px-32 xl:px-56 2xl:px-72 mt-10'>
      <h2 className='font-bold text-3xl'>Tell us your travel preferences 🏕️🌴</h2>
      <p className='mt-3 text-gray-500 text-xl'>
        Just provide some basic information, and our trip planner will generate a customised itinerary based on your preferences.
      </p>
      <div className='mt-20 flex flex-col gap-10'>
        <div>
          <h2 className='text-xl my-3 font-medium'>What is the destination of choice?</h2>
          {isLoaded && (
            <GooglePlacesAutocomplete
              apiKey={import.meta.env.VITE_GOOGLE_PLACE_API_KEY}
              selectProps={{
                place,
                onChange: (e) => {
                  setPlace(e);
                  handleFormChange('location', e.label);
                }
              }}
            />
          )}
        </div>
        <div>
          <h2 className='text-xl my-3 font-medium'>How many days are you planning your trip?</h2>
          <Input type='number' placeholder={'Ex.3'}
            onChange={(e) => handleFormChange('noOfDays', e.target.value)}
          />
        </div>
      </div>

      <div className='mt-4'>
        <h2 className='text-xl my-5 font-medium'>What is Your Budget?</h2>
        <div className='grid grid-cols-3 gap-5 mt-5'>
          {budgetOptions.map((item, index) => (
            <div key={index}
              className={`p-4 border rounded-lg hover:shadow-lg cursor-pointer ${form?.budget === item.title && 'shadow-lg border-[#2C3E50]'}`}
              onClick={(e) => handleFormChange('budget', item.title)}
            >
              <h2 className='text-4xl'>{item.icon}</h2>
              <h2 className='font-bold text-lg'>{item.title}</h2>
              <h2 className='text-sm text-gray-500'>{item.desc}</h2>
            </div>
          ))}
        </div>
      </div>

      <div className='mt-4'>
        <h2 className='text-xl my-5 font-medium'>Who do you plan on travelling with on next adventure?</h2>
        <div className='grid grid-cols-3 gap-5 mt-5'>
          {companionsOptions.map((item, index) => (
            <div key={index}
              className={`p-4 border rounded-lg hover:shadow-lg cursor-pointer ${form?.people === item.people && 'shadow-lg border-[#2C3E50]'}`}
              onClick={(e) => handleFormChange('people', item.people)}
            >
              <h2 className='text-4xl'>{item.icon}</h2>
              <h2 className='font-bold text-lg'>{item.title}</h2>
              <h2 className='text-sm text-gray-500'>{item.desc}</h2>
            </div>
          ))}
        </div>
      </div>
      <div className="my-5 flex justify-end">
        <Button size={'lg'} onClick={onGenerate} disabled={searching}>
          {searching ? <AiOutlineLoading3Quarters className='size-7 animate-spin' /> : 'Generate Trip'}
        </Button>
      </div>

      <Dialog open={showDialogue} onOpenChange={setShowDialogue}>
        <DialogContent>
          <DialogHeader>
            <DialogDescription className='text-[#2C3E50]'>
              <img src='/logo.svg' className='h-10' />
              <h2 className='font-bold text-lg mt-7'>Sign in with Google</h2>
              <p>Sign in to the App with Google Auth securely</p>
              <Button
                className='w-full mt-5 flex gap-4 items-center'
                onClick={login}
              >
                <FcGoogle className='size-7' />
                Sign in With Google
              </Button>
            </DialogDescription>
          </DialogHeader>

          <DialogClose asChild>
            <button className="absolute right-4 top-3 text-gray-500 hover:text-gray-700">
              ✕
            </button>
          </DialogClose>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default CreateTrip
