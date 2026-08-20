import { QuickSQLite } from "react-native-quick-sqlite";
import uuid from "react-native-uuid";
import { getDb } from "./db";
import type { ConsultationMode } from "../../store/consultationDraftStore";
import type { PhotoSlot } from "../../types/api";

export type PhotoSyncStatus = "pending" | "syncing" | "synced" | "failed";

export interface PhotoQueueRow {
  id: string;
  clientUuid: string;
  consultationId: string | null;
  mode: ConsultationMode;
  slot: PhotoSlot;
  localUri: string;
  mimeType: string;
  sizeBytes: number;
  status: PhotoSyncStatus;
  lastError: string | null;
  updatedAt: string;
}

// Miroir de draftQueue.ts, pour les photos : une photo prise sans connexion (ou
// avant que le brouillon n'ait obtenu son id serveur) est stockée ici tout de
// suite plutôt que de bloquer l'utilisateur (voir PhotosScreen#pickAndUpload) —
// syncEngine.ts la reprend automatiquement dès que consultation_id est connu et
// que la connexion revient.
export function queuePhotoLocally(input: {
  clientUuid: string;
  consultationId: string | null;
  mode: ConsultationMode;
  slot: PhotoSlot;
  localUri: string;
  mimeType: string;
  sizeBytes: number;
}): string {
  const db = getDb();
  const id = uuid.v4() as string;
  QuickSQLite.execute(
    db,
    `INSERT INTO photo_queue (id, client_uuid, consultation_id, mode, slot, local_uri, mime_type, size_bytes, status, last_error, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', NULL, ?);`,
    [
      id,
      input.clientUuid,
      input.consultationId,
      input.mode,
      input.slot,
      input.localUri,
      input.mimeType,
      input.sizeBytes,
      new Date().toISOString(),
    ],
  );
  return id;
}

// Appelé par syncEngine juste après qu'un brouillon a obtenu son id serveur —
// débloque toutes les photos prises pour ce brouillon pendant qu'il était encore
// hors ligne, sans avoir à les reprendre une par une manuellement.
export function setPhotoConsultationId(clientUuid: string, consultationId: string): void {
  const db = getDb();
  QuickSQLite.execute(db, `UPDATE photo_queue SET consultation_id = ? WHERE client_uuid = ? AND consultation_id IS NULL;`, [
    consultationId,
    clientUuid,
  ]);
}

export function markPhotoStatus(id: string, status: PhotoSyncStatus, lastError?: string): void {
  const db = getDb();
  QuickSQLite.execute(db, `UPDATE photo_queue SET status = ?, last_error = ?, updated_at = ? WHERE id = ?;`, [
    status,
    lastError ?? null,
    new Date().toISOString(),
    id,
  ]);
}

export function removePhotoLocally(id: string): void {
  const db = getDb();
  QuickSQLite.execute(db, `DELETE FROM photo_queue WHERE id = ?;`, [id]);
}

// Utilisé quand l'utilisateur supprime une photo depuis l'écran (voir
// PhotosScreen#handleRemove) : évite qu'une photo retirée de l'écran soit quand
// même envoyée plus tard par syncEngine si elle était encore en file.
export function removeQueuedPhotoByLocalUri(clientUuid: string, slot: PhotoSlot, localUri: string): void {
  const db = getDb();
  QuickSQLite.execute(db, `DELETE FROM photo_queue WHERE client_uuid = ? AND slot = ? AND local_uri = ?;`, [
    clientUuid,
    slot,
    localUri,
  ]);
}

function mapRow(row: Record<string, string | number | null>): PhotoQueueRow {
  return {
    id: String(row.id),
    clientUuid: String(row.client_uuid),
    consultationId: row.consultation_id === null ? null : String(row.consultation_id),
    mode: row.mode as ConsultationMode,
    slot: row.slot as PhotoSlot,
    localUri: String(row.local_uri),
    mimeType: String(row.mime_type),
    sizeBytes: Number(row.size_bytes),
    status: row.status as PhotoSyncStatus,
    lastError: row.last_error === null ? null : String(row.last_error),
    updatedAt: String(row.updated_at),
  };
}

// Seules les lignes dont le dossier existe déjà côté serveur (consultation_id
// connu) peuvent être envoyées — les autres attendent que syncPendingDrafts les
// débloque (voir setPhotoConsultationId).
export function getPendingPhotos(): PhotoQueueRow[] {
  const db = getDb();
  const result = QuickSQLite.execute(
    db,
    `SELECT * FROM photo_queue WHERE status IN ('pending', 'failed') AND consultation_id IS NOT NULL;`,
  );
  return (result.rows?._array ?? []).map(mapRow);
}

export function getQueuedPhotosForClientUuid(clientUuid: string): PhotoQueueRow[] {
  const db = getDb();
  const result = QuickSQLite.execute(
    db,
    `SELECT * FROM photo_queue WHERE client_uuid = ? AND status != 'synced';`,
    [clientUuid],
  );
  return (result.rows?._array ?? []).map(mapRow);
}

export function countPendingPhotos(): number {
  const db = getDb();
  const result = QuickSQLite.execute(
    db,
    `SELECT COUNT(*) as count FROM photo_queue WHERE status IN ('pending', 'failed');`,
  );
  return Number(result.rows?._array?.[0]?.count ?? 0);
}
