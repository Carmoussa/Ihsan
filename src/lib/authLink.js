import {
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  signInWithEmailLink,
} from 'firebase/auth'
import { auth } from './firebase'

const PENDING_EMAIL_KEY = 'livreDor.pendingEmail'
const REDIRECT_AFTER_KEY = 'livreDor.redirectAfter'

// Envoie le lien magique à l'adresse email fournie.
// `redirectPath` est la page où renvoyer la personne une fois connectée
// (ex: "/personne/xxx" pour revenir modifier son témoignage, ou "/admin" pour un admin).
export async function envoyerLienMagique(email, redirectPath) {
  const normalisedEmail = email.trim().toLowerCase()

  const actionCodeSettings = {
    url: `${window.location.origin}${import.meta.env.BASE_URL}connexion`,
    handleCodeInApp: true,
  }

  await sendSignInLinkToEmail(auth, normalisedEmail, actionCodeSettings)
  window.localStorage.setItem(PENDING_EMAIL_KEY, normalisedEmail)
  window.localStorage.setItem(REDIRECT_AFTER_KEY, redirectPath || '/')
}

export function lienEstUnLienDeConnexion() {
  return isSignInWithEmailLink(auth, window.location.href)
}

// Termine la connexion à partir du lien cliqué dans l'email.
// Si l'email n'est pas retrouvé en local (lien ouvert sur un autre appareil),
// `emailDeSecours` (saisi manuellement par la personne) est utilisé.
export async function terminerConnexion(emailDeSecours) {
  let email = window.localStorage.getItem(PENDING_EMAIL_KEY)
  if (!email) {
    email = emailDeSecours?.trim().toLowerCase()
  }
  if (!email) {
    throw new Error('EMAIL_MANQUANT')
  }

  const result = await signInWithEmailLink(auth, email, window.location.href)
  window.localStorage.removeItem(PENDING_EMAIL_KEY)
  const redirectPath = window.localStorage.getItem(REDIRECT_AFTER_KEY) || '/'
  window.localStorage.removeItem(REDIRECT_AFTER_KEY)
  return { user: result.user, redirectPath }
}
