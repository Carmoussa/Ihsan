import { useCallback, useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { lirePage, listerTemoignagesApprouves } from '../lib/data'
import { useAuth } from '../lib/AuthContext'
import FormulaireTemoignage from '../components/FormulaireTemoignage'
import EntreeTemoignage from '../components/EntreeTemoignage'
import DemandeLienModification from '../components/DemandeLienModification'

export default function Personne() {
  const { pageId } = useParams()
  const { user } = useAuth()
  const [page, setPage] = useState(undefined)
  const [temoignages, setTemoignages] = useState(null)
  const [erreur, setErreur] = useState('')

  const charger = useCallback(async () => {
    try {
      const [p, t] = await Promise.all([lirePage(pageId), listerTemoignagesApprouves(pageId)])
      setPage(p)
      setTemoignages(t)
    } catch {
      setErreur("Impossible de charger cette page pour l'instant.")
    }
  }, [pageId])

  useEffect(() => {
    charger()
  }, [charger])

  if (erreur) return <div className="message message-erreur">{erreur}</div>
  if (page === undefined) return <p className="vide">Chargement…</p>
  if (!page) return <p className="vide">Cette page n'existe pas.</p>

  return (
    <>
      <div className="entete-personne">
        {page.photoUrl ? (
          <img src={page.photoUrl} alt="" className="portrait-grand" />
        ) : (
          <span className="portrait-grand" aria-hidden="true" />
        )}
        <div>
          <h1 style={{ marginBottom: 2 }}>{page.nom}</h1>
          {page.dates && <p style={{ color: 'var(--ink-soft)', margin: 0 }}>{page.dates}</p>}
        </div>
      </div>

      {page.bio && <p className="bio">{page.bio}</p>}

      <h2>Témoignages</h2>
      <div className="registre">
        {temoignages === null && <p className="vide">Chargement…</p>}
        {temoignages?.length === 0 && (
          <p className="vide">Aucun témoignage n'a encore été publié.</p>
        )}
        {temoignages?.map((t) => (
          <EntreeTemoignage
            key={t.id}
            temoignage={t}
            pageId={pageId}
            estProprietaire={user?.email && user.email === t.email}
            onChange={charger}
          />
        ))}
      </div>

      <h2>Déposer un témoignage</h2>
      <FormulaireTemoignage pageId={pageId} onDepose={charger} />

      <div style={{ marginTop: 40, paddingTop: 24, borderTop: '1px solid var(--line)' }}>
        <h2 style={{ fontSize: '1.1rem' }}>Vous avez déjà déposé un témoignage ici ?</h2>
        <p style={{ color: 'var(--ink-soft)', fontSize: '0.92rem' }}>
          Recevez un lien par email pour le modifier ou le supprimer, à tout moment.
        </p>
        <DemandeLienModification redirectPath={`/personne/${pageId}`} />
      </div>
    </>
  )
}
