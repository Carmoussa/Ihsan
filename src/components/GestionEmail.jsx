import { useEffect, useState } from 'react'
import { Pencil } from 'lucide-react'
import {
  TYPES_EMAIL,
  lireModeleEmail,
  enregistrerModeleEmail,
  envoyerTest,
  compterEnvoisRecents,
} from '../lib/email'

export default function GestionEmail() {
  const [emailTest, setEmailTest] = useState('')
  const [modeles, setModeles] = useState({})
  const [chargement, setChargement] = useState(true)
  const [sectionEnEdition, setSectionEnEdition] = useState(null)
  const [brouillon, setBrouillon] = useState({ objet: '', corps: '' })
  const [envoiEnCours, setEnvoiEnCours] = useState('')
  const [message, setMessage] = useState('')
  const [stats, setStats] = useState(null)

  async function charger() {
    const resultats = {}
    for (const { id } of TYPES_EMAIL) {
      resultats[id] = await lireModeleEmail(id)
    }
    setModeles(resultats)
    setStats(await compterEnvoisRecents())
    setChargement(false)
  }

  useEffect(() => {
    charger()
  }, [])

  function ouvrirEdition(type) {
    setSectionEnEdition(type)
    setBrouillon(modeles[type])
    setMessage('')
  }

  async function enregistrer(e) {
    e.preventDefault()
    await enregistrerModeleEmail(sectionEnEdition, brouillon)
    setSectionEnEdition(null)
    charger()
  }

  async function tester(type) {
    const cible = emailTest.trim()
    if (!cible) {
      setMessage("Saisis d'abord un email de test.")
      return
    }
    setEnvoiEnCours(type)
    setMessage('')
    try {
      await envoyerTest(type, cible)
      setMessage(
        `Envoi tenté vers ${cible}. S'il n'arrive pas, vérifie la configuration EmailJS ` +
          '(.env.local) et la console du navigateur.',
      )
    } finally {
      setEnvoiEnCours('')
      charger()
    }
  }

  if (chargement) return <p className="vide">Chargement…</p>

  return (
    <>
      <h2 style={{ marginTop: 48 }}>Email de test</h2>
      <div className="champ" style={{ maxWidth: 360 }}>
        <input
          type="email"
          placeholder="Adresse où envoyer les tests"
          value={emailTest}
          onChange={(e) => setEmailTest(e.target.value)}
        />
      </div>
      {message && <div className="message message-info">{message}</div>}

      {TYPES_EMAIL.map(({ id, label, variables }) => (
        <div key={id} className="entree-temoignage">
          <div className="entree-entete">
            <span className="entree-nom">{label}</span>
          </div>

          {sectionEnEdition === id ? (
            <form onSubmit={enregistrer}>
              <div className="champ">
                <label>Objet</label>
                <input
                  value={brouillon.objet}
                  onChange={(e) => setBrouillon({ ...brouillon, objet: e.target.value })}
                />
              </div>
              <div className="champ">
                <label>Corps du message (HTML simple accepté, ex. &lt;br&gt;)</label>
                <textarea
                  value={brouillon.corps}
                  onChange={(e) => setBrouillon({ ...brouillon, corps: e.target.value })}
                  style={{ minHeight: 180 }}
                />
                <small>Variables disponibles : {variables.map((v) => `{{${v.replace(' (auto)', '')}}}`).join(', ')}</small>
              </div>
              <div className="groupe-boutons">
                <button type="submit" className="bouton">
                  Enregistrer
                </button>
                <button type="button" className="bouton bouton-discret" onClick={() => setSectionEnEdition(null)}>
                  Annuler
                </button>
              </div>
            </form>
          ) : (
            <>
              <p style={{ fontSize: '0.9rem', color: 'var(--ink-soft)' }}>
                Objet : {modeles[id]?.objet}
              </p>
              <div className="groupe-boutons">
                <button className="bouton-icone" onClick={() => ouvrirEdition(id)} title="Modifier">
                  <Pencil size={18} />
                </button>
                <button className="bouton bouton-discret" onClick={() => tester(id)} disabled={!!envoiEnCours}>
                  {envoiEnCours === id ? 'Envoi…' : 'Tester'}
                </button>
              </div>
            </>
          )}
        </div>
      ))}

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
