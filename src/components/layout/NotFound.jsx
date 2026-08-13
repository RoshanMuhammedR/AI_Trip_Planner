import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import Container from './Container'

const NotFound = () => (
  <Container className='py-24 text-center'>
    <h1 className='text-3xl font-bold'>Page not found</h1>
    <p className='mt-3 text-gray-500'>That page doesn’t exist or has moved.</p>
    <Link to='/' className='mt-8 inline-block'>
      <Button size='lg'>Back to home</Button>
    </Link>
  </Container>
)

export default NotFound
