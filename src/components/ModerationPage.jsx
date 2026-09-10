import { useCallback, useEffect, useState } from 'react'
import {
  listerTemoignagesEnAttente,
  listerSignalementsPage,
  changerStatutTemoignage,
  supprimerTemoignage,
  marquerSignalementTraite,
} from '../lib/data'

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

  const charger = useCallback(async () => {
    try {
      const [a, s] = await Promise.all([
        listerTemoignagesEnAttente(pageId),
        listerSignalementsPage(pageId),
      ])
      setEnAttente(a)
      setSignalements(s)
    } catch {
      setErreur('Le chargement de la file de modération a échoué.')
    }
  }, [pageId])

  useEffect(() => {
    charger()
  }, [charger])

  async function approuver(id) {
    await changerStatutTemoignage(pageId, id, 'approuve')
    charger()
  }

  async function rejeter(id) {
    if (!window.confirm('Rejeter (et supprimer) ce témoignage ?')) return
    await supprimerTemoignage(pageId, id)
    charger()
  }

  async function ignorerSignalement(s) {
    await marquerSignalementTraite(pageId, s.temoignageId, s.id)
    charger()
  }

  async function supprimerTemoignageSignale(s) {
    if (!window.confirm('Supprimer ce témoignage suite au signalement ?')) return
    await marquerSignalementTraite(pageId, s.temoignageId, s.id)
    await supprimerTemoignage(pageId, s.temoignageId)
    charger()
  }

  if (erreur) return <div className="message message-erreur">{erreur}</div>

  return (
    <>
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
            <button className="bouton" onClick={() => approuver(t.id)}>
              Approuver
            </button>
            <button className="bouton bouton-danger" onClick={() => rejeter(t.id)}>
              Rejeter
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
            <button className="bouton bouton-discret" onClick={() => ignorerSignalement(s)}>
              Classer sans suite
            </button>
            <button className="bouton bouton-danger" onClick={() => supprimerTemoignageSignale(s)}>
              Supprimer le témoignage signalé
            </button>
          </div>
        </div>
      ))}
    </>
  )
}
