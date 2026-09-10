import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { listerPages } from '../lib/data'

export default function ListePersonnes() {
  const [pages, setPages] = useState(null)
  const [erreur, setErreur] = useState('')

  useEffect(() => {
    listerPages()
      .then((toutes) => setPages(toutes.filter((p) => p.actif !== false)))
      .catch(() => setErreur("Impossible de charger les pages pour l'instant."))
  }, [])

  return (
    <>
      <h1>Témoignages</h1>
      <p style={{ color: 'var(--ink-soft)' }}>Choisissez une page pour lire ou déposer un témoignage.</p>

      {erreur && <div className="message message-erreur">{erreur}</div>}

      {pages === null && !erreur && <p className="vide">Chargement…</p>}

      {pages?.length === 0 && (
        <p className="vide">Aucune page n'a encore été créée.</p>
      )}

      {pages?.length > 0 && (
        <ul className="liste-personnes">
          {pages.map((p) => (
            <li key={p.id}>
              <Link to={`/personne/${p.id}`} className="lien-personne">
                {p.photoUrl ? (
                  <img src={p.photoUrl} alt="" className="portrait" />
                ) : (
                  <span className="portrait" aria-hidden="true" />
                )}
                <span>
                  <span className="lien-personne-nom" dir="auto">{p.nom}</span>
                  {p.dates && <span className="lien-personne-dates">{p.dates}</span>}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  )
}
