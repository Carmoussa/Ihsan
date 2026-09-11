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
   - Onglet **Sign-in method** → active **Google** — c'est ce que les administrateurs utilisent pour se connecter à `/admin` (un simple clic, pas d'email envoyé, donc aucun quota à surveiller). Les visiteurs, eux, n'ont besoin d'aucune connexion : ils choisissent un code au dépôt de leur témoignage, qui leur sert ensuite à le modifier ou le retirer.
4. Fais la même chose pour **Firestore Database** (cherche-le aussi via la loupe si besoin) → **Créer une base de données**.
   - Choisis une région proche (ex. `eur3 (Europe)`).
   - Démarre en **mode production** (les règles de sécurité fournies dans ce dépôt s'en chargent).
5. **Compilation → Storage** n'est plus nécessaire — voir plus bas la section
   "Photos, audio, vidéo (Cloudinary)" pour l'hébergement des fichiers.

## 2. Autoriser ton domaine GitHub Pages

Toujours dans **Authentication → Settings → Domaines autorisés**, ajoute :
- `tonpseudo.github.io` (remplace par ton identifiant GitHub)

Sans ça, la connexion Google échouera une fois le site en ligne.

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

### Notifications par email (optionnel)

Si un visiteur fournit son email au dépôt, il peut être averti automatiquement
quand son témoignage est publié ou refusé — via [EmailJS](https://www.emailjs.com),
gratuit jusqu'à ~200 emails/mois, sans backend.

1. Crée un compte sur [emailjs.com](https://www.emailjs.com).
2. **Email Services → Add New Service** → connecte la boîte `ihsan.webmaster@outlook.com`
   (ou celle de ton choix) — c'est cette adresse qui apparaîtra comme expéditeur.
   Note le **Service ID** généré.
3. **Email Templates → Create New Template** — un seul suffit (l'offre gratuite
   EmailJS est limitée à 2 modèles ; l'application compose entièrement le
   texte de chaque email, le modèle ne fait qu'afficher deux variables) :
   - Champ **Subject** : `{{objet}}`
   - Corps du message : `{{{corpsDuMail}}}` (avec triple accolades — important,
     sinon les balises `<br>` de mise en forme s'afficheraient telles quelles
     au lieu de créer des retours à la ligne)
   - Champ **To Email** : `{{email}}`

   Note l'**ID de ce template**.
4. **Account → General** : note ta **Public Key**.
5. Ajoute ces 3 valeurs à `.env.local` :

```
VITE_EMAILJS_PUBLIC_KEY=...
VITE_EMAILJS_SERVICE_ID=...
VITE_EMAILJS_TEMPLATE=...
```

Si ces variables restent vides, l'envoi est simplement ignoré — tout le reste
du site continue de fonctionner normalement.

Le texte de chaque email (objet + corps) ne se modifie plus dans le code,
mais directement depuis l'onglet **Email** de l'espace admin (visible des
super-admins) — trois sections (accusé de dépôt, approbation, refus), chacune
avec un bouton **Modifier** (objet + corps, avec des variables du type
`{{nomAffiche}}` à placer où tu veux dans le texte) et un bouton **Tester**
(envoie vers l'adresse de ton choix, avec des données factices). Le même
onglet affiche le nombre d'envois sur les 30 derniers jours, pour surveiller
le quota (~200/mois sur l'offre gratuite).

### Photos, audio, vidéo (optionnel)

Les fichiers joints (photo de page, ou média joint à un témoignage) sont
hébergés sur [Cloudinary](https://cloudinary.com), gratuit jusqu'à 10 Go de
stockage et 20 Go de bande passante par mois — suffisant ici. Contrairement à
Firebase Storage, aucune carte bancaire n'est nécessaire.

1. Crée un compte gratuit sur [cloudinary.com](https://cloudinary.com).
2. Note ton **Cloud name**, affiché en haut du tableau de bord.
3. **Settings → Upload → Upload presets → Add upload preset** :
   - Mode : **Unsigned** (indispensable — permet l'envoi direct depuis le
     navigateur du visiteur, sans exposer de clé secrète)
   - Note le **nom du preset**
4. Ajoute ces 2 valeurs à `.env.local` :

```
VITE_CLOUDINARY_CLOUD_NAME=...
VITE_CLOUDINARY_UPLOAD_PRESET=...
```

Si ces variables restent vides, le champ d'upload de fichier échoue
silencieusement (erreur affichée à l'utilisateur, rien ne casse ailleurs sur
le site). À savoir : Cloudinary ne permet pas la suppression d'un fichier
depuis le navigateur sans passer par une requête signée (donc un serveur,
qu'on n'a pas) — un fichier reste donc dans ton compte Cloudinary même après
suppression du témoignage ou de la page correspondante en base. Sans
conséquence pratique au volume attendu ici (tu resteras très loin du palier
gratuit), mais à savoir si tu vérifies un jour ton espace de stockage
Cloudinary et que ça ne correspond pas exactement à ce qui est encore
affiché sur le site.

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
   Ajoute un secret pour chacune des valeurs de `.env.local` (les 6 Firebase, les 3
   EmailJS et les 2 Cloudinary si tu utilises ces fonctionnalités)
   (mêmes noms : `VITE_FIREBASE_API_KEY`, etc.).
2. **Settings → Pages → Source : GitHub Actions**.
3. Pousse un commit (ou relance le workflow depuis l'onglet **Actions**) : le
   site se construit et se publie automatiquement à chaque envoi sur `main`.

Ton site sera accessible sur `https://tonpseudo.github.io/ihsan/`.

## Modèle de données (pour référence)

```
pages/{pageId}
  nom, dates, bio, photoUrl, photoChemin (identifiant Cloudinary), actif (bool), creeLe

pages/{pageId}/temoignages/{temoignageId}
  nomAffiche, email (optionnel), texte, code,
  statut ("en_attente" | "approuve" | "rejete" | "supprime"),
  motifRejet, mediaUrl, mediaChemin (identifiant Cloudinary), mediaType ("image"|"audio"|"video"),
  creeLe, modifieLe

signalements/{signalementId}
  pageId, temoignageId, motif, traite (bool), creeLe

admins/{emailEnMinuscules}
  email, superAdmin (bool), pageIds (array)

modelesEmail/{type}
  type = "accuse" | "approbation" | "rejet"
  objet, corps (texte libre, avec variables {{nomAffiche}}, {{nomPage}}, etc.)

emailsEnvoyes/{id}
  type, reussi (bool), creeLe
```

Le champ `code` est choisi par le visiteur au dépôt : il sert uniquement à
prouver, plus tard, qu'il est bien l'auteur (pour modifier ou retirer son
témoignage) — sans compte ni email vérifié. Une fois un témoignage publié,
son statut ne peut plus repasser à "en_attente" ou "rejete" que par une
modification de l'auteur (avec le bon code) ou une action admin ; "supprime"
signifie que l'auteur a demandé son retrait — il est masqué du site public
et attend une suppression définitive par un admin (onglet Modération).

## Ce qui n'est pas encore fait (pistes pour la suite)

- Un témoignage encore en attente ou refusé reste invisible à son auteur, même avec un email fourni (voir plus haut) — c'est une limite assumée du système par code, pas un oubli. L'email ne sert qu'à la notification ponctuelle (publié/refusé), pas à consulter le statut à tout moment.
- Quota Firebase (5 e-mails/jour sur le plan gratuit) : n'a plus d'impact, ni côté admin (connexion Google) ni côté visiteurs (les notifications passent par EmailJS, pas par Firebase).
- Les fichiers Cloudinary ne sont jamais supprimés automatiquement (voir plus haut, section Cloudinary) — sans conséquence pratique au volume attendu, mais à surveiller si le site grandit beaucoup.
- Un design final peut encore être ajusté — celui-ci est un premier essai à affiner selon ton ressenti.
