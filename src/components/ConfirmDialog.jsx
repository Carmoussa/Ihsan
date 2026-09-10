import { useState } from 'react'

export default function ConfirmDialog({
  titre,
  message,
  libelleConfirmer = 'Confirmer',
  danger = false,
  champMotif = false,
  libelleMotif = 'Motif (optionnel)',
  onConfirmer,
  onAnnuler,
}) {
  const [motif, setMotif] = useState('')
  const [envoi, setEnvoi] = useState(false)

  async function confirmer() {
    setEnvoi(true)
    try {
      await onConfirmer(motif.trim())
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
