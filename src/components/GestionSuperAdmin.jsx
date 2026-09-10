import { useEffect, useState } from 'react'
import {
  listerPages,
  creerPage,
  supprimerPage,
  listerAdmins,
  autoriserAdmin,
  revoquerAdmin,
} from '../lib/data'

export default function GestionSuperAdmin() {
  const [pages, setPages] = useState(null)
  const [admins, setAdmins] = useState(null)

  const [nom, setNom] = useState('')
  const [dates, setDates] = useState('')
  const [bio, setBio] = useState('')
  const [photoUrl, setPhotoUrl] = useState('')

  const [emailAdmin, setEmailAdmin] = useState('')
  const [pageIdsAdmin, setPageIdsAdmin] = useState([])
  const [superAdminFlag, setSuperAdminFlag] = useState(false)

  async function charger() {
    const [p, a] = await Promise.all([listerPages(), listerAdmins()])
    setPages(p)
    setAdmins(a)
  }

  useEffect(() => {
    charger()
  }, [])

  async function handleCreerPage(e) {
    e.preventDefault()
    if (!nom.trim()) return
    await creerPage({ nom: nom.trim(), dates: dates.trim(), bio: bio.trim(), photoUrl: photoUrl.trim() })
    setNom('')
    setDates('')
    setBio('')
    setPhotoUrl('')
    charger()
  }

  async function handleSupprimerPage(id) {
    if (!window.confirm('Supprimer cette page et son contenu ? Cette action est irréversible.')) return
    await supprimerPage(id)
    charger()
  }

  async function handleAutoriserAdmin(e) {
    e.preventDefault()
    if (!emailAdmin.trim()) return
    await autoriserAdmin(emailAdmin, { pageIds: pageIdsAdmin, superAdmin: superAdminFlag })
    setEmailAdmin('')
    setPageIdsAdmin([])
    setSuperAdminFlag(false)
    charger()
  }

  async function handleRevoquerAdmin(email) {
    if (!window.confirm(`Retirer les droits d'administration de ${email} ?`)) return
    await revoquerAdmin(email)
    charger()
  }

  function togglePageId(id) {
    setPageIdsAdmin((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  return (
    <>
      <h2 style={{ marginTop: 48 }}>Créer une page</h2>
      <form onSubmit={handleCreerPage}>
        <div className="champ">
          <label>Nom de la personne</label>
          <input value={nom} onChange={(e) => setNom(e.target.value)} />
        </div>
        <div className="champ">
          <label>Dates (ex. 1945 – 2024)</label>
          <input value={dates} onChange={(e) => setDates(e.target.value)} />
        </div>
        <div className="champ">
          <label>Courte présentation (optionnel)</label>
          <textarea value={bio} onChange={(e) => setBio(e.target.value)} />
        </div>
        <div className="champ">
          <label>URL de la photo (optionnel)</label>
          <input value={photoUrl} onChange={(e) => setPhotoUrl(e.target.value)} />
        </div>
        <button type="submit" className="bouton">
          Créer la page
        </button>
      </form>

      <h2 style={{ marginTop: 48 }}>Pages existantes</h2>
      {pages?.map((p) => (
        <div key={p.id} className="entree-temoignage" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>{p.nom}</span>
          <button className="lien-discret" onClick={() => handleSupprimerPage(p.id)}>
            Supprimer
          </button>
        </div>
      ))}

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
          {admins?.map((a) => (
            <tr key={a.id}>
              <td>{a.email}</td>
              <td>
                {a.superAdmin
                  ? 'Super-administrateur'
                  : (a.pageIds || [])
                      .map((id) => pages?.find((p) => p.id === id)?.nom || id)
                      .join(', ') || 'Aucune page'}
              </td>
              <td>
                <button className="lien-discret" onClick={() => handleRevoquerAdmin(a.email)}>
                  Retirer
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  )
}
