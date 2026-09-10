# Ihsan — livre d'or

Site de recueil de témoignages pour deux pages personnalisées, avec modération,
administrateurs restreints par page, et modification des témoignages par lien
magique (email, sans mot de passe).

Stack : React + Vite, hébergé sur **GitHub Pages**, backend **Firebase**
(Firestore + Authentication par lien email).

## 1. Créer le projet Firebase

1. Va sur [console.firebase.google.com](https://console.firebase.google.com) → **Ajouter un projet**.
2. Une fois le projet créé, tu arrives sur son tableau de bord. Clique sur l'icône **Web (`</>`)** pour enregistrer une application.
   - Donne-lui un nom (ex. "Livre d'or"), pas besoin de Firebase Hosting.
   - Copie les valeurs affichées (`apiKey`, `authDomain`, etc.) — tu en auras besoin à l'étape 3.
3. Dans le menu de gauche de la console, trouve **Authentication** (l'intitulé exact du regroupement — "Build", "Compilation", ou directement la liste des produits — dépend de la version de la console). Si tu ne le vois pas, utilise la **loupe de recherche** en haut de la console Firebase et tape "Authentication" pour y accéder directement.
   - Clique sur **Commencer** (ou **Get started**) si c'est la première fois.
   - Onglet **Sign-in method** → active **Email/Password** → un sous-réglage apparaît, active **"Lien e-mail (connexion sans mot de passe)"** (en anglais : "Email link (passwordless sign-in)"). Utilisé par les visiteurs pour modifier leur témoignage.
   - Toujours dans **Sign-in method**, active aussi **Google** — c'est ce que les administrateurs utilisent pour se connecter à `/admin` (un simple clic, pas d'email envoyé, donc aucun quota à surveiller de ce côté).
4. Fais la même chose pour **Firestore Database** (cherche-le aussi via la loupe si besoin) → **Créer une base de données**.
   - Choisis une région proche (ex. `eur3 (Europe)`).
   - Démarre en **mode production** (les règles de sécurité fournies dans ce dépôt s'en chargent).

## 2. Autoriser ton domaine GitHub Pages

Toujours dans **Authentication → Settings → Domaines autorisés**, ajoute :
- `tonpseudo.github.io` (remplace par ton identifiant GitHub)

Sans ça, l'envoi et la validation des liens magiques échoueront une fois le
site en ligne.

## 3. Configurer le projet en local

```bash
npm install
cp .env.example .env.local
```

Remplis `.env.local` avec les valeurs copiées à l'étape 1 :

```
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

Ne lance pas encore `npm run dev` — tant que les règles Firestore (étape
suivante) ne sont pas déployées, Firestore refuse toute lecture par défaut et
la page d'accueil affichera une erreur. C'est normal à ce stade.

## 4. Déployer les règles de sécurité et les index Firestore

Ces fichiers (`firestore.rules`, `firestore.indexes.json`) définissent qui a
le droit de lire/écrire quoi — c'est la pièce la plus importante de la
sécurité du site. Installe l'outil Firebase si ce n'est pas déjà fait, puis :

```bash
npm install -g firebase-tools
firebase login
firebase use --add        # sélectionne ton projet Firebase
firebase deploy --only firestore:rules,firestore:indexes
```

Tu peux maintenant lancer le site en local pour vérifier que la page
d'accueil se charge (elle sera vide, c'est normal — aucune page n'existe
encore) :

```bash
npm run dev
```

## 5. Créer le tout premier super-administrateur

C'est la seule étape manuelle (il n'existe encore aucun admin pour en créer un
autre). Dans la console Firebase :

1. **Firestore Database → Données → Démarrer une collection**.
2. Nom de la collection : `admins`
3. ID du document : **ton adresse email, en minuscules** (ex. `malika@exemple.ch`)
4. Ajoute les champs :
   - `email` (string) → ton adresse email
   - `superAdmin` (boolean) → `true`
   - `pageIds` (array) → laisse vide

Une fois connectée sur `/admin` avec cette adresse, tu pourras créer les deux
pages et autoriser d'autres administrateurs directement depuis l'interface —
plus besoin de retoucher la console à la main ensuite.

## 6. Publier le code sur GitHub

```bash
git init
git add .
git commit -m "Premier envoi"
git branch -M main
git remote add origin https://github.com/TONPSEUDO/ihsan.git
git push -u origin main
```

Si le nom de ton dépôt n'est pas `ihsan`, adapte la ligne `base:` dans
`vite.config.js` en conséquence (ex. `base: '/nom-du-depot/'`).

## 7. Ajouter les secrets GitHub et activer Pages

1. Sur GitHub : **Settings → Secrets and variables → Actions → New repository secret**.
   Ajoute un secret pour chacune des 6 valeurs de `.env.local`
   (mêmes noms : `VITE_FIREBASE_API_KEY`, etc.).
2. **Settings → Pages → Source : GitHub Actions**.
3. Pousse un commit (ou relance le workflow depuis l'onglet **Actions**) : le
   site se construit et se publie automatiquement à chaque envoi sur `main`.

Ton site sera accessible sur `https://tonpseudo.github.io/ihsan/`.

## Modèle de données (pour référence)

```
pages/{pageId}
  nom, dates, bio, photoUrl, creeLe

pages/{pageId}/temoignages/{temoignageId}
  nomAffiche, email, texte, statut ("en_attente" | "approuve"), creeLe, modifieLe

pages/{pageId}/temoignages/{temoignageId}/signalements/{signalementId}
  pageId, temoignageId, motif, traite (bool), creeLe

admins/{emailEnMinuscules}
  email, superAdmin (bool), pageIds (array)
```

## Ce qui n'est pas encore fait (pistes pour la suite)

- Upload direct de photo (pour l'instant, il faut fournir une URL d'image déjà hébergée quelque part — ex. déposée sur un service d'images, ou via Firebase Storage à ajouter plus tard).
- Notification par email aux administrateurs quand un nouveau témoignage arrive (actuellement, il faut consulter `/admin` pour le voir).
- Un design final peut encore être ajusté — celui-ci est un premier essai à affiner selon ton ressenti.
