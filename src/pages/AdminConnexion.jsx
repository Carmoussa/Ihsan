import { useState } from 'react'
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth'
import { auth } from '../lib/firebase'

export default function AdminConnexion() {
  const [envoi, setEnvoi] = useState(false)
  const [erreur, setErreur] = useState('')

  async function connexionGoogle() {
    setErreur('')
    setEnvoi(true)
    try {
      await signInWithPopup(auth, new GoogleAuthProvider())
      // AuthContext détecte la connexion et rafraîchit automatiquement la page.
    } catch (err) {
      console.error(err)
      if (err.code !== 'auth/popup-closed-by-user') {
        setErreur('La connexion a échoué. Merci de réessayer.')
      }
    } finally {
      setEnvoi(false)
    }
  }

  return (
    <>
      <h1>Espace administrateur</h1>
      <p style={{ color: 'var(--ink-soft)' }}>
        Réservé aux administrateurs autorisés. Connectez-vous avec le compte
        Google associé à votre adresse email d'administrateur.
      </p>
      {erreur && <div className="message message-erreur">{erreur}</div>}
      <button className="bouton" onClick={connexionGoogle} disabled={envoi}>
        {envoi ? 'Connexion…' : 'Se connecter avec Google'}
      </button>
    </>
  )
}
