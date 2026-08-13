import React from 'react'
import { Button } from '../ui/button'
import { Link } from 'react-router-dom'
import Container from '@/components/layout/Container'

const Hero = () => {
  return (
    <Container className='flex flex-col items-center gap-8 text-center'>
      {/* Was an <h2>; the app had no <h1> anywhere. */}
      <h1 className='font-extrabold text-3xl sm:text-4xl md:text-5xl lg:text-6xl mt-16 leading-tight text-balance'>
        <span className='text-primary'>Discover Your Next Adventure With AI</span>
        : Personalized Itineraries at Your Fingertips
      </h1>

      {/* `text-gray` isn't a Tailwind class — this silently had no colour. */}
      <p className='text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl text-balance'>
        Your personal trip planner and curator, creating custom itineraries tailored to your
        interests and budget.
      </p>

      <Link to={'/create-trip'}>
        <Button size='lg'>Get Started, It’s Free</Button>
      </Link>

      <img
        src='/landing2.png'
        alt=''
        className='w-full max-w-3xl mt-4'
      />
    </Container>
  )
}

export default Hero
