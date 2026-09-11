import { useCallback, useEffect, useState } from 'react'
import { Check, X, Trash2, ShieldAlert } from 'lucide-react'
import {
  listerTemoignagesEnAttente,
  listerSignalementsPage,
  listerTemoignagesSupprimesParAuteur,
  approuverTemoignage,
  rejeterTemoignage,
  supprimerTemoignage,
  marquerSignalementTraite,
  lirePage,
} from '../lib/data'
import { notifierApprobation, notifierRejet } from '../lib/email'
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

export default function ModerationPage({ pageId }) {
  const [page, setPage] = useState(null)
  const [enAttente, setEnAttente] = useState(null)
  const [signalements, setSignalements] = useState(null)
  const [retraits, setRetraits] = useState(null)
  const [erreur, setErreur] = useState('')
  const [message, setMessage] = useState('')
  const [temoignageARejeter, setTemoignageARejeter] = useState(null)
  const [signalementASupprimer, setSignalementASupprimer] = useState(null)
  const [retraitASupprimer, setRetraitASupprimer] = useState(null)

  const charger = useCallback(async () => {
    setErreur('')
    try {
      const [p, a] = await Promise.all([lirePage(pageId), listerTemoignagesEnAttente(pageId)])
      setPage(p)
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
    try {
      const r = await listerTemoignagesSupprimesParAuteur(pageId)
      setRetraits(r)
    } catch (err) {
      console.error('Échec des retraits :', err)
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

  async function approuver(t) {
    await approuverTemoignage(pageId, t.id)
    if (t.email) {
      notifierApprobation(t.email, {
        nomAffiche: t.nomAffiche,
        nomPage: page?.nom || '',
        urlPage: `${window.location.origin}${import.meta.env.BASE_URL}personne/${pageId}`,
      })
    }
    setMessage('Témoignage publié.' + (t.email ? " Une notification a été envoyée à l'auteur." : ''))
    charger()
  }

  async function confirmerRejet(motif) {
    const t = temoignageARejeter
    await rejeterTemoignage(pageId, t.id, motif)
    if (t.email) {
      notifierRejet(t.email, { nomAffiche: t.nomAffiche, nomPage: page?.nom || '', motif })
    }
    setTemoignageARejeter(null)
    setMessage(
      'Témoignage non retenu.' +
        (t.email
          ? " Une notification a été envoyée à l'auteur."
          : " Comme aucun email n'a été fourni et que le témoignage n'est pas rendu public, son auteur ne saura pas pourquoi."),
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

  async function confirmerSuppressionRetrait() {
    await supprimerTemoignage(pageId, retraitASupprimer.id)
    setRetraitASupprimer(null)
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
            <span className="entree-nom" dir="auto">{t.nomAffiche}</span>
            <span className="entree-date">
              {formaterDate(t.creeLe)}
              {t.email && ` · ${t.email}`}
            </span>
          </div>
          <p className="entree-texte" dir="auto">{t.texte}</p>
          <AffichageMedia url={t.mediaUrl} type={t.mediaType} />
          <div className="groupe-boutons">
            <button
              className="bouton-icone approuver"
              onClick={() => approuver(t)}
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

      <h3 style={{ marginTop: 40 }}>Retraits demandés par les auteurs</h3>
      {retraits === null && <p className="vide">Chargement…</p>}
      {retraits?.length === 0 && <p className="vide">Aucun retrait en attente.</p>}
      {retraits?.map((t) => (
        <div key={t.id} className="entree-temoignage">
          <div className="entree-entete">
            <span className="entree-nom" dir="auto">{t.nomAffiche}</span>
            <span className="entree-date">{formaterDate(t.creeLe)}</span>
          </div>
          <p className="entree-texte" dir="auto">{t.texte}</p>
          <AffichageMedia url={t.mediaUrl} type={t.mediaType} />
          <p style={{ fontSize: '0.85rem', color: 'var(--ink-soft)' }}>
            Déjà masqué du site public — en attente de suppression définitive.
          </p>
          <div className="groupe-boutons">
            <button
              className="bouton-icone rejeter"
              onClick={() => setRetraitASupprimer(t)}
              aria-label="Supprimer définitivement ce témoignage"
              title="Supprimer définitivement"
            >
              <Trash2 size={18} />
            </button>
          </div>
        </div>
      ))}

      <h3 style={{ marginTop: 40 }}>Signalements en attente</h3>
      {signalements === null && <p className="vide">Chargement…</p>}
      {signalements?.length === 0 && <p className="vide">Aucun signalement en attente.</p>}
      {signalements?.map((s) => (
        <div key={s.id} className="entree-temoignage">
          <p style={{ fontSize: '0.9rem', color: 'var(--ink-soft)' }} dir="auto">
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
          message={`Le témoignage de ${temoignageARejeter.nomAffiche} ne sera pas publié.`}
          libelleConfirmer="Rejeter"
          danger
          champMotif
          libelleMotif="Motif du rejet (pour votre référence interne)"
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

      {retraitASupprimer && (
        <ConfirmDialog
          titre="Supprimer définitivement ce témoignage ?"
          message="Cette action est irréversible."
          libelleConfirmer="Supprimer"
          danger
          onConfirmer={confirmerSuppressionRetrait}
          onAnnuler={() => setRetraitASupprimer(null)}
        />
      )}
    </>
  )
}
