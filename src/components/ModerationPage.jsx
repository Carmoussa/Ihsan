import { useCallback, useEffect, useState } from 'react'
import { Check, X, Trash2, ShieldAlert } from 'lucide-react'
import {
  listerTemoignagesEnAttente,
  listerSignalementsPage,
  approuverTemoignage,
  rejeterTemoignage,
  supprimerTemoignage,
  marquerSignalementTraite,
} from '../lib/data'
import ConfirmDialog from './ConfirmDialog'

function formaterDate(timestamp) {
  if (!timestamp?.toDate) return ''
  return timestamp.toDate().toLocaleDateString('fr-CH', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export default function ModerationPage({ pageId }) {
  const [enAttente, setEnAttente] = useState(null)
  const [signalements, setSignalements] = useState(null)
  const [erreur, setErreur] = useState('')
  const [message, setMessage] = useState('')
  const [temoignageARejeter, setTemoignageARejeter] = useState(null)
  const [signalementASupprimer, setSignalementASupprimer] = useState(null)

  const charger = useCallback(async () => {
    setErreur('')
    try {
      const a = await listerTemoignagesEnAttente(pageId)
      setEnAttente(a)
    } catch (err) {
      console.error('Échec de la file en attente :', err)
      setErreur((prev) => prev + ' [file en attente en échec] ')
    }
    try {
      const s = await listerSignalementsPage(pageId)
      setSignalements(s)
    } catch (err) {
      console.error('Échec des signalements :', err)
      setErreur((prev) => prev + ' [signalements en échec] ')
    }
  }, [pageId])

  useEffect(() => {
    charger()
  }, [charger])

  useEffect(() => {
    if (!message) return
    const t = setTimeout(() => setMessage(''), 5000)
    return () => clearTimeout(t)
  }, [message])

  async function approuver(id) {
    await approuverTemoignage(pageId, id)
    setMessage(
      'Témoignage publié. Un message de confirmation est visible pour son auteur, depuis son lien de modification.',
    )
    charger()
  }

  async function confirmerRejet(motif) {
    await rejeterTemoignage(pageId, temoignageARejeter.id, motif)
    setTemoignageARejeter(null)
    setMessage(
      "Témoignage non retenu. L'auteur pourra voir ce retour depuis son lien de modification.",
    )
    charger()
  }

  async function ignorerSignalement(s) {
    await marquerSignalementTraite(s.id)
    charger()
  }

  async function supprimerTemoignageSignale() {
    await marquerSignalementTraite(signalementASupprimer.id)
    await supprimerTemoignage(pageId, signalementASupprimer.temoignageId)
    setSignalementASupprimer(null)
    charger()
  }

  if (erreur) return <div className="message message-erreur">{erreur}</div>

  return (
    <>
      {message && <div className="message message-succes">{message}</div>}

      <h3>En attente de modération</h3>
      {enAttente === null && <p className="vide">Chargement…</p>}
      {enAttente?.length === 0 && <p className="vide">Rien en attente.</p>}
      {enAttente?.map((t) => (
        <div key={t.id} className="entree-temoignage">
          <div className="entree-entete">
            <span className="entree-nom">{t.nomAffiche}</span>
            <span className="entree-date">{formaterDate(t.creeLe)} · {t.email}</span>
          </div>
          <p className="entree-texte">{t.texte}</p>
          <div className="groupe-boutons">
            <button
              className="bouton-icone approuver"
              onClick={() => approuver(t.id)}
              aria-label="Approuver ce témoignage"
              title="Approuver"
            >
              <Check size={18} />
            </button>
            <button
              className="bouton-icone rejeter"
              onClick={() => setTemoignageARejeter(t)}
              aria-label="Rejeter ce témoignage"
              title="Rejeter"
            >
              <X size={18} />
            </button>
          </div>
        </div>
      ))}

      <h3 style={{ marginTop: 40 }}>Signalements en attente</h3>
      {signalements === null && <p className="vide">Chargement…</p>}
      {signalements?.length === 0 && <p className="vide">Aucun signalement en attente.</p>}
      {signalements?.map((s) => (
        <div key={s.id} className="entree-temoignage">
          <p style={{ fontSize: '0.9rem', color: 'var(--ink-soft)' }}>
            Motif : {s.motif || '(non précisé)'}
          </p>
          <div className="groupe-boutons">
            <button
              className="bouton-icone"
              onClick={() => ignorerSignalement(s)}
              aria-label="Classer ce signalement sans suite"
              title="Classer sans suite"
            >
              <ShieldAlert size={18} />
            </button>
            <button
              className="bouton-icone rejeter"
              onClick={() => setSignalementASupprimer(s)}
              aria-label="Supprimer le témoignage signalé"
              title="Supprimer le témoignage"
            >
              <Trash2 size={18} />
            </button>
          </div>
        </div>
      ))}

      {temoignageARejeter && (
        <ConfirmDialog
          titre="Rejeter ce témoignage ?"
          message={`Le témoignage de ${temoignageARejeter.nomAffiche} ne sera pas publié. Vous pouvez indiquer un motif — il sera visible par l'auteur depuis son lien de modification.`}
          libelleConfirmer="Rejeter"
          danger
          champMotif
          libelleMotif="Motif du rejet (visible par l'auteur)"
          onConfirmer={confirmerRejet}
          onAnnuler={() => setTemoignageARejeter(null)}
        />
      )}

      {signalementASupprimer && (
        <ConfirmDialog
          titre="Supprimer ce témoignage signalé ?"
          message="Cette action est définitive."
          libelleConfirmer="Supprimer"
          danger
          onConfirmer={supprimerTemoignageSignale}
          onAnnuler={() => setSignalementASupprimer(null)}
        />
      )}
    </>
  )
}
