# Dermato — Backend

API REST (Node.js + TypeScript + Express + Prisma) pour l'application de téléconsultation
dermatologique. Voir aussi le README à la racine du projet pour la vue d'ensemble
mobile + backend + GCP.

## Prérequis

- Node.js 20+
- Une base PostgreSQL accessible (locale, ou Cloud SQL via proxy — voir plus bas)
- Un projet Firebase (pour Firebase Authentication)
- Un projet Google Cloud avec un bucket Cloud Storage privé

## Installation

```bash
cd backend
npm install
cp .env.example .env   # puis remplir les valeurs (voir commentaires dans le fichier)
```

## Base de données

```bash
npm run prisma:migrate   # crée/applique les migrations en local (crée la 1ère si absente)
npm run prisma:seed      # charge les référentiels (types de lésion, disponibilités)
```

`npm run prisma:migrate` génère la migration SQL à partir de `prisma/schema.prisma`.
**Avant de committer une nouvelle migration**, relis le fichier SQL généré dans
`prisma/migrations/` — trois contraintes ne sont pas exprimables dans le schéma Prisma
et doivent être ajoutées à la main (documenté dans la note d'architecture Phase 2) :
deux index uniques partiels sur `patients` (email, téléphone, `WHERE deleted_at IS NULL`)
et une contrainte `CHECK` sur `status_history`.

## Lancer en local

```bash
npm run dev          # serveur avec rechargement à chaud sur http://localhost:8080
```

Vérifier que l'API répond :

```bash
curl http://localhost:8080/api/v1/health/live
```

## Tests

```bash
cp .env.test.example .env.test   # une fois, puis remplir DATABASE_URL (voir commentaires dans le fichier)
createdb -h 127.0.0.1 -U <role_dev> -O <role_dev> dermato_test   # si la base de test n'existe pas encore
DATABASE_URL=<url de .env.test> npx prisma migrate deploy
DATABASE_URL=<url de .env.test> npx tsx prisma/seed.ts

npm test
```

Les tests couvrent le démarrage de l'app, la machine à états des statuts de
consultation, et des tests d'intégration bout en bout (`test/patientJourney.test.ts`,
`test/adminJourney.test.ts`) qui repassent par les vraies routes HTTP sur une base
Postgres de test réelle (jamais la base de dev) : inscription → brouillon → photos →
consentement → soumission côté patient, et liste → détail → transitions de statut
côté admin. Firebase Auth et Google Cloud Storage sont mockés (`test/mocks.ts`) — tout
le reste (validation Zod, transactions Prisma, contraintes SQL, RBAC) est le vrai code
de production.

## Build & production

```bash
npm run build
npm start
```

## Déploiement (Cloud Run, sans Dockerfile)

```bash
gcloud run deploy dermato-api \
  --source . \
  --region europe-west1 \
  --no-allow-unauthenticated=false \
  --set-env-vars NODE_ENV=production \
  --vpc-connector <nom-du-connecteur-VPC> \
  --set-secrets DATABASE_URL=dermato-database-url:latest,GCS_PHOTOS_BUCKET=dermato-photos-bucket:latest
```

Cloud Build construit l'image via buildpacks à partir de `package.json` — aucun
Dockerfile n'est nécessaire. Détails complets (création du connecteur VPC, des
secrets, du compte de service) à venir en Phase 12 (déploiement).

## Structure

```
src/
  config/        variables d'environnement validées (fail-fast au démarrage)
  db/            client Prisma partagé
  lib/           erreurs applicatives, logger, init Firebase Admin
  middleware/    auth, RBAC, validation Zod, rate limiting, gestion d'erreurs
  modules/       un dossier par domaine métier (routes + service + schémas Zod)
  services/      intégrations externes (Cloud Storage)
prisma/
  schema.prisma  modèle de données
  seed.ts        référentiels (types de lésion, disponibilités)
test/
```
