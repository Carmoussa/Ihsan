import { useState } from 'react'
import { Pencil, Trash2 } from 'lucide-react'
import { modifierTemoignage, supprimerTemoignage, signalerTemoignage } from '../lib/data'
import ConfirmDialog from './ConfirmDialog'

function formaterDate(timestamp) {
  if (!timestamp?.toDate) return ''
  return timestamp.toDate().toLocaleDateString('fr-CH', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

// Format compact utilisé sur "Vos témoignages" : 26.09.26 11 h 42
function formaterDateHeure(timestamp) {
  if (!timestamp?.toDate) return ''
  const d = timestamp.toDate()
  const deux = (n) => String(n).padStart(2, '0')
  const jour = deux(d.getDate())
  const mois = deux(d.getMonth() + 1)
  const annee = deux(d.getFullYear() % 100)
  const heure = deux(d.getHours())
  const minute = deux(d.getMinutes())
  return `${jour}.${mois}.${annee} ${heure} h ${minute}`
}

export default function EntreeTemoignage({ temoignage, pageId, estProprietaire, afficherStatut, onChange }) {
  const [modeEdition, setModeEdition] = useState(false)
  const [modeSignalement, setModeSignalement] = useState(false)
  const [demandeSuppression, setDemandeSuppression] = useState(false)
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
    } catch (err) {
      console.error(err)
      setErreur("La modification n'a pas pu être enregistrée.")
    } finally {
      setEnvoi(false)
    }
  }

  async function confirmerSuppression() {
    try {
      await supprimerTemoignage(pageId, temoignage.id)
      setDemandeSuppression(false)
      onChange?.()
    } catch (err) {
      console.error(err)
      setErreur("La suppression n'a pas abouti.")
      setDemandeSuppression(false)
    }
  }

  async function envoyerSignalement(e) {
    e.preventDefault()
    setEnvoi(true)
    try {
      await signalerTemoignage(pageId, temoignage.id, motif.trim())
      setSignale(true)
      setModeSignalement(false)
    } catch (err) {
      console.error(err)
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
            <input
              value={nomAffiche}
              onChange={(e) => setNomAffiche(e.target.value)}
              maxLength={80}
              dir="auto"
            />
          </div>
          <div className="champ">
            <label>Votre témoignage</label>
            <textarea
              value={texte}
              onChange={(e) => setTexte(e.target.value)}
              maxLength={2000}
              dir="auto"
            />
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
      {afficherStatut ? (
        <div className="entree-entete">
          <span className="entree-date">{formaterDateHeure(temoignage.creeLe)}</span>
          <span className={`etiquette-statut ${temoignage.statut}`}>
            {temoignage.statut === 'approuve' && 'Publié'}
            {temoignage.statut === 'en_attente' && 'En attente'}
            {temoignage.statut === 'rejete' && 'Non retenu'}
          </span>
        </div>
      ) : (
        <div className="entree-entete">
          <span className="entree-nom" dir="auto">{temoignage.nomAffiche}</span>
          <span className="entree-date">{formaterDate(temoignage.creeLe)}</span>
        </div>
      )}

      <p className="entree-texte" dir="auto">{temoignage.texte}</p>

      {temoignage.statut === 'rejete' && temoignage.motifRejet && (
        <p style={{ fontSize: '0.9rem', color: 'var(--ink-soft)' }} dir="auto">
          Motif indiqué par l'administration : {temoignage.motifRejet}
        </p>
      )}

      {erreur && <div className="message message-erreur">{erreur}</div>}

      <div className="entree-actions">
        {estProprietaire && afficherStatut && (
          <div className="groupe-boutons" style={{ marginTop: 0 }}>
            <button
              className="bouton-icone"
              onClick={() => setModeEdition(true)}
              aria-label="Modifier ce témoignage"
              title="Modifier"
            >
              <Pencil size={18} />
            </button>
            <button
              className="bouton-icone rejeter"
              onClick={() => setDemandeSuppression(true)}
              aria-label="Supprimer ce témoignage"
              title="Supprimer"
            >
              <Trash2 size={18} />
            </button>
          </div>
        )}

        {estProprietaire && !afficherStatut && (
          <span style={{ marginRight: 14 }}>
            <button className="lien-discret" onClick={() => setModeEdition(true)}>
              Modifier
            </button>
            {' · '}
            <button className="lien-discret" onClick={() => setDemandeSuppression(true)}>
              Supprimer
            </button>
          </span>
        )}

        {!estProprietaire &&
          (signale ? (
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
                dir="auto"
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
          ))}
      </div>

      {demandeSuppression && (
        <ConfirmDialog
          titre="Supprimer ce témoignage ?"
          message="Cette action est définitive."
          libelleConfirmer="Supprimer"
          danger
          onConfirmer={confirmerSuppression}
          onAnnuler={() => setDemandeSuppression(false)}
        />
      )}
    </div>
  )
}
