import { useState } from 'react'
import { Pencil, Trash2 } from 'lucide-react'
import { modifierTemoignageParCode, demanderSuppressionParCode, signalerTemoignage } from '../lib/data'
import ConfirmDialog from './ConfirmDialog'
import AffichageMedia from './AffichageMedia'

function formaterDate(timestamp) {
  if (!timestamp?.toDate) return ''
  return timestamp.toDate().toLocaleDateString('fr-CH', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export default function EntreeTemoignage({ temoignage, pageId, onChange }) {
  const [modeEdition, setModeEdition] = useState(false)
  const [modeSignalement, setModeSignalement] = useState(false)
  const [demandeSuppression, setDemandeSuppression] = useState(false)
  const [nomAffiche, setNomAffiche] = useState(temoignage.nomAffiche)
  const [texte, setTexte] = useState(temoignage.texte)
  const [code, setCode] = useState('')
  const [motif, setMotif] = useState('')
  const [envoi, setEnvoi] = useState(false)
  const [signale, setSignale] = useState(false)
  const [erreur, setErreur] = useState('')

  async function enregistrerModification(e) {
    e.preventDefault()
    if (code.trim().length < 4) {
      setErreur('Merci de saisir votre code.')
      return
    }
    setEnvoi(true)
    setErreur('')
    try {
      await modifierTemoignageParCode(pageId, temoignage.id, {
        nomAffiche: nomAffiche.trim(),
        texte: texte.trim(),
        code: code.trim(),
      })
      setModeEdition(false)
      setCode('')
      onChange?.()
    } catch (err) {
      console.error(err)
      setErreur('Code incorrect, ou la modification a échoué.')
    } finally {
      setEnvoi(false)
    }
  }

  async function confirmerSuppression(codeSaisi) {
    await demanderSuppressionParCode(pageId, temoignage.id, codeSaisi)
    setDemandeSuppression(false)
    onChange?.()
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
            <input value={nomAffiche} onChange={(e) => setNomAffiche(e.target.value)} maxLength={80} dir="auto" />
          </div>
          <div className="champ">
            <label>Votre témoignage</label>
            <textarea value={texte} onChange={(e) => setTexte(e.target.value)} maxLength={2000} dir="auto" />
          </div>
          <div className="champ">
            <label>Votre code</label>
            <input type="text" value={code} onChange={(e) => setCode(e.target.value)} maxLength={50} />
          </div>
          {erreur && <div className="message message-erreur">{erreur}</div>}
          <div className="groupe-boutons">
            <button type="submit" className="bouton" disabled={envoi}>
              {envoi ? 'Enregistrement…' : 'Enregistrer (sera remodéré)'}
            </button>
            <button
              type="button"
              className="bouton bouton-discret"
              onClick={() => {
                setModeEdition(false)
                setErreur('')
              }}
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
        <span className="entree-nom" dir="auto">{temoignage.nomAffiche}</span>
        <span className="entree-date">{formaterDate(temoignage.creeLe)}</span>
      </div>

      <p className="entree-texte" dir="auto">{temoignage.texte}</p>

      {temoignage.mediaUrl && <AffichageMedia url={temoignage.mediaUrl} type={temoignage.mediaType} />}

      <div className="entree-actions">
        <span style={{ marginRight: 14 }}>
          <button className="lien-discret" onClick={() => setModeEdition(true)}>
            Modifier
          </button>
          {' · '}
          <button className="lien-discret" onClick={() => setDemandeSuppression(true)}>
            Supprimer
          </button>
        </span>

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
        )}
      </div>

      {demandeSuppression && (
        <ConfirmDialog
          titre="Retirer ce témoignage ?"
          message="Saisissez le code choisi au dépôt pour confirmer. Il sera masqué du site puis définitivement supprimé."
          libelleConfirmer="Retirer"
          danger
          champCode
          onConfirmer={confirmerSuppression}
          onAnnuler={() => setDemandeSuppression(false)}
        />
      )}
    </div>
  )
}
