import { useGoogleLogin } from '@react-oauth/google'
import axios from 'axios'
import { FcGoogle } from 'react-icons/fc'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

/**
 * Single source of truth for Google sign-in. This markup and the profile fetch
 * were previously duplicated verbatim in Header.jsx and create-trip/index.jsx.
 *
 * @param onSignedIn - called after the profile is stored, so callers can resume
 *                     whatever action triggered the prompt (e.g. generate trip).
 */
const SignInDialog = ({ open, onOpenChange, onSignedIn }) => {
  const getUserProfile = async (token) => {
    if (!token?.access_token) {
      console.error('Access token is missing')
      return
    }

    try {
      const response = await axios.get('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: {
          Authorization: `Bearer ${token.access_token}`,
          Accept: 'application/json',
        },
      })
      localStorage.setItem('user', JSON.stringify(response.data))
      onOpenChange?.(false)
      onSignedIn?.(response.data)
    } catch (error) {
      console.error('Error fetching user profile:', error.response?.data || error.message)
    }
  }

  const login = useGoogleLogin({
    onSuccess: (codeResp) => getUserProfile(codeResp),
    onError: (error) => console.error(error),
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <img src='/logo.svg' alt='' className='h-10' />
          <DialogTitle className='mt-7'>Sign in with Google</DialogTitle>
          <DialogDescription>
            Sign in to the app with Google Auth securely
          </DialogDescription>
        </DialogHeader>

        <Button className='w-full flex gap-4 items-center' onClick={login}>
          <FcGoogle className='size-7' />
          Sign in With Google
        </Button>
      </DialogContent>
    </Dialog>
  )
}

export default SignInDialog
