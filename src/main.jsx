import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import CreateTrip from './create-trip'
import { Toaster } from './components/ui/sonner'
import { GoogleOAuthProvider } from '@react-oauth/google'
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
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_AUTH_CLIENT_ID}>
      <Toaster position="top-center" />
      <RouterProvider router={router} />
    </GoogleOAuthProvider>
  </StrictMode>,
)
