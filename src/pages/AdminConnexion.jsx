import { useState } from 'react'
import { envoyerLienMagique } from '../lib/authLink'

export default function AdminConnexion() {
  const [email, setEmail] = useState('')
  const [envoi, setEnvoi] = useState(false)
  const [envoye, setEnvoye] = useState(false)
  const [erreur, setErreur] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setErreur('')
    setEnvoi(true)
    try {
      await envoyerLienMagique(email, '/admin')
      setEnvoye(true)
    } catch (err) {
      console.error(err)
      setErreur("L'envoi du lien n'a pas abouti. Vérifiez l'adresse saisie.")
    } finally {
      setEnvoi(false)
    }
  }

  return (
    <>
      <h1>Espace administrateur</h1>
      {envoye ? (
        <div className="message message-succes">
          Un lien de connexion vient de vous être envoyé à {email}. Ouvrez-le pour
          accéder au tableau de bord.
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          <div className="champ">
            <label htmlFor="email">Votre adresse email d'administrateur</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          {erreur && <div className="message message-erreur">{erreur}</div>}
          <button type="submit" className="bouton" disabled={envoi}>
            {envoi ? 'Envoi…' : 'Recevoir le lien de connexion'}
          </button>
        </form>
      )}
    </>
  )
}
