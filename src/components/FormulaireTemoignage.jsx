import { useState } from 'react'
import { deposerTemoignage } from '../lib/data'

export default function FormulaireTemoignage({ pageId, onDepose }) {
  const [nomAffiche, setNomAffiche] = useState('')
  const [email, setEmail] = useState('')
  const [texte, setTexte] = useState('')
  const [envoi, setEnvoi] = useState(false)
  const [erreur, setErreur] = useState('')
  const [succes, setSucces] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setErreur('')
    if (!nomAffiche.trim() || !email.trim() || !texte.trim()) {
      setErreur('Merci de remplir tous les champs.')
      return
    }
    setEnvoi(true)
    try {
      await deposerTemoignage(pageId, { nomAffiche: nomAffiche.trim(), email, texte: texte.trim() })
      setSucces(true)
      setNomAffiche('')
      setEmail('')
      setTexte('')
      onDepose?.()
    } catch (err) {
      console.error(err)
      setErreur("Le dépôt n'a pas abouti. Merci de réessayer.")
    } finally {
      setEnvoi(false)
    }
  }

  if (succes) {
    return (
      <div className="message message-succes">
        Merci, votre témoignage a bien été reçu. Il sera visible sur cette page dès
        qu'un administrateur l'aura validé. Conservez votre adresse email : elle vous
        permettra de le modifier plus tard si vous le souhaitez.
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="champ">
        <label htmlFor="nomAffiche">Votre nom (affiché publiquement)</label>
        <input
          id="nomAffiche"
          type="text"
          value={nomAffiche}
          onChange={(e) => setNomAffiche(e.target.value)}
          maxLength={80}
          dir="auto"
        />
      </div>
      <div className="champ">
        <label htmlFor="email">Votre email (non affiché, utile pour modifier votre témoignage)</label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      <div className="champ">
        <label htmlFor="texte">Votre témoignage</label>
        <textarea
          id="texte"
          value={texte}
          onChange={(e) => setTexte(e.target.value)}
          maxLength={2000}
          dir="auto"
        />
        <small>{texte.length}/2000 caractères</small>
      </div>
      {erreur && <div className="message message-erreur">{erreur}</div>}
      <button type="submit" className="bouton" disabled={envoi}>
        {envoi ? 'Envoi…' : 'Déposer mon témoignage'}
      </button>
    </form>
  )
}
