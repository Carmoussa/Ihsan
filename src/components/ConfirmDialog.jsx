import { useState } from 'react'

export default function ConfirmDialog({
  titre,
  message,
  libelleConfirmer = 'Confirmer',
  danger = false,
  champMotif = false,
  libelleMotif = 'Motif (optionnel)',
  champCode = false,
  onConfirmer,
  onAnnuler,
}) {
  const [motif, setMotif] = useState('')
  const [code, setCode] = useState('')
  const [envoi, setEnvoi] = useState(false)
  const [erreur, setErreur] = useState('')

  async function confirmer() {
    if (champCode && code.trim().length < 4) {
      setErreur('Merci de saisir votre code.')
      return
    }
    setErreur('')
    setEnvoi(true)
    try {
      await onConfirmer(champCode ? code.trim() : motif.trim())
    } catch (err) {
      console.error(err)
      setErreur(
        champCode
          ? "Code incorrect, ou une erreur s'est produite."
          : "Une erreur s'est produite.",
      )
    } finally {
      setEnvoi(false)
    }
  }

  return (
    <div className="fenetre-modale-fond" role="presentation" onClick={onAnnuler}>
      <div
        className="fenetre-modale"
        role="dialog"
        aria-modal="true"
        aria-labelledby="titre-modale"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 id="titre-modale">{titre}</h3>
        <p style={{ color: 'var(--ink-soft)' }}>{message}</p>

        {champMotif && (
          <div className="champ">
            <label>{libelleMotif}</label>
            <textarea
              value={motif}
              onChange={(e) => setMotif(e.target.value)}
              maxLength={500}
              autoFocus
            />
          </div>
        )}

        {champCode && (
          <div className="champ">
            <label>Votre code</label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              maxLength={50}
              autoFocus
            />
          </div>
        )}

        {erreur && <div className="message message-erreur">{erreur}</div>}

        <div className="groupe-boutons">
          <button
            className={danger ? 'bouton bouton-danger' : 'bouton'}
            onClick={confirmer}
            disabled={envoi}
          >
            {envoi ? 'En cours…' : libelleConfirmer}
          </button>
          <button className="bouton bouton-discret" onClick={onAnnuler} disabled={envoi}>
            Annuler
          </button>
        </div>
      </div>
    </div>
  )
}
