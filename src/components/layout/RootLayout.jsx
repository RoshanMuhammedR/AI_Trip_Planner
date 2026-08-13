import { Outlet, useMatch } from 'react-router-dom'
import Header from '@/components/custom/Header'
import Footer from '@/components/custom/Footer'

/**
 * Header + Footer render once here for every route. Previously Header was
 * mounted outside the router (so it couldn't use <Link>) and Footer was
 * imported per-page, which left create-trip and my-trips with no footer.
 */
const RootLayout = () => {
  // The trip page is an app shell: its workspace is sized to the full viewport
  // below the header, so a footer underneath just adds a stray scroll past a
  // full-height map. Matched here rather than reading location.pathname so the
  // route pattern stays the source of truth.
  const isTripWorkspace = Boolean(useMatch('/view-trip/:tripId'))

  return (
    <div className='flex min-h-screen flex-col'>
      <Header />
      <main className='flex-1'>
        <Outlet />
      </main>
      {!isTripWorkspace && <Footer />}
    </div>
  )
}

export default RootLayout
