import { createContext, useContext, useEffect, useState } from 'react'
import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
} from 'firebase/auth'
import { auth } from '@/services/firebaseConfig'

const AuthContext = createContext(null)

/**
 * Single source of auth truth. Replaces the previous pattern of each component
 * calling JSON.parse(localStorage.getItem('user')) at render — which never
 * re-rendered on login (hence the window.location.reload() on logout) and gave
 * Firestore no verifiable identity to write rules against.
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  // Distinguishes "not signed in" from "haven't checked yet", so guarded pages
  // don't redirect during the initial auth resolution.
  const [initializing, setInitializing] = useState(true)

  useEffect(() => {
    return onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser)
      setInitializing(false)
    })
  }, [])

  const signIn = async () => {
    const provider = new GoogleAuthProvider()
    const { user: signedIn } = await signInWithPopup(auth, provider)
    return signedIn
  }

  const logout = () => signOut(auth)

  return (
    <AuthContext.Provider value={{ user, initializing, signIn, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within an AuthProvider')
  return context
}
