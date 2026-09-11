// Hébergement des fichiers (photos, audio, vidéo) via Cloudinary, en upload
// direct depuis le navigateur — pas de backend nécessaire, offre gratuite
// (10 Go de stockage, 20 Go de bande passante/mois). Remplace Firebase
// Storage, qui exige désormais le plan payant Blaze même à faible volume.

const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET

export const LIMITES_TAILLE = {
  image: 5 * 1024 * 1024,
  audio: 15 * 1024 * 1024,
  video: 30 * 1024 * 1024,
}

export function typeMedia(fichier) {
  if (fichier.type.startsWith('image/')) return 'image'
  if (fichier.type.startsWith('audio/')) return 'audio'
  if (fichier.type.startsWith('video/')) return 'video'
  return null
}

export function validerFichierMedia(fichier) {
  const type = typeMedia(fichier)
  if (!type) return 'Formats acceptés : image, audio ou vidéo uniquement.'
  const limite = LIMITES_TAILLE[type]
  if (fichier.size > limite) {
    return `Fichier trop volumineux (max ${Math.round(limite / 1024 / 1024)} Mo pour ${type === 'image' ? 'une image' : type === 'audio' ? 'un audio' : 'une vidéo'}).`
  }
  return null
}

// Envoie le fichier à Cloudinary et retourne son URL publique. Le "chemin"
// n'a ici qu'une valeur indicative (dossier de rangement côté Cloudinary),
// contrairement à Firebase Storage : Cloudinary ne permet pas de suppression
// depuis le navigateur sans passer par une requête signée (donc un
// backend) — les fichiers restent dans le compte Cloudinary même après
// suppression du témoignage ou de la page en base. Sans impact réel au
// volume attendu ici (largement sous le palier gratuit), mais à savoir.
export async function uploaderFichier(chemin, fichier) {
  if (!CLOUD_NAME || !UPLOAD_PRESET) {
    throw new Error('Cloudinary non configuré (VITE_CLOUDINARY_CLOUD_NAME / VITE_CLOUDINARY_UPLOAD_PRESET).')
  }
  const donnees = new FormData()
  donnees.append('file', fichier)
  donnees.append('upload_preset', UPLOAD_PRESET)
  donnees.append('folder', chemin)

  const reponse = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/auto/upload`, {
    method: 'POST',
    body: donnees,
  })
  if (!reponse.ok) {
    const detail = await reponse.text()
    throw new Error(`Échec de l'envoi vers Cloudinary : ${detail}`)
  }
  const resultat = await reponse.json()
  return { url: resultat.secure_url, chemin: resultat.public_id }
}
