import React, { useState } from 'react'
import { Button } from '../ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Link, useNavigate } from 'react-router-dom';
import { googleLogout, useGoogleLogin } from '@react-oauth/google';
import axios from 'axios';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogClose,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { FcGoogle } from "react-icons/fc";


const Header = () => {
  const [showDialogue, setShowDialogue] = useState(false);
  const user = JSON.parse(localStorage.getItem('user'));

  const login = useGoogleLogin({
    onSuccess: (codeResp) => GetUserProfile(codeResp),
    onError: (error) => console.log(error)
  })

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
    } catch (error) {
      console.error("Error fetching user profile:", error.response?.data || error.message);
      return null;
    }
  };
  return (
    <div className='p-3 shadow-sm flex justify-between items-center'>
      <a href='/'>
        <img src='/logo.svg' className='h-10' />
      </a>
      {user ?
        <div className='flex items-center gap-2'>
          <a href='/create-trip'>
            <Button variant='outline' className='rounded-full'>+ Create Trip</Button>
          </a>
          <a href='/my-trips'>
            <Button variant='outline' className='rounded-full'>My Trip</Button>
          </a>
          <Popover>
            <PopoverTrigger>
              <img src={user?.picture} className='size-[35px] rounded-full' />
            </PopoverTrigger>
            <PopoverContent>
              <h2 onClick={() => {
                googleLogout();
                localStorage.clear();
                window.location.reload();
              }} className='cursor-pointer'>Logout</h2>
            </PopoverContent>
          </Popover>
        </div>
        :
        <Button size="lg" onClick={()=>setShowDialogue(true)}>Sign In</Button>
      }
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

export default Header
