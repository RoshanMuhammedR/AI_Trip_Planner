import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import CreateTrip from './create-trip'
import { Toaster } from './components/ui/sonner'
import { ThemeProvider } from 'next-themes'
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
    {/* attribute="class" matches the `@custom-variant dark (&:is(.dark *))`
        already declared in index.css. */}
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <AuthProvider>
        <Toaster position="top-center" richColors />
        <RouterProvider router={router} />
      </AuthProvider>
    </ThemeProvider>
  </StrictMode>,
)
