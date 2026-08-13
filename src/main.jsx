import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import CreateTrip from './create-trip'
import { Toaster } from './components/ui/sonner'
import { APIProvider } from '@vis.gl/react-google-maps'
import { AuthProvider } from './contexts/AuthContext.jsx'
import ViewTrip from './view-trip/[tripId]/index.jsx'
import MyTrips from './my-trips'
import RootLayout from './components/layout/RootLayout.jsx'
import ErrorPage from './components/layout/ErrorPage.jsx'
import NotFound from './components/layout/NotFound.jsx'

const router = createBrowserRouter([
  {
    element: <RootLayout />,
    errorElement: <ErrorPage />,
    children: [
      { path: '/', element: <App /> },
      { path: '/create-trip', element: <CreateTrip /> },
      { path: '/view-trip/:tripId', element: <ViewTrip /> },
      { path: '/my-trips', element: <MyTrips /> },
      { path: '*', element: <NotFound /> },
    ],
  },
])

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {/* Owns Maps script loading for the whole app, replacing the manual
        <script> injection and the 100ms polling for window.google. */}
    <APIProvider
      apiKey={import.meta.env.VITE_GOOGLE_PLACE_API_KEY}
      libraries={['places', 'marker']}
    >
      <AuthProvider>
        <Toaster position="top-center" richColors />
        <RouterProvider router={router} />
      </AuthProvider>
    </APIProvider>
  </StrictMode>,
)
