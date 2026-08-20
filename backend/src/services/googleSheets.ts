import { sheets } from "./googleAuth.js";
import { env } from "../config/env.js";
import { logger } from "../lib/logger.js";
import { driveViewLink } from "./googleDrive.js";

// Synchronisation vers un Google Sheet demandée par le client comme vue/export
// pratique du contenu des dossiers — PAS la base de données de l'app (voir
// décision produit : Postgres reste la source de vérité, ce fichier ne fait
// qu'y recopier ce qui a déjà été validé et enregistré normalement). Toute erreur
// ici est avalée et journalisée, jamais remontée à l'appelant : une soumission ou
// un changement de statut ne doit jamais échouer à cause de Google Sheets — même
// logique que services/sms.ts pour l'accusé de réception par SMS.

const TAB = env.GOOGLE_SHEETS_TAB_NAME;
// Ordre demandé par le client : id, nom, sexe, âge, ville, profession, tél, mail,
// plaintes, démangeaisons, aspect lésions, produits utilisés, maladie chronique,
// photo_url, plage_horaire, statut_confirmation, date_soumission (colonnes A à Q).
const DATA_RANGE = `${TAB}!A:Q`;
const ID_COLUMN_RANGE = `${TAB}!A:A`;
const STATUS_COLUMN_INDEX = 15; // colonne O (0-indexée)

export interface SheetConsultationRow {
  id: string;
  nom: string | null;
  sexe: string | null;
  age: number | null;
  ville: string | null;
  profession: string | null;
  telephone: string | null;
  email: string | null;
  plaintes: string | null;
  demangeaisons: string | null;
  aspectLesions: string;
  produitsUtilises: string | null;
  maladieChronique: string | null;
  photoUrls: string[];
  plageHoraire: string;
  statutConfirmation: string;
  dateSoumission: string | null;
}

function toRowValues(row: SheetConsultationRow): string[] {
  return [
    row.id,
    row.nom ?? "",
    row.sexe ?? "",
    row.age !== null ? String(row.age) : "",
    row.ville ?? "",
    row.profession ?? "",
    row.telephone ?? "",
    row.email ?? "",
    row.plaintes ?? "",
    row.demangeaisons ?? "",
    row.aspectLesions,
    row.produitsUtilises ?? "",
    row.maladieChronique ?? "",
    row.photoUrls.map(driveViewLink).join(", "),
    row.plageHoraire,
    row.statutConfirmation,
    row.dateSoumission ?? "",
  ];
}

// Fonctionnalité optionnelle (contrairement à Drive, requis pour les photos) :
// tant que GOOGLE_SHEETS_ID n'est pas renseigné, no-op silencieux plutôt que
// d'exiger la configuration du Sheet avant même de pouvoir soumettre un dossier.
function sheetsConfigured(): boolean {
  return Boolean(env.GOOGLE_SHEETS_ID);
}

export async function appendConsultationRow(row: SheetConsultationRow): Promise<void> {
  if (!sheetsConfigured()) return;
  try {
    await sheets.spreadsheets.values.append({
      spreadsheetId: env.GOOGLE_SHEETS_ID,
      range: DATA_RANGE,
      valueInputOption: "USER_ENTERED",
      requestBody: { values: [toRowValues(row)] },
    });
  } catch (error) {
    logger.error({ err: error, consultationId: row.id }, "Échec de synchronisation Google Sheets (ajout de ligne).");
  }
}

// Pas d'API "upsert par clé" côté Google Sheets : on relit la colonne id pour
// trouver la ligne, puis on met à jour uniquement la cellule statut. Coût
// acceptable pour un volume de dossiers de cet ordre de grandeur (des centaines à
// quelques milliers de lignes) — à revoir si le Sheet grossit beaucoup.
export async function updateConsultationStatusInSheet(consultationId: string, status: string): Promise<void> {
  if (!sheetsConfigured()) return;
  try {
    const idColumn = await sheets.spreadsheets.values.get({
      spreadsheetId: env.GOOGLE_SHEETS_ID,
      range: ID_COLUMN_RANGE,
    });
    const ids = idColumn.data.values ?? [];
    const rowIndex = ids.findIndex((r) => r[0] === consultationId);
    if (rowIndex === -1) {
      logger.warn({ consultationId }, "Dossier absent du Google Sheet — statut non synchronisé.");
      return;
    }
    const statusColumnLetter = String.fromCharCode("A".charCodeAt(0) + STATUS_COLUMN_INDEX);
    await sheets.spreadsheets.values.update({
      spreadsheetId: env.GOOGLE_SHEETS_ID,
      range: `${TAB}!${statusColumnLetter}${rowIndex + 1}`,
      valueInputOption: "USER_ENTERED",
      requestBody: { values: [[status]] },
    });
  } catch (error) {
    logger.error({ err: error, consultationId }, "Échec de synchronisation Google Sheets (mise à jour du statut).");
  }
}
