import { QuickSQLite } from "react-native-quick-sqlite";

const DB_NAME = "dermato_offline.sqlite";

let initialized = false;

// Ouverture paresseuse : le module natif QuickSQLite ne doit être touché qu'au
// premier besoin réel (jamais à l'import du fichier), sinon le simple fait
// d'importer ce module côté test ou avant le montage natif complet fait planter
// l'app (voir le message d'erreur "Base quick-sqlite module not found").
export function getDb(): string {
  if (!initialized) {
    QuickSQLite.open(DB_NAME);
    QuickSQLite.execute(
      DB_NAME,
      `CREATE TABLE IF NOT EXISTS draft_queue (
        client_uuid TEXT PRIMARY KEY,
        payload TEXT NOT NULL,
        status TEXT NOT NULL,
        last_error TEXT,
        updated_at TEXT NOT NULL
      );`,
    );
    // consultation_id est NULL tant que le brouillon associé n'a pas encore
    // synchronisé (voir photoQueue.ts#setPhotoConsultationId, appelé par
    // syncEngine dès qu'un brouillon obtient son id serveur) — une photo prise
    // hors ligne, avant même que le dossier existe côté serveur, doit pouvoir
    // être mise en file sans bloquer l'utilisateur.
    QuickSQLite.execute(
      DB_NAME,
      `CREATE TABLE IF NOT EXISTS photo_queue (
        id TEXT PRIMARY KEY,
        client_uuid TEXT NOT NULL,
        consultation_id TEXT,
        mode TEXT NOT NULL,
        slot TEXT NOT NULL,
        local_uri TEXT NOT NULL,
        mime_type TEXT NOT NULL,
        size_bytes INTEGER NOT NULL,
        status TEXT NOT NULL,
        last_error TEXT,
        updated_at TEXT NOT NULL
      );`,
    );
    initialized = true;
  }
  return DB_NAME;
}
