import emailjs from '@emailjs/browser'
import {
  collection,
  doc,
  addDoc,
  getDoc,
  setDoc,
  getDocs,
  query,
  where,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore'
import { db } from './firebase'

const PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY
const SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID
const TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE

const configure = () => PUBLIC_KEY && SERVICE_ID && TEMPLATE_ID

// Contenu de secours, utilisé tant qu'un modèle n'a pas encore été
// enregistré dans Firestore pour ce type d'email (voir onglet Email, admin).
const MODELES_PAR_DEFAUT = {
  accuse: {
    objet: 'Votre témoignage a bien été reçu — {{nomPage}}',
    corps:
      'Bonjour {{nomAffiche}},<br><br>' +
      "Votre témoignage pour « {{nomPage}} » a bien été reçu. Il sera visible sur le site dès qu'un administrateur l'aura validé.<br><br>" +
      'Merci pour votre contribution.<br><br>— Ihsan',
  },
  approbation: {
    objet: 'Votre témoignage a été publié — {{nomPage}}',
    corps:
      'Bonjour {{nomAffiche}},<br><br>' +
      'Votre témoignage pour « {{nomPage}} » a été publié et est maintenant visible sur le site : ' +
      '<a href="{{urlPage}}">{{urlPage}}</a><br><br>' +
      'Merci pour votre contribution.<br><br>— Ihsan',
  },
  rejet: {
    objet: "Votre témoignage n'a pas été retenu — {{nomPage}}",
    corps:
      'Bonjour {{nomAffiche}},<br><br>' +
      "Votre témoignage pour « {{nomPage}} » n'a pas été retenu.{{ligneMotif}}<br><br>— Ihsan",
  },
}

export const TYPES_EMAIL = [
  { id: 'accuse', label: 'Accusé de dépôt', variables: ['nomAffiche', 'nomPage'] },
  { id: 'approbation', label: 'Approbation', variables: ['nomAffiche', 'nomPage', 'urlPage'] },
  { id: 'rejet', label: 'Refus', variables: ['nomAffiche', 'nomPage', 'ligneMotif (auto)'] },
]

function substituer(texte, variables) {
  return Object.entries(variables).reduce(
    (acc, [cle, valeur]) => acc.replaceAll(`{{${cle}}}`, valeur ?? ''),
    texte || '',
  )
}

export async function lireModeleEmail(type) {
  try {
    const snap = await getDoc(doc(db, 'modelesEmail', type))
    if (snap.exists()) return snap.data()
  } catch (err) {
    console.error(err)
  }
  return MODELES_PAR_DEFAUT[type]
}

export async function enregistrerModeleEmail(type, { objet, corps }) {
  await setDoc(doc(db, 'modelesEmail', type), { objet, corps })
}

// Journalise chaque tentative d'envoi (réussie ou non — l'appel à l'API
// EmailJS compte de toute façon dans le quota). Best-effort.
async function enregistrerEnvoi(type, reussi) {
  try {
    await addDoc(collection(db, 'emailsEnvoyes'), {
      type,
      reussi: !!reussi,
      creeLe: serverTimestamp(),
    })
  } catch (err) {
    console.error("Échec de la journalisation de l'envoi (ignoré) :", err)
  }
}

// Un seul modèle EmailJS (offre gratuite limitée à 2), qui se contente
// d'afficher {{objet}} en sujet et {{{corpsDuMail}}} en corps — le texte
// réel (venant de Firestore) est composé et substitué ici.
async function envoyerType(type, email, variables) {
  if (!email || !configure()) return
  const modele = await lireModeleEmail(type)
  const objet = substituer(modele.objet, variables)
  const corpsDuMail = substituer(modele.corps, variables)
  try {
    await emailjs.send(SERVICE_ID, TEMPLATE_ID, { email, objet, corpsDuMail }, { publicKey: PUBLIC_KEY })
    await enregistrerEnvoi(type, true)
  } catch (err) {
    console.error("Échec de l'envoi de la notification (ignoré) :", err)
    await enregistrerEnvoi(type, false)
  }
}

export function notifierDepot(email, { nomAffiche, nomPage }) {
  return envoyerType('accuse', email, { nomAffiche, nomPage })
}

export function notifierApprobation(email, { nomAffiche, nomPage, urlPage }) {
  return envoyerType('approbation', email, { nomAffiche, nomPage, urlPage })
}

export function notifierRejet(email, { nomAffiche, nomPage, motif }) {
  return envoyerType('rejet', email, {
    nomAffiche,
    nomPage,
    ligneMotif: motif ? `<br><br>Motif : ${motif}` : '',
  })
}

// Envoi de test : utilise le modèle actuellement enregistré, avec des
// données factices.
export function envoyerTest(type, email) {
  return envoyerType(type, email, {
    nomAffiche: 'Prénom Nom (test)',
    nomPage: 'Page de test',
    urlPage: `${window.location.origin}${import.meta.env.BASE_URL}temoignages`,
    ligneMotif: '<br><br>Motif : Motif de test — exemple de contenu inapproprié.',
  })
}

// Nombre d'envois (tentés) sur les 30 derniers jours glissants, pour
// surveiller le quota EmailJS (~200/mois sur l'offre gratuite).
export async function compterEnvoisRecents() {
  const il30Jours = new Date()
  il30Jours.setDate(il30Jours.getDate() - 30)
  const q = query(
    collection(db, 'emailsEnvoyes'),
    where('creeLe', '>=', Timestamp.fromDate(il30Jours)),
  )
  const snap = await getDocs(q)
  return snap.size
}
