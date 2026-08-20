-- Renommage (pas drop+add) : préserve les lignes existantes, contrairement au
-- diff auto-généré par Prisma qui aurait ajouté une colonne NOT NULL sans
-- valeur par défaut sur une table déjà peuplée.
ALTER TABLE "photos" RENAME COLUMN "gcs_object_path" TO "drive_file_id";
