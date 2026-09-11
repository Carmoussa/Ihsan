import { useState } from 'react'
import { deposerTemoignage, nouveauTemoignageId } from '../lib/data'
import { uploaderFichier, validerFichierMedia, typeMedia } from '../lib/storage'
import { notifierDepot } from '../lib/email'

export default function FormulaireTemoignage({ pageId, nomPage, onDepose }) {
  const [nomAffiche, setNomAffiche] = useState('')
  const [email, setEmail] = useState('')
  const [texte, setTexte] = useState('')
  const [code, setCode] = useState('')
  const [fichier, setFichier] = useState(null)
  const [envoi, setEnvoi] = useState(false)
  const [erreur, setErreur] = useState('')
  const [succes, setSucces] = useState(false)
  const [codeConfirme, setCodeConfirme] = useState('')

  function handleFichier(e) {
    const f = e.target.files?.[0]
    if (!f) {
      setFichier(null)
      return
    }
    const messageErreur = validerFichierMedia(f)
    if (messageErreur) {
      setErreur(messageErreur)
      e.target.value = ''
      setFichier(null)
      return
    }
    setErreur('')
    setFichier(f)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setErreur('')
    if (!nomAffiche.trim() || !texte.trim()) {
      setErreur('Merci de remplir votre nom et votre témoignage.')
      return
    }
    if (code.trim().length < 4) {
      setErreur('Choisissez un code d\'au moins 4 caractères.')
      return
    }
    setEnvoi(true)
    try {
      const temoignageId = nouveauTemoignageId(pageId)
      let mediaUrl = ''
      let mediaChemin = ''
      let mediaType = ''

      if (fichier) {
        mediaType = typeMedia(fichier)
        mediaChemin = `pages/${pageId}/temoignages/${temoignageId}/media-${fichier.name}`
        const resultat = await uploaderFichier(mediaChemin, fichier)
        mediaUrl = resultat.url
      }

      await deposerTemoignage(pageId, temoignageId, {
        nomAffiche: nomAffiche.trim(),
        email,
        texte: texte.trim(),
        code: code.trim(),
        mediaUrl,
        mediaChemin,
        mediaType,
      })
      if (email.trim()) {
        notifierDepot(email.trim(), { nomAffiche: nomAffiche.trim(), nomPage })
      }
      setCodeConfirme(code.trim())
      setSucces(true)
      setNomAffiche('')
      setEmail('')
      setTexte('')
      setCode('')
      setFichier(null)
      onDepose?.()
    } catch (err) {
      console.error(err)
      setErreur("Le dépôt n'a pas abouti. Merci de réessayer.")
    } finally {
      setEnvoi(false)
    }
  }

  if (succes) {
    return (
      <div className="message message-succes">
        Merci, votre témoignage a bien été reçu. Il sera visible sur cette page dès
        qu'un administrateur l'aura validé.
        <br />
        <br />
        <strong>Notez bien votre code : {codeConfirme}</strong>
        <br />
        Il vous permettra de modifier ou retirer votre témoignage plus tard, une fois
        publié. Il ne peut pas être récupéré si vous l'oubliez.
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="champ">
        <label htmlFor="nomAffiche">Votre nom (affiché publiquement)</label>
        <input
          id="nomAffiche"
          type="text"
          value={nomAffiche}
          onChange={(e) => setNomAffiche(e.target.value)}
          maxLength={80}
          dir="auto"
        />
      </div>
      <div className="champ">
        <label htmlFor="email">Votre email (optionnel, non affiché)</label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      <div className="champ">
        <label htmlFor="texte">Votre témoignage</label>
        <textarea
          id="texte"
          value={texte}
          onChange={(e) => setTexte(e.target.value)}
          maxLength={2000}
          dir="auto"
        />
        <small>{texte.length}/2000 caractères</small>
      </div>
      <div className="champ">
        <label htmlFor="media">Photo, audio ou vidéo (optionnel)</label>
        <input
          id="media"
          type="file"
          accept="image/*,audio/*,video/*"
          onChange={handleFichier}
        />
        <small>Max 5 Mo (photo), 15 Mo (audio), 30 Mo (vidéo).</small>
      </div>
      <div className="champ">
        <label htmlFor="code">Choisissez un code (min. 4 caractères)</label>
        <input
          id="code"
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          maxLength={50}
        />
        <small>
          Il vous servira à modifier ou retirer ce témoignage plus tard. Notez-le
          précieusement : impossible à récupérer s'il est oublié.
        </small>
      </div>
      {erreur && <div className="message message-erreur">{erreur}</div>}
      <button type="submit" className="bouton" disabled={envoi}>
        {envoi ? 'Envoi…' : 'Déposer mon témoignage'}
      </button>
    </form>
  )
}
