import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { lienEstUnLienDeConnexion, terminerConnexion } from '../lib/authLink'

export default function FinirConnexion() {
  const navigate = useNavigate()
  const [etat, setEtat] = useState('verification') // verification | besoin_email | erreur
  const [emailSaisi, setEmailSaisi] = useState('')
  const [erreur, setErreur] = useState('')

  async function essayer(emailDeSecours) {
    try {
      const { redirectPath } = await terminerConnexion(emailDeSecours)
      navigate(redirectPath, { replace: true })
    } catch (err) {
      if (err.message === 'EMAIL_MANQUANT') {
        setEtat('besoin_email')
      } else {
        setErreur(
          "Ce lien n'est plus valable. Il a peut-être déjà été utilisé, ou a expiré. Vous pouvez en redemander un nouveau depuis la page d'où vous êtes parti·e.",
        )
        setEtat('erreur')
      }
    }
  }

  useEffect(() => {
    if (!lienEstUnLienDeConnexion()) {
      setErreur("Ce lien de connexion n'est pas valide.")
      setEtat('erreur')
      return
    }
    essayer()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (etat === 'verification') {
    return <p className="vide">Connexion en cours…</p>
  }

  if (etat === 'erreur') {
    return <div className="message message-erreur">{erreur}</div>
  }

  return (
    <>
      <h1>Confirmer votre email</h1>
      <p style={{ color: 'var(--ink-soft)' }}>
        Ce lien a été ouvert sur un autre appareil ou navigateur que celui utilisé
        pour le demander. Merci de resaisir votre adresse email pour confirmer.
      </p>
      <form
        onSubmit={(e) => {
          e.preventDefault()
          essayer(emailSaisi)
        }}
        style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}
      >
        <input
          type="email"
          value={emailSaisi}
          onChange={(e) => setEmailSaisi(e.target.value)}
          placeholder="Votre adresse email"
          style={{
            flex: '1 1 220px',
            padding: '9px 12px',
            border: '1px solid var(--line)',
            borderRadius: 3,
            background: 'var(--paper-raised)',
          }}
        />
        <button type="submit" className="bouton">
          Confirmer
        </button>
      </form>
    </>
  )
}
