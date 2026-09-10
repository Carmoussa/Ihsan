import { useState } from 'react'
import { modifierTemoignage, supprimerTemoignage, signalerTemoignage } from '../lib/data'

function formaterDate(timestamp) {
  if (!timestamp?.toDate) return ''
  return timestamp.toDate().toLocaleDateString('fr-CH', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export default function EntreeTemoignage({ temoignage, pageId, estProprietaire, onChange }) {
  const [modeEdition, setModeEdition] = useState(false)
  const [modeSignalement, setModeSignalement] = useState(false)
  const [nomAffiche, setNomAffiche] = useState(temoignage.nomAffiche)
  const [texte, setTexte] = useState(temoignage.texte)
  const [motif, setMotif] = useState('')
  const [envoi, setEnvoi] = useState(false)
  const [signale, setSignale] = useState(false)
  const [erreur, setErreur] = useState('')

  async function enregistrerModification(e) {
    e.preventDefault()
    setEnvoi(true)
    setErreur('')
    try {
      await modifierTemoignage(pageId, temoignage.id, {
        nomAffiche: nomAffiche.trim(),
        texte: texte.trim(),
      })
      setModeEdition(false)
      onChange?.()
    } catch {
      setErreur("La modification n'a pas pu être enregistrée.")
    } finally {
      setEnvoi(false)
    }
  }

  async function supprimer() {
    if (!window.confirm('Supprimer définitivement ce témoignage ?')) return
    setEnvoi(true)
    try {
      await supprimerTemoignage(pageId, temoignage.id)
      onChange?.()
    } catch {
      setErreur("La suppression n'a pas abouti.")
      setEnvoi(false)
    }
  }

  async function envoyerSignalement(e) {
    e.preventDefault()
    setEnvoi(true)
    try {
      await signalerTemoignage(pageId, temoignage.id, motif.trim())
      setSignale(true)
      setModeSignalement(false)
    } catch {
      setErreur("Le signalement n'a pas abouti.")
    } finally {
      setEnvoi(false)
    }
  }

  if (modeEdition) {
    return (
      <div className="entree-temoignage">
        <form onSubmit={enregistrerModification}>
          <div className="champ">
            <label>Votre nom</label>
            <input value={nomAffiche} onChange={(e) => setNomAffiche(e.target.value)} maxLength={80} />
          </div>
          <div className="champ">
            <label>Votre témoignage</label>
            <textarea value={texte} onChange={(e) => setTexte(e.target.value)} maxLength={2000} />
          </div>
          {erreur && <div className="message message-erreur">{erreur}</div>}
          <div className="groupe-boutons">
            <button type="submit" className="bouton" disabled={envoi}>
              {envoi ? 'Enregistrement…' : 'Enregistrer (sera remodéré)'}
            </button>
            <button
              type="button"
              className="bouton bouton-discret"
              onClick={() => setModeEdition(false)}
            >
              Annuler
            </button>
          </div>
        </form>
      </div>
    )
  }

  return (
    <div className="entree-temoignage">
      <div className="entree-entete">
        <span className="entree-nom">{temoignage.nomAffiche}</span>
        <span className="entree-date">{formaterDate(temoignage.creeLe)}</span>
      </div>
      <p className="entree-texte">{temoignage.texte}</p>

      {erreur && <div className="message message-erreur">{erreur}</div>}

      <div className="entree-actions">
        {estProprietaire && (
          <span style={{ marginRight: 14 }}>
            <button className="lien-discret" onClick={() => setModeEdition(true)}>
              Modifier
            </button>
            {' · '}
            <button className="lien-discret" onClick={supprimer}>
              Supprimer
            </button>
          </span>
        )}

        {signale ? (
          <span style={{ color: 'var(--ink-soft)', fontSize: '0.82rem' }}>
            Signalement transmis, merci.
          </span>
        ) : modeSignalement ? (
          <form onSubmit={envoyerSignalement} style={{ marginTop: 8 }}>
            <input
              type="text"
              placeholder="Motif du signalement (optionnel)"
              value={motif}
              onChange={(e) => setMotif(e.target.value)}
              style={{
                padding: '6px 10px',
                border: '1px solid var(--line)',
                borderRadius: 3,
                fontSize: '0.85rem',
                marginRight: 8,
                background: 'var(--paper-raised)',
              }}
            />
            <button type="submit" className="lien-discret" disabled={envoi}>
              Envoyer le signalement
            </button>
            {' · '}
            <button type="button" className="lien-discret" onClick={() => setModeSignalement(false)}>
              Annuler
            </button>
          </form>
        ) : (
          <button className="lien-discret" onClick={() => setModeSignalement(true)}>
            Signaler ce témoignage
          </button>
        )}
      </div>
    </div>
  )
}
