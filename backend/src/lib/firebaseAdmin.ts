import { getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { env } from "../config/env.js";

// En local : GOOGLE_APPLICATION_CREDENTIALS pointe vers une clé de service account
// (voir .env.example). En production sur Cloud Run : ni cette variable ni aucune clé
// ne sont présentes — le SDK utilise automatiquement les Application Default
// Credentials du compte de service attaché au service Cloud Run.
if (getApps().length === 0) {
  initializeApp({ projectId: env.FIREBASE_PROJECT_ID });
}

export const firebaseAuth = getAuth();
