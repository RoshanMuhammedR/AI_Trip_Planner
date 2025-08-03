import React from 'react'
import { Button } from '../ui/button'
import { Link } from 'react-router-dom'

const Hero = () => {
  return (
    <div className='flex flex-col items-center gap-9 px-4 sm:px-8 md:px-12 lg:px-24 xl:px-56'>
      <h2 className='font-extrabold text-3xl sm:text-4xl md:text-5xl lg:text-[60px] text-center mt-16 leading-tight'>
        <span className='text-[#2C3E50]'>Discover Your Next Adventure With AI</span>: Personalized Itineraries at Your Fingertips
      </h2>

      <p className='text-base sm:text-lg md:text-xl text-gray text-center'>
        Your personal trip planner and curator, creating custom itineraries tailored to your interests and budget.
      </p>

      <Link to={'/create-trip'}>
        <Button size="lg" className='z-30'>Get Started, It's Free</Button>
      </Link>

      <img src='/landing2.png' className='-mt-20 -z-20' />
    </div>
  )
}

export default Hero
