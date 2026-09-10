import { useState } from 'react'
import { envoyerLienMagique } from '../lib/authLink'

export default function DemandeLienModification({ redirectPath }) {
  const [email, setEmail] = useState('')
  const [envoi, setEnvoi] = useState(false)
  const [erreur, setErreur] = useState('')
  const [envoye, setEnvoye] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setErreur('')
    if (!email.trim()) return
    setEnvoi(true)
    try {
      await envoyerLienMagique(email, redirectPath)
      setEnvoye(true)
    } catch {
      setErreur("L'envoi du lien n'a pas abouti. Vérifiez l'adresse saisie.")
    } finally {
      setEnvoi(false)
    }
  }

  if (envoye) {
    return (
      <div className="message message-succes">
        Un lien de connexion vient de vous être envoyé par email. Ouvrez-le pour
        modifier votre témoignage.
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
      <input
        type="email"
        placeholder="Votre adresse email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        style={{
          flex: '1 1 220px',
          padding: '9px 12px',
          border: '1px solid var(--line)',
          borderRadius: 3,
          background: 'var(--paper-raised)',
        }}
      />
      <button type="submit" className="bouton bouton-discret" disabled={envoi}>
        {envoi ? 'Envoi…' : 'Recevoir le lien'}
      </button>
      {erreur && <div className="message message-erreur" style={{ width: '100%' }}>{erreur}</div>}
    </form>
  )
}
