import { useEffect, useState } from 'react'
import { useAuth } from '../lib/AuthContext'
import { listerPages } from '../lib/data'
import AdminConnexion from './AdminConnexion'
import ModerationPage from '../components/ModerationPage'
import GestionPages from '../components/GestionPages'
import GestionAdmins from '../components/GestionAdmins'
import GestionEmail from '../components/GestionEmail'

export default function Admin() {
  const { user, admin, chargement } = useAuth()
  const [pages, setPages] = useState(null)
  const [pageSelectionnee, setPageSelectionnee] = useState(null)
  const [onglet, setOnglet] = useState('moderation')

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

  const onglets = [{ id: 'moderation', label: 'Modération' }]
  if (admin.superAdmin) {
    onglets.push(
      { id: 'pages', label: 'Pages' },
      { id: 'admins', label: 'Administrateurs' },
      { id: 'email', label: 'Email' },
    )
  }

  return (
    <>
      <h1>Tableau de bord</h1>
      {admin.superAdmin && (
        <p style={{ color: 'var(--ink-soft)', fontSize: '0.85rem' }}>Super-administrateur</p>
      )}

      <nav style={{ display: 'flex', gap: 4, borderBottom: '1px solid var(--line)', marginBottom: 32 }}>
        {onglets.map((o) => (
          <button
            key={o.id}
            onClick={() => setOnglet(o.id)}
            style={{
              background: 'none',
              border: 'none',
              borderBottom: onglet === o.id ? '2px solid var(--brass)' : '2px solid transparent',
              padding: '10px 16px 8px',
              marginBottom: -1,
              fontFamily: 'var(--sans)',
              fontSize: '0.95rem',
              fontWeight: onglet === o.id ? 600 : 400,
              color: onglet === o.id ? 'var(--ink)' : 'var(--ink-soft)',
              cursor: 'pointer',
            }}
          >
            {o.label}
          </button>
        ))}
      </nav>

      {onglet === 'moderation' && (
        <>
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
        </>
      )}

      {onglet === 'pages' && admin.superAdmin && <GestionPages />}
      {onglet === 'admins' && admin.superAdmin && <GestionAdmins />}
      {onglet === 'email' && admin.superAdmin && <GestionEmail />}
    </>
  )
}
