import { useEffect, useState } from 'react'
import { Pencil, Power, PowerOff, Trash2, Plus } from 'lucide-react'
import { listerPages, creerPage, modifierPage, basculerActivationPage, supprimerPage } from '../lib/data'
import { uploaderFichier, typeMedia, LIMITES_TAILLE } from '../lib/storage'
import ConfirmDialog from './ConfirmDialog'

const CHAMPS_VIDES = { nom: '', dates: '', bio: '', photoUrl: '' }

function validerPhoto(fichier) {
  if (typeMedia(fichier) !== 'image') return 'Seules les images sont acceptées pour la photo.'
  if (fichier.size > LIMITES_TAILLE.image) {
    return `Image trop volumineuse (max ${Math.round(LIMITES_TAILLE.image / 1024 / 1024)} Mo).`
  }
  return null
}

export default function GestionPages() {
  const [pages, setPages] = useState(null)
  const [creationOuverte, setCreationOuverte] = useState(false)
  const [nouvellePage, setNouvellePage] = useState(CHAMPS_VIDES)
  const [fichierNouvelle, setFichierNouvelle] = useState(null)
  const [pageEnEditionId, setPageEnEditionId] = useState(null)
  const [champsEdition, setChampsEdition] = useState(CHAMPS_VIDES)
  const [fichierEdition, setFichierEdition] = useState(null)
  const [action, setAction] = useState(null) // { page, type: 'desactiver' | 'activer' | 'supprimer' }
  const [erreur, setErreur] = useState('')
  const [envoi, setEnvoi] = useState(false)

  async function charger() {
    setPages(await listerPages())
  }

  useEffect(() => {
    charger()
  }, [])

  function handleFichier(e, setFichier) {
    const f = e.target.files?.[0]
    if (!f) {
      setFichier(null)
      return
    }
    const messageErreur = validerPhoto(f)
    if (messageErreur) {
      setErreur(messageErreur)
      e.target.value = ''
      setFichier(null)
      return
    }
    setErreur('')
    setFichier(f)
  }

  async function handleCreerPage(e) {
    e.preventDefault()
    if (!nouvellePage.nom.trim()) return
    setEnvoi(true)
    try {
      const pageId = await creerPage({
        nom: nouvellePage.nom.trim(),
        dates: nouvellePage.dates.trim(),
        bio: nouvellePage.bio.trim(),
        photoUrl: nouvellePage.photoUrl.trim(),
      })
      if (fichierNouvelle) {
        const chemin = `pages/${pageId}/photo-${fichierNouvelle.name}`
        const { url } = await uploaderFichier(chemin, fichierNouvelle)
        await modifierPage(pageId, {
          nom: nouvellePage.nom.trim(),
          dates: nouvellePage.dates.trim(),
          bio: nouvellePage.bio.trim(),
          photoUrl: url,
          photoChemin: chemin,
        })
      }
      setNouvellePage(CHAMPS_VIDES)
      setFichierNouvelle(null)
      setCreationOuverte(false)
      charger()
    } catch (err) {
      console.error(err)
      setErreur("La création de la page n'a pas abouti.")
    } finally {
      setEnvoi(false)
    }
  }

  function ouvrirEdition(p) {
    setPageEnEditionId(p.id)
    setChampsEdition({ nom: p.nom, dates: p.dates || '', bio: p.bio || '', photoUrl: p.photoUrl || '' })
    setFichierEdition(null)
    setErreur('')
  }

  async function enregistrerEdition(e) {
    e.preventDefault()
    setEnvoi(true)
    try {
      let photoUrl = champsEdition.photoUrl.trim()
      let photoChemin = pages?.find((p) => p.id === pageEnEditionId)?.photoChemin || ''

      if (fichierEdition) {
        const chemin = `pages/${pageEnEditionId}/photo-${fichierEdition.name}`
        const resultat = await uploaderFichier(chemin, fichierEdition)
        photoUrl = resultat.url
        photoChemin = chemin
      }

      await modifierPage(pageEnEditionId, {
        nom: champsEdition.nom.trim(),
        dates: champsEdition.dates.trim(),
        bio: champsEdition.bio.trim(),
        photoUrl,
        photoChemin,
      })
      setPageEnEditionId(null)
      setFichierEdition(null)
      charger()
    } catch (err) {
      console.error(err)
      setErreur("La modification n'a pas abouti.")
    } finally {
      setEnvoi(false)
    }
  }

  async function confirmerAction() {
    if (action.type === 'supprimer') {
      await supprimerPage(action.page.id)
    } else {
      await basculerActivationPage(action.page.id, action.type === 'activer')
    }
    setAction(null)
    charger()
  }

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 48 }}>
        <h2 style={{ margin: 0 }}>Pages existantes</h2>
        <button
          className="bouton-icone"
          onClick={() => setCreationOuverte(true)}
          aria-label="Ajouter une page"
          title="Ajouter une page"
        >
          <Plus size={18} />
        </button>
      </div>

      {pages?.map((p) =>
        pageEnEditionId === p.id ? (
          <form key={p.id} onSubmit={enregistrerEdition} className="entree-temoignage">
            <div className="champ">
              <label>Nom de la personne</label>
              <input
                value={champsEdition.nom}
                onChange={(e) => setChampsEdition({ ...champsEdition, nom: e.target.value })}
                dir="auto"
              />
            </div>
            <div className="champ">
              <label>Dates</label>
              <input
                value={champsEdition.dates}
                onChange={(e) => setChampsEdition({ ...champsEdition, dates: e.target.value })}
              />
            </div>
            <div className="champ">
              <label>Courte présentation</label>
              <textarea
                value={champsEdition.bio}
                onChange={(e) => setChampsEdition({ ...champsEdition, bio: e.target.value })}
                dir="auto"
              />
            </div>
            <div className="champ">
              <label>URL de la photo</label>
              <input
                value={champsEdition.photoUrl}
                onChange={(e) => setChampsEdition({ ...champsEdition, photoUrl: e.target.value })}
              />
              <small>Ou téléversez une image ci-dessous (elle remplacera l'URL) :</small>
              <input type="file" accept="image/*" onChange={(e) => handleFichier(e, setFichierEdition)} />
            </div>
            {erreur && <div className="message message-erreur">{erreur}</div>}
            <div className="groupe-boutons">
              <button type="submit" className="bouton" disabled={envoi}>
                {envoi ? 'Enregistrement…' : 'Enregistrer'}
              </button>
              <button
                type="button"
                className="bouton bouton-discret"
                onClick={() => setPageEnEditionId(null)}
              >
                Annuler
              </button>
            </div>
          </form>
        ) : (
          <div
            key={p.id}
            className="entree-temoignage"
            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
          >
            <span>
              {p.nom}{' '}
              {p.actif === false && (
                <span className="etiquette-statut rejete" style={{ marginLeft: 8 }}>
                  Désactivée
                </span>
              )}
            </span>
            <div className="groupe-boutons" style={{ marginTop: 0 }}>
              <button
                className="bouton-icone"
                onClick={() => ouvrirEdition(p)}
                aria-label={`Modifier la page de ${p.nom}`}
                title="Modifier"
              >
                <Pencil size={18} />
              </button>
              <button
                className="bouton-icone"
                onClick={() => setAction({ page: p, type: p.actif === false ? 'activer' : 'desactiver' })}
                aria-label={p.actif === false ? `Réactiver la page de ${p.nom}` : `Désactiver la page de ${p.nom}`}
                title={p.actif === false ? 'Réactiver' : 'Désactiver'}
              >
                {p.actif === false ? <Power size={18} /> : <PowerOff size={18} />}
              </button>
              <button
                className="bouton-icone rejeter"
                onClick={() => setAction({ page: p, type: 'supprimer' })}
                aria-label={`Supprimer la page de ${p.nom}`}
                title="Supprimer"
              >
                <Trash2 size={18} />
              </button>
            </div>
          </div>
        ),
      )}

      {creationOuverte && (
        <div className="fenetre-modale-fond" role="presentation" onClick={() => setCreationOuverte(false)}>
          <div
            className="fenetre-modale"
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
          >
            <h3>Ajouter une page</h3>
            <form onSubmit={handleCreerPage}>
              <div className="champ">
                <label>Nom de la personne</label>
                <input
                  value={nouvellePage.nom}
                  onChange={(e) => setNouvellePage({ ...nouvellePage, nom: e.target.value })}
                  dir="auto"
                  autoFocus
                />
              </div>
              <div className="champ">
                <label>Dates (ex. 1945 – 2024)</label>
                <input
                  value={nouvellePage.dates}
                  onChange={(e) => setNouvellePage({ ...nouvellePage, dates: e.target.value })}
                />
              </div>
              <div className="champ">
                <label>Courte présentation (optionnel)</label>
                <textarea
                  value={nouvellePage.bio}
                  onChange={(e) => setNouvellePage({ ...nouvellePage, bio: e.target.value })}
                  dir="auto"
                />
              </div>
              <div className="champ">
                <label>URL de la photo (optionnel)</label>
                <input
                  value={nouvellePage.photoUrl}
                  onChange={(e) => setNouvellePage({ ...nouvellePage, photoUrl: e.target.value })}
                />
                <small>Ou téléversez une image ci-dessous (elle remplacera l'URL) :</small>
                <input type="file" accept="image/*" onChange={(e) => handleFichier(e, setFichierNouvelle)} />
              </div>
              {erreur && <div className="message message-erreur">{erreur}</div>}
              <div className="groupe-boutons">
                <button type="submit" className="bouton" disabled={envoi}>
                  {envoi ? 'Création…' : 'Créer la page'}
                </button>
                <button
                  type="button"
                  className="bouton bouton-discret"
                  onClick={() => {
                    setCreationOuverte(false)
                    setNouvellePage(CHAMPS_VIDES)
                    setFichierNouvelle(null)
                  }}
                >
                  Annuler
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {action && (
        <ConfirmDialog
          titre={
            action.type === 'supprimer'
              ? `Supprimer la page de ${action.page.nom} ?`
              : action.type === 'desactiver'
                ? `Désactiver la page de ${action.page.nom} ?`
                : `Réactiver la page de ${action.page.nom} ?`
          }
          message={
            action.type === 'supprimer'
              ? 'Cette action est irréversible : la page et tous ses témoignages seront définitivement supprimés.'
              : action.type === 'desactiver'
                ? "La page ne sera plus visible ni accessible au public. Vous pourrez la réactiver à tout moment depuis cet écran."
                : 'La page redevient visible et accessible au public.'
          }
          libelleConfirmer={
            action.type === 'supprimer' ? 'Supprimer' : action.type === 'desactiver' ? 'Désactiver' : 'Réactiver'
          }
          danger={action.type === 'supprimer' || action.type === 'desactiver'}
          onConfirmer={confirmerAction}
          onAnnuler={() => setAction(null)}
        />
      )}
    </>
  )
}
