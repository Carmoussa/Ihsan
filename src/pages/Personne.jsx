import { useCallback, useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { lirePage, listerTemoignagesApprouves, listerMesTemoignagesSurPage } from '../lib/data'
import { useAuth } from '../lib/AuthContext'
import FormulaireTemoignage from '../components/FormulaireTemoignage'
import EntreeTemoignage from '../components/EntreeTemoignage'
import DemandeLienModification from '../components/DemandeLienModification'

export default function Personne() {
  const { pageId } = useParams()
  const { user } = useAuth()
  const [page, setPage] = useState(undefined)
  const [temoignages, setTemoignages] = useState(null)
  const [mesTemoignages, setMesTemoignages] = useState(null)
  const [erreur, setErreur] = useState('')

  const charger = useCallback(async () => {
    try {
      const [p, t] = await Promise.all([lirePage(pageId), listerTemoignagesApprouves(pageId)])
      setPage(p)
      setTemoignages(t)
    } catch (err) {
      console.error(err)
      setErreur("Impossible de charger cette page pour l'instant.")
    }
  }, [pageId])

  const chargerMesTemoignages = useCallback(async () => {
    if (!user?.email) {
      setMesTemoignages(null)
      return
    }
    try {
      const mine = await listerMesTemoignagesSurPage(pageId, user.email)
      setMesTemoignages(mine)
    } catch (err) {
      console.error(err)
    }
  }, [pageId, user?.email])

  useEffect(() => {
    charger()
  }, [charger])

  useEffect(() => {
    chargerMesTemoignages()
  }, [chargerMesTemoignages])

  function tout() {
    charger()
    chargerMesTemoignages()
  }

  if (erreur) return <div className="message message-erreur">{erreur}</div>
  if (page === undefined) return <p className="vide">Chargement…</p>
  if (!page || page.actif === false) {
    return <p className="vide">Cette page n'est plus disponible.</p>
  }

  // Sur la page publique, on n'affiche pas deux fois un même témoignage :
  // celui de l'auteur connecté est retiré de la liste publique, il apparaît
  // dans sa section personnelle ci-dessous (avec son statut).
  const mesIds = new Set((mesTemoignages || []).map((t) => t.id))
  const temoignagesPublics = (temoignages || []).filter((t) => !mesIds.has(t.id))

  return (
    <>
      <div className="entete-personne">
        {page.photoUrl ? (
          <img src={page.photoUrl} alt="" className="portrait-grand" />
        ) : (
          <span className="portrait-grand" aria-hidden="true" />
        )}
        <div>
          <h1 style={{ marginBottom: 2 }} dir="auto">{page.nom}</h1>
          {page.dates && <p style={{ color: 'var(--ink-soft)', margin: 0 }}>{page.dates}</p>}
        </div>
      </div>

      {page.bio && <p className="bio" dir="auto">{page.bio}</p>}

      {mesTemoignages?.length > 0 && (
        <>
          <h2>Vos témoignages</h2>
          <div className="registre">
            {mesTemoignages.map((t) => (
              <EntreeTemoignage
                key={t.id}
                temoignage={t}
                pageId={pageId}
                estProprietaire
                afficherStatut
                onChange={tout}
              />
            ))}
          </div>
        </>
      )}

      <h2>Témoignages</h2>
      <div className="registre">
        {temoignages === null && <p className="vide">Chargement…</p>}
        {temoignages?.length === 0 && mesTemoignages?.length === 0 && (
          <p className="vide">Aucun témoignage n'a encore été publié.</p>
        )}
        {temoignagesPublics.map((t) => (
          <EntreeTemoignage
            key={t.id}
            temoignage={t}
            pageId={pageId}
            estProprietaire={user?.email && user.email === t.email}
            onChange={tout}
          />
        ))}
      </div>

      <h2>Déposer un témoignage</h2>
      <FormulaireTemoignage pageId={pageId} onDepose={tout} />

      {!user?.email && (
        <div style={{ marginTop: 40, paddingTop: 24, borderTop: '1px solid var(--line)' }}>
          <h2 style={{ fontSize: '1.1rem' }}>Vous avez déjà déposé un témoignage ici ?</h2>
          <p style={{ color: 'var(--ink-soft)', fontSize: '0.92rem' }}>
            Recevez un lien par email pour le modifier, le supprimer, ou simplement voir où il en
            est — à tout moment.
          </p>
          <DemandeLienModification redirectPath={`/personne/${pageId}`} />
        </div>
      )}
    </>
  )
}
