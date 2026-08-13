import { Link, useRouteError } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import Container from './Container'

/**
 * Router-level errorElement. Without this a thrown render error left the user
 * on a blank white page with no way back.
 */
const ErrorPage = () => {
  const error = useRouteError()

  return (
    <Container className='py-24 text-center'>
      <h1 className='text-3xl font-bold'>Something went wrong</h1>
      <p className='mt-3 text-gray-500'>
        {error?.statusText || error?.message || 'An unexpected error occurred.'}
      </p>
      <Link to='/' className='mt-8 inline-block'>
        <Button size='lg'>Back to home</Button>
      </Link>
    </Container>
  )
}

export default ErrorPage
