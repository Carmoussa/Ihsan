import {
  collection,
  collectionGroup,
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

export async function creerPage({ nom, dates, bio, photoUrl }) {
  const ref = await addDoc(collection(db, 'pages'), {
    nom,
    dates: dates || '',
    bio: bio || '',
    photoUrl: photoUrl || '',
    creeLe: serverTimestamp(),
  })
  return ref.id
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

export async function deposerTemoignage(pageId, { nomAffiche, email, texte }) {
  await addDoc(collection(db, 'pages', pageId, 'temoignages'), {
    nomAffiche,
    email: email.trim().toLowerCase(),
    texte,
    statut: 'en_attente',
    creeLe: serverTimestamp(),
    modifieLe: serverTimestamp(),
  })
}

export async function modifierTemoignage(pageId, temoignageId, { nomAffiche, texte }) {
  await updateDoc(doc(db, 'pages', pageId, 'temoignages', temoignageId), {
    nomAffiche,
    texte,
    statut: 'en_attente', // toute modification repasse en modération
    modifieLe: serverTimestamp(),
  })
}

export async function changerStatutTemoignage(pageId, temoignageId, statut) {
  await updateDoc(doc(db, 'pages', pageId, 'temoignages', temoignageId), {
    statut,
  })
}

export async function supprimerTemoignage(pageId, temoignageId) {
  await deleteDoc(doc(db, 'pages', pageId, 'temoignages', temoignageId))
}

// Retrouve tous les témoignages (toutes pages confondues) déposés avec un email donné.
// Nécessite un index Firestore "collection group" sur temoignages.email (voir firestore.indexes.json).
export async function listerMesTemoignages(email) {
  const q = query(
    collectionGroup(db, 'temoignages'),
    where('email', '==', email.trim().toLowerCase()),
    orderBy('creeLe', 'desc'),
  )
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({
    id: d.id,
    pageId: d.ref.parent.parent.id,
    ...d.data(),
  }))
}

// ---------- Signalements ----------

export async function signalerTemoignage(pageId, temoignageId, motif) {
  await addDoc(
    collection(db, 'pages', pageId, 'temoignages', temoignageId, 'signalements'),
    {
      pageId,
      temoignageId,
      motif: motif || '',
      creeLe: serverTimestamp(),
      traite: false,
    },
  )
}

// Signalements non traités pour une page donnée (dénormalise pageId pour permettre
// cette requête "collection group" filtrée, cf. firestore.rules).
export async function listerSignalementsPage(pageId) {
  const q = query(
    collectionGroup(db, 'signalements'),
    where('pageId', '==', pageId),
    where('traite', '==', false),
  )
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
}

export async function marquerSignalementTraite(pageId, temoignageId, signalementId) {
  await updateDoc(
    doc(db, 'pages', pageId, 'temoignages', temoignageId, 'signalements', signalementId),
    { traite: true },
  )
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
