import React, { useState } from 'react'
import { Button } from '../ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Link } from 'react-router-dom';
import { googleLogout } from '@react-oauth/google';
import SignInDialog from './SignInDialog';


const Header = () => {
  const [showDialogue, setShowDialogue] = useState(false);
  const user = JSON.parse(localStorage.getItem('user'));

  return (
    <div className='p-3 shadow-sm flex justify-between items-center'>
      <Link to='/'>
        <img src='/logo.svg' alt='AI Trip Planner' className='h-10' />
      </Link>
      {user ?
        <div className='flex items-center gap-2'>
          <Link to='/create-trip' className='hidden md:block'>
            <Button variant='outline' className='rounded-full '>+ Create Trip</Button>
          </Link>
          <Link to='/my-trips' className='hidden md:block'>
            <Button variant='outline' className='rounded-full'>My Trip</Button>
          </Link>
          <Popover>
            <PopoverTrigger aria-label='Account menu'>
              <img
                src={user?.picture}
                alt={user?.name ?? 'Your account'}
                className='size-[35px] rounded-full'
              />
            </PopoverTrigger>
            <PopoverContent>
              <div className='flex flex-col gap-3'>
                <Link to='/create-trip'>Create Trip</Link>
                <Link to='/my-trips'>My Trips</Link>
                <button
                  type='button'
                  className='text-left cursor-pointer'
                  onClick={() => {
                    googleLogout();
                    localStorage.clear();
                    window.location.reload();
                  }}
                >
                  Logout
                </button>
              </div>
            </PopoverContent>
          </Popover>
        </div>
        :
        <Button size="lg" onClick={() => setShowDialogue(true)}>Sign In</Button>
      }
      <SignInDialog open={showDialogue} onOpenChange={setShowDialogue} />
    </div>
  )
}

export default Header
