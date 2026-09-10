import { createContext, useContext, useEffect, useState } from 'react'
import { onAuthStateChanged, signOut as firebaseSignOut } from 'firebase/auth'
import { auth } from './firebase'
import { lireAdmin } from './data'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [admin, setAdmin] = useState(null)
  const [chargement, setChargement] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser)
      if (firebaseUser?.email) {
        try {
          const doc = await lireAdmin(firebaseUser.email)
          setAdmin(doc)
        } catch {
          setAdmin(null)
        }
      } else {
        setAdmin(null)
      }
      setChargement(false)
    })
    return unsubscribe
  }, [])

  function estAdminDeLaPage(pageId) {
    if (!admin) return false
    return admin.superAdmin || (admin.pageIds || []).includes(pageId)
  }

  async function deconnexion() {
    await firebaseSignOut(auth)
  }

  return (
    <AuthContext.Provider
      value={{ user, admin, chargement, estAdminDeLaPage, deconnexion }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
