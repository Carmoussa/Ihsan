import { useCallback, useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { lirePage, listerTemoignagesApprouves } from '../lib/data'
import FormulaireTemoignage from '../components/FormulaireTemoignage'
import EntreeTemoignage from '../components/EntreeTemoignage'

export default function Personne() {
  const { pageId } = useParams()
  const [page, setPage] = useState(undefined)
  const [temoignages, setTemoignages] = useState(null)
  const [erreur, setErreur] = useState('')
  const [formulaireOuvert, setFormulaireOuvert] = useState(false)

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

  useEffect(() => {
    charger()
  }, [charger])

  if (erreur) return <div className="message message-erreur">{erreur}</div>
  if (page === undefined) return <p className="vide">Chargement…</p>
  if (!page || page.actif === false) {
    return <p className="vide">Cette page n'est plus disponible.</p>
  }

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

      <button className="bouton" onClick={() => setFormulaireOuvert(true)}>
        Ajouter un témoignage
      </button>

      <h2 style={{ marginTop: 32 }}>Témoignages</h2>
      <div className="registre">
        {temoignages === null && <p className="vide">Chargement…</p>}
        {temoignages?.length === 0 && (
          <p className="vide">Aucun témoignage n'a encore été publié.</p>
        )}
        {temoignages?.map((t) => (
          <EntreeTemoignage key={t.id} temoignage={t} pageId={pageId} onChange={charger} />
        ))}
      </div>

      {formulaireOuvert && (
        <div className="fenetre-modale-fond" role="presentation">
          <div
            className="fenetre-modale"
            style={{ maxWidth: 560 }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="titre-temoignage"
          >
            <h3 id="titre-temoignage" dir="auto">Témoignage pour {page.nom}</h3>
            <FormulaireTemoignage
              pageId={pageId}
              nomPage={page.nom}
              onDepose={charger}
              onAnnuler={() => setFormulaireOuvert(false)}
              onFermer={() => setFormulaireOuvert(false)}
            />
          </div>
        </div>
      )}
    </>
  )
}
