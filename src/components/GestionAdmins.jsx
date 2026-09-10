import { useEffect, useState } from 'react'
import { Trash2 } from 'lucide-react'
import { listerPages, listerAdmins, autoriserAdmin, revoquerAdmin } from '../lib/data'
import { useAuth } from '../lib/AuthContext'
import ConfirmDialog from './ConfirmDialog'

export default function GestionAdmins() {
  const { user } = useAuth()
  const moiEmail = user?.email?.toLowerCase()

  const [pages, setPages] = useState(null)
  const [admins, setAdmins] = useState(null)

  const [emailAdmin, setEmailAdmin] = useState('')
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

  const emailNormalise = emailAdmin.trim().toLowerCase()
  const dejaAdmin = emailNormalise ? admins?.find((a) => a.email === emailNormalise) : null

  async function handleAjouter(e) {
    e.preventDefault()
    setErreur('')
    if (!emailNormalise || dejaAdmin) return

    if (emailNormalise === moiEmail) {
      setErreur("Vous ne pouvez pas modifier vos propres droits depuis ce formulaire.")
      return
    }

    await autoriserAdmin(emailNormalise, { pageIds: [], superAdmin: false })
    setEmailAdmin('')
    charger()
  }

  async function basculerSuperAdmin(a, valeur) {
    if (a.email === moiEmail) return
    await autoriserAdmin(a.email, { pageIds: a.pageIds || [], superAdmin: valeur })
    charger()
  }

  async function basculerPageAdmin(a, pageId) {
    const actuelles = a.pageIds || []
    const nouvelles = actuelles.includes(pageId)
      ? actuelles.filter((id) => id !== pageId)
      : [...actuelles, pageId]
    await autoriserAdmin(a.email, { pageIds: nouvelles, superAdmin: a.superAdmin })
    charger()
  }

  async function confirmerRevocation() {
    await revoquerAdmin(adminARevoquer.email)
    setAdminARevoquer(null)
    charger()
  }

  return (
    <>
      <h2 style={{ marginTop: 48 }}>Ajouter un administrateur</h2>
      <form onSubmit={handleAjouter}>
        <div className="champ">
          <input
            type="email"
            placeholder="Email de l'administrateur"
            value={emailAdmin}
            onChange={(e) => setEmailAdmin(e.target.value)}
          />
          {dejaAdmin && <small>Cette personne est déjà administratrice.</small>}
        </div>
        {erreur && <div className="message message-erreur">{erreur}</div>}
        <button type="submit" className="bouton" disabled={!!dejaAdmin}>
          Ajouter
        </button>
      </form>

      {admins?.map((a) => {
        const estMoi = a.email === moiEmail
        return (
          <div
            key={a.id}
            className="entree-temoignage"
            style={{ display: 'flex', justifyContent: 'space-between', gap: 20 }}
          >
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600 }}>
                {a.email}
                {estMoi && ' (vous)'}
              </div>
              <div style={{ marginTop: 10 }}>
                {pages?.map((p) => (
                  <label
                    key={p.id}
                    style={{
                      display: 'block',
                      fontWeight: 'normal',
                      fontSize: '0.9rem',
                      marginBottom: 6,
                      opacity: a.superAdmin ? 0.5 : 1,
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={a.superAdmin || (a.pageIds || []).includes(p.id)}
                      disabled={a.superAdmin}
                      onChange={() => basculerPageAdmin(a, p.id)}
                      style={{ width: 'auto', marginRight: 8 }}
                    />
                    {p.nom}
                  </label>
                ))}
              </div>
            </div>

            <div style={{ textAlign: 'center', flexShrink: 0 }}>
              <div style={{ fontSize: '0.78rem', color: 'var(--ink-soft)', marginBottom: 4 }}>
                Admin
              </div>
              <input
                type="checkbox"
                checked={!!a.superAdmin}
                disabled={estMoi}
                onChange={(e) => basculerSuperAdmin(a, e.target.checked)}
                style={{ width: 18, height: 18 }}
                title={estMoi ? 'Vous ne pouvez pas modifier vos propres droits' : 'Super-administrateur'}
              />
              <div style={{ marginTop: 16 }}>
                <button
                  className="bouton-icone rejeter"
                  disabled={estMoi}
                  title={estMoi ? 'Vous ne pouvez pas retirer vos propres droits' : 'Retirer les droits'}
                  onClick={() => setAdminARevoquer(a)}
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          </div>
        )
      })}

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
