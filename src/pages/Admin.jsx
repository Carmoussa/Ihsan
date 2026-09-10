import { useEffect, useState } from 'react'
import { useAuth } from '../lib/AuthContext'
import { listerPages } from '../lib/data'
import AdminConnexion from './AdminConnexion'
import ModerationPage from '../components/ModerationPage'
import GestionSuperAdmin from '../components/GestionSuperAdmin'

export default function Admin() {
  const { user, admin, chargement } = useAuth()
  const [pages, setPages] = useState(null)
  const [pageSelectionnee, setPageSelectionnee] = useState(null)

  useEffect(() => {
    if (admin) {
      listerPages().then((toutes) => {
        const autorisees = admin.superAdmin
          ? toutes
          : toutes.filter((p) => (admin.pageIds || []).includes(p.id))
        setPages(autorisees)
        setPageSelectionnee((prev) => prev || autorisees[0]?.id || null)
      })
    }
  }, [admin])

  if (chargement) return <p className="vide">Chargement…</p>

  if (!user) return <AdminConnexion />

  if (!admin) {
    return (
      <>
        <h1>Espace administrateur</h1>
        <div className="message message-info">
          Vous êtes connecté·e en tant que {user.email}, mais ce compte n'a pas
          encore de droits d'administration sur ce site. Demandez à un
          super-administrateur de vous autoriser.
        </div>
      </>
    )
  }

  return (
    <>
      <h1>Tableau de bord</h1>
      <p style={{ color: 'var(--ink-soft)' }}>
        Connecté·e en tant que {admin.email}
        {admin.superAdmin ? ' — super-administrateur' : ''}.
      </p>

      {pages?.length === 0 && (
        <p className="vide">Aucune page ne vous a encore été confiée.</p>
      )}

      {pages?.length > 0 && (
        <>
          <div className="champ" style={{ maxWidth: 320 }}>
            <label>Page à modérer</label>
            <select
              value={pageSelectionnee || ''}
              onChange={(e) => setPageSelectionnee(e.target.value)}
              style={{
                width: '100%',
                padding: '9px 12px',
                border: '1px solid var(--line)',
                borderRadius: 3,
                background: 'var(--paper-raised)',
              }}
            >
              {pages.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nom}
                </option>
              ))}
            </select>
          </div>

          {pageSelectionnee && <ModerationPage pageId={pageSelectionnee} />}
        </>
      )}

      {admin.superAdmin && <GestionSuperAdmin />}
    </>
  )
}
