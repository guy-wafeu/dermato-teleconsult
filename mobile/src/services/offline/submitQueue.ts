import { QuickSQLite } from "react-native-quick-sqlite";
import { getDb } from "./db";
import type { ConsultationMode } from "../../store/consultationDraftStore";

export type SubmitSyncStatus = "pending" | "syncing" | "synced" | "failed";

export interface SubmitQueueRow {
  clientUuid: string;
  consultationId: string | null;
  mode: ConsultationMode;
  status: SubmitSyncStatus;
  lastError: string | null;
  updatedAt: string;
}

// Miroir de consentQueue.ts : l'intention "envoyer ce dossier" est stockée ici
// tout de suite (voir SummaryScreen#handleSubmit) dès que la connexion manque
// ou que les photos requises ne sont pas encore réellement envoyées — l'agent
// n'attend jamais, syncEngine rejoue l'envoi automatiquement une fois les
// conditions réunies. Une seule ligne par brouillon (clé = clientUuid).
export function queueSubmitLocally(input: {
  clientUuid: string;
  consultationId: string | null;
  mode: ConsultationMode;
}): void {
  const db = getDb();
  QuickSQLite.execute(
    db,
    `INSERT INTO submit_queue (client_uuid, consultation_id, mode, status, last_error, updated_at)
     VALUES (?, ?, ?, 'pending', NULL, ?)
     ON CONFLICT(client_uuid) DO UPDATE SET
       consultation_id = excluded.consultation_id,
       mode = excluded.mode,
       status = 'pending',
       last_error = NULL,
       updated_at = excluded.updated_at;`,
    [input.clientUuid, input.consultationId, input.mode, new Date().toISOString()],
  );
}

// Appelé par syncEngine juste après qu'un brouillon a obtenu son id serveur —
// débloque l'envoi final mis en file pendant que le dossier était encore hors
// ligne (voir setPhotoConsultationId / setConsentConsultationId, même logique).
export function setSubmitConsultationId(clientUuid: string, consultationId: string): void {
  const db = getDb();
  QuickSQLite.execute(db, `UPDATE submit_queue SET consultation_id = ? WHERE client_uuid = ? AND consultation_id IS NULL;`, [
    consultationId,
    clientUuid,
  ]);
}

export function markSubmitStatus(clientUuid: string, status: SubmitSyncStatus, lastError?: string): void {
  const db = getDb();
  QuickSQLite.execute(db, `UPDATE submit_queue SET status = ?, last_error = ?, updated_at = ? WHERE client_uuid = ?;`, [
    status,
    lastError ?? null,
    new Date().toISOString(),
    clientUuid,
  ]);
}

export function removeSubmitLocally(clientUuid: string): void {
  const db = getDb();
  QuickSQLite.execute(db, `DELETE FROM submit_queue WHERE client_uuid = ?;`, [clientUuid]);
}

function mapRow(row: Record<string, string | null>): SubmitQueueRow {
  return {
    clientUuid: String(row.client_uuid),
    consultationId: row.consultation_id === null ? null : String(row.consultation_id),
    mode: row.mode as ConsultationMode,
    status: row.status as SubmitSyncStatus,
    lastError: row.last_error,
    updatedAt: String(row.updated_at),
  };
}

// Rejoué en dernier par syncEngine (après drafts/consents/photos) : le serveur
// revérifie que les photos requises sont bien reçues avant d'accepter l'envoi —
// une ligne restée "failed" pour ce motif est simplement retentée au prochain
// passage, une fois les photos réellement envoyées.
export function getPendingSubmits(): SubmitQueueRow[] {
  const db = getDb();
  const result = QuickSQLite.execute(
    db,
    `SELECT * FROM submit_queue WHERE status IN ('pending', 'failed') AND consultation_id IS NOT NULL;`,
  );
  return (result.rows?._array ?? []).map(mapRow);
}

export function countPendingSubmits(): number {
  const db = getDb();
  const result = QuickSQLite.execute(db, `SELECT COUNT(*) as count FROM submit_queue WHERE status IN ('pending', 'failed');`);
  return Number(result.rows?._array?.[0]?.count ?? 0);
}
