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
  const [pageIdsAdmin, setPageIdsAdmin] = useState([])
  const [superAdminFlag, setSuperAdminFlag] = useState(false)
  const [erreur, setErreur] = useState('')
  const [adminExistant, setAdminExistant] = useState(null)

  const [adminARevoquer, setAdminARevoquer] = useState(null)

  async function charger() {
    const [p, a] = await Promise.all([listerPages(), listerAdmins()])
    setPages(p)
    setAdmins(a)
  }

  useEffect(() => {
    charger()
  }, [])

  // Dès que l'email saisi correspond à un admin déjà autorisé, on
  // pré-remplit le formulaire avec ses droits actuels — cocher une page de
  // plus l'ajoute réellement, au lieu d'écraser les précédentes.
  useEffect(() => {
    const emailNormalise = emailAdmin.trim().toLowerCase()
    const existant = admins?.find((a) => a.email === emailNormalise) || null
    setAdminExistant(existant)
    if (existant) {
      setPageIdsAdmin(existant.pageIds || [])
      setSuperAdminFlag(!!existant.superAdmin)
    }
  }, [emailAdmin, admins])

  async function handleAutoriserAdmin(e) {
    e.preventDefault()
    setErreur('')
    const emailNormalise = emailAdmin.trim().toLowerCase()
    if (!emailNormalise) return

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
    setAdminExistant(null)
    charger()
  }

  async function basculerSuperAdmin(a, valeur) {
    if (a.email === moiEmail) return
    await autoriserAdmin(a.email, { pageIds: a.pageIds || [], superAdmin: valeur })
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
          <input
            type="email"
            placeholder="Email de l'administrateur"
            value={emailAdmin}
            onChange={(e) => setEmailAdmin(e.target.value)}
          />
          {adminExistant && (
            <small>
              Cette personne a déjà des droits — le formulaire est pré-rempli ; ajoutez une page
              sans décocher les autres pour les conserver.
            </small>
          )}
        </div>

        <div style={{ display: 'flex', gap: 32, marginBottom: 16 }}>
          <div style={{ flex: 1 }}>
            {pages?.map((p) => (
              <label
                key={p.id}
                style={{
                  display: 'block',
                  fontWeight: 'normal',
                  marginBottom: 6,
                  opacity: superAdminFlag ? 0.5 : 1,
                }}
              >
                <input
                  type="checkbox"
                  checked={pageIdsAdmin.includes(p.id)}
                  onChange={() => togglePageId(p.id)}
                  disabled={superAdminFlag}
                  style={{ width: 'auto', marginRight: 8 }}
                />
                {p.nom}
              </label>
            ))}
          </div>
          <div>
            <label style={{ fontWeight: 'normal', whiteSpace: 'nowrap' }}>
              <input
                type="checkbox"
                checked={superAdminFlag}
                onChange={(e) => setSuperAdminFlag(e.target.checked)}
                style={{ width: 'auto', marginRight: 8 }}
              />
              Super-admin
            </label>
          </div>
        </div>

        {erreur && <div className="message message-erreur">{erreur}</div>}
        <button type="submit" className="bouton">
          Autoriser
        </button>
      </form>

      {admins?.map((a) => {
        const estMoi = a.email === moiEmail
        return (
          <div
            key={a.id}
            className="entree-temoignage"
            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}
          >
            <div>
              <div style={{ fontWeight: 600 }}>
                {a.email}
                {estMoi && ' (vous)'}
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--ink-soft)', marginTop: 4 }}>
                {a.superAdmin
                  ? 'Toutes les pages'
                  : (a.pageIds || [])
                      .map((id) => pages?.find((p) => p.id === id)?.nom || id)
                      .join(', ') || 'Aucune page'}
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ textAlign: 'center' }}>
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
              </div>
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
