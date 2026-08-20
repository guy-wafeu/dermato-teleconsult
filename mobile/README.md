# Dermato — Mobile

Application patiente (React Native **bare**, sans Expo) pour la téléconsultation
dermatologique. Voir aussi le README à la racine du projet.

## Prérequis

- Node.js 20+
- Android Studio + un émulateur (ou téléphone Android en mode développeur) — pas
  d'équivalent "Expo Go" en bare RN, il faut un vrai build natif pour lancer l'app.
- Pour iOS : un Mac avec Xcode (non testable depuis cet environnement Windows).
- Un projet Firebase avec l'authentification Email/Mot de passe activée (voir
  "Actions Firebase" ci-dessous — bloquant pour tout écran connecté).

## Installation

```bash
cd mobile
npm install
```

## Actions Firebase à faire avant de lancer l'app

L'app importe `@react-native-firebase/app` et `/auth`, qui nécessitent un fichier de
configuration natif généré par la console Firebase — impossible à deviner ou
générer depuis ce projet.

1. Aller sur https://console.firebase.google.com → **Ajouter un projet** (ou
   réutiliser le projet GCP créé pour le backend — Firebase Auth tourne sur le même
   projet GCP, c'est le comportement recommandé).
2. Dans le projet → **Authentication** → onglet **Sign-in method** → activer
   **Email/Mot de passe**.
3. Dans **Paramètres du projet** → onglet **Général** → section "Vos applications" →
   **Ajouter une application** → icône Android.
   - Nom du package Android : `com.dermatomobile` (voir `android/app/build.gradle`,
     champ `applicationId` — à ajuster si vous le changez).
   - Télécharger le fichier **`google-services.json`** généré.
4. Placer ce fichier dans `mobile/android/app/google-services.json` (déjà exclu par
   `.gitignore` — ne jamais le committer, ce n'est pas un secret critique mais il
   identifie votre projet Firebase).
5. Ajouter le plugin Google Services à la config Gradle (pas encore fait dans ce
   passage de code, pour ne pas casser le build tant que le fichier n'existe pas) :
   - `android/build.gradle` → dans `dependencies` du bloc `buildscript` : ajouter
     `classpath 'com.google.gms:google-services:4.4.2'`.
   - `android/app/build.gradle` → tout en bas du fichier : ajouter
     `apply plugin: 'com.google.gms.google-services'`.
6. Pour iOS (sur Mac) : même écran Firebase → **Ajouter une application** → icône
   iOS → Bundle ID (voir `ios/DermatoMobile.xcodeproj`) → télécharger
   **`GoogleService-Info.plist`** → l'ajouter au projet Xcode (glisser-déposer dans
   le dossier `DermatoMobile`, cocher "Copy items if needed").

Sans ces étapes, l'app compile mais plante au démarrage dès que `RootNavigator`
tente de vérifier la session (`getAuth()` natif non initialisé).

## Lancer en local

```bash
npx react-native start          # bundler Metro, dans un terminal dédié
npx react-native run-android    # dans un second terminal, émulateur/téléphone lancé
```

L'app pointe par défaut sur `http://10.0.2.2:8080/api/v1` en debug (voir
`src/config/env.ts`) — `10.0.2.2` est l'alias de l'émulateur Android vers `localhost`
de la machine hôte. Le backend doit donc tourner en local (`npm run dev` dans
`backend/`) pour que l'app fonctionne pendant le développement.

## Tests

```bash
npx tsc --noEmit   # typecheck
npx jest            # smoke test (Firebase et react-native-screens sont mockés,
                     # voir __mocks__/ — aucun appel réseau ou natif réel en test)
```

## Ce qui est implémenté dans ce passage de code

- Onboarding, inscription, connexion (email uniquement — voir note dans
  `LoginScreen.tsx` sur la connexion par téléphone, pas encore implémentée côté
  backend), dashboard patient.
- Questionnaire complet en 9 étapes + photos + consentement + disponibilités +
  récapitulatif + confirmation, avec sauvegarde du brouillon à chaque étape.
- Upload photo réel vers Cloud Storage via URL signée (pas de simulation).
- Dashboard admin minimal (compteur de demandes en attente + déconnexion).

## Limites connues (pas encore faites)

- **Mode hors ligne** : la sauvegarde de brouillon actuelle appelle l'API à chaque
  étape ; si le réseau est indisponible, l'étape affiche une erreur mais rien n'est
  mis en file d'attente localement pour resynchroniser plus tard. La file SQLite
  (`draft` → `pending_sync` → `syncing` → `synced`/`sync_failed`) est le module
  suivant.
- **Reprise d'un brouillon existant** : depuis le dashboard, ouvrir une consultation
  `draft` existante ne réhydrate pas encore le formulaire — seule la création d'une
  nouvelle consultation est câblée.
- **Espace admin** : liste filtrable, détail de dossier avec zoom photo, actions de
  changement de statut — pas encore construits (écran actuel = compteur seul).
- **Connexion par téléphone** : nécessite un endpoint backend de résolution
  téléphone → email, volontairement non simulé.
