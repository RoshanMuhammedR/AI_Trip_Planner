export const loadGoogleScript = () => {
  if (document.getElementById('google-maps')) return

  const script = document.createElement('script')
  script.id = 'google-maps'
  script.src = `https://maps.googleapis.com/maps/api/js?key=${import.meta.env.VITE_GOOGLE_PLACE_API_KEY}&libraries=places`
  script.async = true
  document.body.appendChild(script)
}
