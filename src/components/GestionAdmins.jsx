import { useEffect, useState } from 'react'
import { listerPages, listerAdmins, autoriserAdmin, revoquerAdmin } from '../lib/data'
import { useAuth } from '../lib/AuthContext'
import ConfirmDialog from './ConfirmDialog'

export default function GestionAdmins() {
  const { user } = useAuth()
  const moiEmail = user?.email?.toLowerCase()

  const [pages, setPages] = useState(null)
  const [admins, setAdmins] = useState(null)

  const [emailAdmin, setEmailAdmin] = useState('')
  const [pageIdsAdmin, setPageIdsAdmin] = useState([])
  const [superAdminFlag, setSuperAdminFlag] = useState(false)
  const [erreur, setErreur] = useState('')

  const [adminARevoquer, setAdminARevoquer] = useState(null)

  async function charger() {
    const [p, a] = await Promise.all([listerPages(), listerAdmins()])
    setPages(p)
    setAdmins(a)
  }

  useEffect(() => {
    charger()
  }, [])

  async function handleAutoriserAdmin(e) {
    e.preventDefault()
    setErreur('')
    const emailNormalise = emailAdmin.trim().toLowerCase()
    if (!emailNormalise) return

    // On ne peut pas modifier ses propres droits depuis ce formulaire, pour
    // éviter de se retirer soi-même l'accès par erreur.
    if (emailNormalise === moiEmail) {
      setErreur(
        "Vous ne pouvez pas modifier vos propres droits depuis ce formulaire. Demandez à un⋅e autre super-administrateur⋅rice si besoin.",
      )
      return
    }

    await autoriserAdmin(emailNormalise, { pageIds: pageIdsAdmin, superAdmin: superAdminFlag })
    setEmailAdmin('')
    setPageIdsAdmin([])
    setSuperAdminFlag(false)
    charger()
  }

  async function confirmerRevocation() {
    await revoquerAdmin(adminARevoquer.email)
    setAdminARevoquer(null)
    charger()
  }

  function togglePageId(id) {
    setPageIdsAdmin((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  return (
    <>
      <h2 style={{ marginTop: 48 }}>Autoriser un administrateur</h2>
      <form onSubmit={handleAutoriserAdmin}>
        <div className="champ">
          <label>Email de la personne à autoriser</label>
          <input
            type="email"
            value={emailAdmin}
            onChange={(e) => setEmailAdmin(e.target.value)}
          />
        </div>
        <div className="champ">
          <label>
            <input
              type="checkbox"
              checked={superAdminFlag}
              onChange={(e) => setSuperAdminFlag(e.target.checked)}
              style={{ width: 'auto', marginRight: 8 }}
            />
            Super-administrateur (modère toutes les pages, peut en créer et gérer les admins)
          </label>
        </div>
        {!superAdminFlag && (
          <div className="champ">
            <label>Pages que cette personne peut modérer</label>
            {pages?.map((p) => (
              <label key={p.id} style={{ display: 'block', fontWeight: 'normal', marginBottom: 4 }}>
                <input
                  type="checkbox"
                  checked={pageIdsAdmin.includes(p.id)}
                  onChange={() => togglePageId(p.id)}
                  style={{ width: 'auto', marginRight: 8 }}
                />
                {p.nom}
              </label>
            ))}
          </div>
        )}
        {erreur && <div className="message message-erreur">{erreur}</div>}
        <button type="submit" className="bouton">
          Autoriser
        </button>
      </form>

      <h2 style={{ marginTop: 48 }}>Administrateurs</h2>
      <table className="tableau-admin">
        <thead>
          <tr>
            <th>Email</th>
            <th>Droits</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {admins?.map((a) => {
            const estMoi = a.email === moiEmail
            return (
              <tr key={a.id}>
                <td>
                  {a.email}
                  {estMoi && ' (vous)'}
                </td>
                <td>
                  {a.superAdmin
                    ? 'Super-administrateur'
                    : (a.pageIds || [])
                        .map((id) => pages?.find((p) => p.id === id)?.nom || id)
                        .join(', ') || 'Aucune page'}
                </td>
                <td>
                  <button
                    className="lien-discret"
                    disabled={estMoi}
                    title={estMoi ? 'Vous ne pouvez pas retirer vos propres droits' : undefined}
                    onClick={() => setAdminARevoquer(a)}
                  >
                    Retirer
                  </button>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>

      {adminARevoquer && (
        <ConfirmDialog
          titre={`Retirer les droits de ${adminARevoquer.email} ?`}
          message="Cette personne ne pourra plus accéder à l'espace administrateur."
          libelleConfirmer="Retirer les droits"
          danger
          onConfirmer={confirmerRevocation}
          onAnnuler={() => setAdminARevoquer(null)}
        />
      )}
    </>
  )
}
