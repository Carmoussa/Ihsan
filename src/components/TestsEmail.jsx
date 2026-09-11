import { useEffect, useState } from 'react'
import { notifierApprobation, notifierRejet, notifierDepot, compterEnvoisRecents } from '../lib/email'

const DONNEES_TEST = {
  nomAffiche: 'Prénom Nom (test)',
  nomPage: 'Page de test',
  motif: 'Motif de test — exemple de contenu inapproprié.',
}

export default function TestsEmail() {
  const [email, setEmail] = useState('')
  const [envoiEnCours, setEnvoiEnCours] = useState('')
  const [message, setMessage] = useState('')
  const [stats, setStats] = useState(null)

  async function chargerStats() {
    try {
      setStats(await compterEnvoisRecents())
    } catch (err) {
      console.error(err)
    }
  }

  useEffect(() => {
    chargerStats()
  }, [])

  async function tester(type) {
    const cible = email.trim()
    if (!cible) {
      setMessage("Saisis d'abord un email de test.")
      return
    }
    setEnvoiEnCours(type)
    setMessage('')
    try {
      if (type === 'approbation') {
        await notifierApprobation(cible, { ...DONNEES_TEST, urlPage: window.location.href })
      } else if (type === 'rejet') {
        await notifierRejet(cible, DONNEES_TEST)
      } else if (type === 'accuse') {
        await notifierDepot(cible, DONNEES_TEST)
      }
      setMessage(
        `Envoi tenté vers ${cible}. S'il n'arrive pas, vérifie la configuration EmailJS ` +
          '(.env.local) et le contenu du modèle correspondant — regarde aussi la console du navigateur.',
      )
    } finally {
      setEnvoiEnCours('')
      chargerStats()
    }
  }

  return (
    <>
      <h2 style={{ marginTop: 48 }}>Tester les emails</h2>
      <p style={{ color: 'var(--ink-soft)' }}>
        Envoie un email réel, avec des données factices, vers l'adresse de ton choix — pratique
        pour vérifier le contenu de tes modèles EmailJS sans passer par un vrai témoignage.
      </p>

      <div className="champ" style={{ maxWidth: 360 }}>
        <label>Email de test</label>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>

      {message && <div className="message message-info">{message}</div>}

      <div className="groupe-boutons">
        <button className="bouton" onClick={() => tester('approbation')} disabled={!!envoiEnCours}>
          {envoiEnCours === 'approbation' ? 'Envoi…' : 'Approuver'}
        </button>
        <button className="bouton" onClick={() => tester('rejet')} disabled={!!envoiEnCours}>
          {envoiEnCours === 'rejet' ? 'Envoi…' : 'Rejeter'}
        </button>
        <button className="bouton" onClick={() => tester('accuse')} disabled={!!envoiEnCours}>
          {envoiEnCours === 'accuse' ? 'Envoi…' : 'Acquitter'}
        </button>
      </div>

      <h2 style={{ marginTop: 48 }}>Suivi du quota EmailJS</h2>
      <p style={{ color: 'var(--ink-soft)' }}>
        Emails envoyés (tentatives, réussies ou non) sur les 30 derniers jours glissants —
        l'offre gratuite EmailJS autorise environ 200 emails par mois.
      </p>
      <p style={{ fontSize: '1.4rem', fontFamily: 'var(--serif)' }}>
        {stats === null ? '…' : stats} <span style={{ fontSize: '1rem', color: 'var(--ink-soft)' }}>/ 200</span>
      </p>
    </>
  )
}
