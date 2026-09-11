import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  setDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from './firebase'

// ---------- Pages (une page par personne défunte) ----------

export async function listerPages() {
  const snap = await getDocs(query(collection(db, 'pages'), orderBy('nom')))
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
}

export async function lirePage(pageId) {
  const snap = await getDoc(doc(db, 'pages', pageId))
  return snap.exists() ? { id: snap.id, ...snap.data() } : null
}

export async function creerPage({ nom, dates, bio, photoUrl, photoChemin }) {
  const ref = await addDoc(collection(db, 'pages'), {
    nom,
    dates: dates || '',
    bio: bio || '',
    photoUrl: photoUrl || '',
    photoChemin: photoChemin || '',
    actif: true,
    creeLe: serverTimestamp(),
  })
  return ref.id
}

// Si une nouvelle photo remplace une photo précédemment téléversée, l'ancien
// fichier reste dans Cloudinary (suppression non automatisée — voir storage.js).
export async function modifierPage(pageId, { nom, dates, bio, photoUrl, photoChemin }) {
  await updateDoc(doc(db, 'pages', pageId), {
    nom,
    dates: dates || '',
    bio: bio || '',
    photoUrl: photoUrl || '',
    photoChemin: photoChemin || '',
  })
}

export async function basculerActivationPage(pageId, actif) {
  await updateDoc(doc(db, 'pages', pageId), { actif })
}

export async function supprimerPage(pageId) {
  await deleteDoc(doc(db, 'pages', pageId))
}

// ---------- Témoignages ----------

export async function listerTemoignagesApprouves(pageId) {
  const q = query(
    collection(db, 'pages', pageId, 'temoignages'),
    where('statut', '==', 'approuve'),
    orderBy('creeLe', 'desc'),
  )
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
}

export async function listerTemoignagesEnAttente(pageId) {
  const q = query(
    collection(db, 'pages', pageId, 'temoignages'),
    where('statut', '==', 'en_attente'),
    orderBy('creeLe', 'asc'),
  )
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
}

// Pré-génère un identifiant de témoignage, pour pouvoir téléverser un
// éventuel média (photo/audio/vidéo) au bon endroit avant l'écriture du
// document lui-même.
export function nouveauTemoignageId(pageId) {
  return doc(collection(db, 'pages', pageId, 'temoignages')).id
}

export async function deposerTemoignage(
  pageId,
  temoignageId,
  { nomAffiche, email, texte, code, mediaUrl, mediaChemin, mediaType },
) {
  await setDoc(doc(db, 'pages', pageId, 'temoignages', temoignageId), {
    nomAffiche,
    email: email ? email.trim().toLowerCase() : '',
    texte,
    code,
    mediaUrl: mediaUrl || '',
    mediaChemin: mediaChemin || '',
    mediaType: mediaType || '',
    statut: 'en_attente',
    creeLe: serverTimestamp(),
    modifieLe: serverTimestamp(),
  })
}

// Modifie un témoignage déjà publié, à condition de fournir le bon code.
// Le code est soumis à Firestore, qui le compare lui-même côté serveur à la
// valeur enregistrée (voir firestore.rules) — l'application ne le vérifie
// jamais elle-même, et ne le lit jamais en retour.
export async function modifierTemoignageParCode(pageId, temoignageId, { nomAffiche, texte, code }) {
  await updateDoc(doc(db, 'pages', pageId, 'temoignages', temoignageId), {
    nomAffiche,
    texte,
    code,
    statut: 'en_attente', // toute modification repasse en modération
    modifieLe: serverTimestamp(),
  })
}

// "Suppression" par l'auteur : en l'absence de compte, Firestore ne peut pas
// autoriser une vraie suppression (delete) sur la base d'un code — seule une
// écriture (update) peut être vérifiée ainsi. Le témoignage est donc masqué
// (statut "supprime"), puis un admin le supprime définitivement.
export async function demanderSuppressionParCode(pageId, temoignageId, code) {
  await updateDoc(doc(db, 'pages', pageId, 'temoignages', temoignageId), {
    code,
    statut: 'supprime',
    modifieLe: serverTimestamp(),
  })
}

export async function approuverTemoignage(pageId, temoignageId) {
  await updateDoc(doc(db, 'pages', pageId, 'temoignages', temoignageId), {
    statut: 'approuve',
    motifRejet: '',
  })
}

export async function rejeterTemoignage(pageId, temoignageId, motif) {
  await updateDoc(doc(db, 'pages', pageId, 'temoignages', temoignageId), {
    statut: 'rejete',
    motifRejet: motif || '',
  })
}

export async function supprimerTemoignage(pageId, temoignageId) {
  await deleteDoc(doc(db, 'pages', pageId, 'temoignages', temoignageId))
}

// Témoignages "supprimés" par leur auteur (via le code) mais pas encore
// définitivement effacés — un admin les traite (suppression réelle) depuis
// la file de modération.
export async function listerTemoignagesSupprimesParAuteur(pageId) {
  const q = query(
    collection(db, 'pages', pageId, 'temoignages'),
    where('statut', '==', 'supprime'),
  )
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
}

// ---------- Signalements ----------

export async function signalerTemoignage(pageId, temoignageId, motif) {
  await addDoc(collection(db, 'signalements'), {
    pageId,
    temoignageId,
    motif: motif || '',
    creeLe: serverTimestamp(),
    traite: false,
  })
}

// Signalements non traités pour une page donnée. "signalements" est une
// collection de premier niveau (pas imbriquée) : ça en fait une requête
// normale plutôt qu'une requête "collection group", ce qui simplifie
// beaucoup la validation par les règles de sécurité.
export async function listerSignalementsPage(pageId) {
  const q = query(
    collection(db, 'signalements'),
    where('pageId', '==', pageId),
    where('traite', '==', false),
  )
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
}

export async function marquerSignalementTraite(signalementId) {
  await updateDoc(doc(db, 'signalements', signalementId), { traite: true })
}

// ---------- Admins ----------
// Un document par email (l'email normalisé sert d'identifiant de document).

export async function lireAdmin(email) {
  const snap = await getDoc(doc(db, 'admins', email.trim().toLowerCase()))
  return snap.exists() ? { id: snap.id, ...snap.data() } : null
}

export async function listerAdmins() {
  const snap = await getDocs(collection(db, 'admins'))
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
}

export async function autoriserAdmin(email, { pageIds, superAdmin }) {
  const id = email.trim().toLowerCase()
  await setDoc(
    doc(db, 'admins', id),
    {
      email: id,
      pageIds: pageIds || [],
      superAdmin: !!superAdmin,
    },
    { merge: true },
  )
}

export async function revoquerAdmin(email) {
  await deleteDoc(doc(db, 'admins', email.trim().toLowerCase()))
}
