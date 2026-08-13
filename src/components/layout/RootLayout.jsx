import { Outlet } from 'react-router-dom'
import Header from '@/components/custom/Header'
import Footer from '@/components/custom/Footer'

/**
 * Header + Footer render once here for every route. Previously Header was
 * mounted outside the router (so it couldn't use <Link>) and Footer was
 * imported per-page, which left create-trip and my-trips with no footer.
 */
const RootLayout = () => (
  <div className='flex min-h-screen flex-col'>
    <Header />
    <main className='flex-1'>
      <Outlet />
    </main>
    <Footer />
  </div>
)

export default RootLayout
