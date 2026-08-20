import { google } from "googleapis";
import { env } from "../config/env.js";

// Deux identités distinctes, pas une seule comme avant (voir historique) : les
// comptes de service Google n'ont plus de quota de stockage pour CRÉER des
// fichiers Drive (erreur "Service Accounts do not have storage quota", constatée
// en pratique) — Drive utilise donc OAuth2 sur un compte Google personnel
// (refresh token obtenu une fois via scripts/authorizeDrive.mjs). Sheets, lui,
// n'a besoin que d'ÉDITER un fichier déjà existant (partagé en Éditeur), ce qui
// reste possible avec un compte de service classique.
const driveOAuthClient = new google.auth.OAuth2(env.GOOGLE_OAUTH_CLIENT_ID, env.GOOGLE_OAUTH_CLIENT_SECRET);
driveOAuthClient.setCredentials({ refresh_token: env.GOOGLE_OAUTH_REFRESH_TOKEN });

const sheetsServiceAuth = new google.auth.GoogleAuth({
  keyFile: env.GOOGLE_SERVICE_ACCOUNT_KEY_FILE,
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

export const drive = google.drive({ version: "v3", auth: driveOAuthClient });
export const sheets = google.sheets({ version: "v4", auth: sheetsServiceAuth });
