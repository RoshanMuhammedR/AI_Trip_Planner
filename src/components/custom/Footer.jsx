import React from 'react'
import { Link } from 'react-router-dom'

const Footer = () => {
  return (
    <div className='my-7'>
        <Link to='https://github.com/RoshanMuhammedR' target='_blank'>
            <h2 className=' text-center text-sm text-gray-600 hover:underline'>Created by 
            Roshan
            </h2>
        </Link>
    </div>
  )
}

export default Footer
