import { QuickSQLite } from "react-native-quick-sqlite";
import { getDb } from "./db";
import type { ConsultationMode } from "../../store/consultationDraftStore";

export type ConsentSyncStatus = "pending" | "syncing" | "synced" | "failed";

export interface ConsentQueueRow {
  clientUuid: string;
  consultationId: string | null;
  mode: ConsultationMode;
  consentTextVersion: string;
  status: ConsentSyncStatus;
  lastError: string | null;
  updatedAt: string;
}

// Miroir de photoQueue.ts : un consentement donné hors ligne (avant même que le
// dossier n'ait d'id serveur) est stocké ici tout de suite plutôt que de bloquer
// l'utilisateur (voir ConsentAvailabilities#handleContinue) — syncEngine.ts le
// rejoue automatiquement dès que consultation_id est connu et que la connexion
// revient. Une seule ligne par brouillon (clé = clientUuid) : seul l'état final
// du consentement compte, pas son historique.
export function queueConsentLocally(input: {
  clientUuid: string;
  consultationId: string | null;
  mode: ConsultationMode;
  consentTextVersion: string;
}): void {
  const db = getDb();
  QuickSQLite.execute(
    db,
    `INSERT INTO consent_queue (client_uuid, consultation_id, mode, consent_text_version, status, last_error, updated_at)
     VALUES (?, ?, ?, ?, 'pending', NULL, ?)
     ON CONFLICT(client_uuid) DO UPDATE SET
       consultation_id = excluded.consultation_id,
       mode = excluded.mode,
       consent_text_version = excluded.consent_text_version,
       status = 'pending',
       last_error = NULL,
       updated_at = excluded.updated_at;`,
    [input.clientUuid, input.consultationId, input.mode, input.consentTextVersion, new Date().toISOString()],
  );
}

// Appelé par syncEngine juste après qu'un brouillon a obtenu son id serveur —
// débloque un consentement donné pendant que le dossier était encore hors ligne.
export function setConsentConsultationId(clientUuid: string, consultationId: string): void {
  const db = getDb();
  QuickSQLite.execute(
    db,
    `UPDATE consent_queue SET consultation_id = ? WHERE client_uuid = ? AND consultation_id IS NULL;`,
    [consultationId, clientUuid],
  );
}

export function markConsentStatus(clientUuid: string, status: ConsentSyncStatus, lastError?: string): void {
  const db = getDb();
  QuickSQLite.execute(db, `UPDATE consent_queue SET status = ?, last_error = ?, updated_at = ? WHERE client_uuid = ?;`, [
    status,
    lastError ?? null,
    new Date().toISOString(),
    clientUuid,
  ]);
}

export function removeConsentLocally(clientUuid: string): void {
  const db = getDb();
  QuickSQLite.execute(db, `DELETE FROM consent_queue WHERE client_uuid = ?;`, [clientUuid]);
}

function mapRow(row: Record<string, string | null>): ConsentQueueRow {
  return {
    clientUuid: String(row.client_uuid),
    consultationId: row.consultation_id === null ? null : String(row.consultation_id),
    mode: row.mode as ConsultationMode,
    consentTextVersion: String(row.consent_text_version),
    status: row.status as ConsentSyncStatus,
    lastError: row.last_error,
    updatedAt: String(row.updated_at),
  };
}

// Seules les lignes dont le dossier existe déjà côté serveur peuvent être
// envoyées — les autres attendent que syncPendingDrafts les débloque (voir
// setConsentConsultationId).
export function getPendingConsents(): ConsentQueueRow[] {
  const db = getDb();
  const result = QuickSQLite.execute(
    db,
    `SELECT * FROM consent_queue WHERE status IN ('pending', 'failed') AND consultation_id IS NOT NULL;`,
  );
  return (result.rows?._array ?? []).map(mapRow);
}

export function countPendingConsents(): number {
  const db = getDb();
  const result = QuickSQLite.execute(
    db,
    `SELECT COUNT(*) as count FROM consent_queue WHERE status IN ('pending', 'failed');`,
  );
  return Number(result.rows?._array?.[0]?.count ?? 0);
}
