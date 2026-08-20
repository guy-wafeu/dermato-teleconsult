-- Contraintes non exprimables dans prisma/schema.prisma — voir la note
-- d'architecture Phase 2 ("Suivi manuel des migrations") pour le détail.

-- 1) Unicité de l'email et du téléphone parmi les comptes patients actifs
--    uniquement : un email/téléphone redevient réutilisable après suppression
--    (deleted_at renseigné) d'un compte.
CREATE UNIQUE INDEX "patients_email_active_key" ON "patients" ("email") WHERE "deleted_at" IS NULL;
CREATE UNIQUE INDEX "patients_telephone_active_key" ON "patients" ("telephone") WHERE "deleted_at" IS NULL;

-- 2) status_history.changed_by_* est une référence polymorphe (patient OU admin
--    OU système) modélisée par deux colonnes nullables — cette contrainte impose
--    qu'exactement la bonne colonne soit renseignée selon changed_by_type.
ALTER TABLE "status_history" ADD CONSTRAINT "status_history_actor_check" CHECK (
  ("changed_by_type" = 'patient' AND "changed_by_patient_id" IS NOT NULL AND "changed_by_admin_id" IS NULL)
  OR ("changed_by_type" = 'admin' AND "changed_by_admin_id" IS NOT NULL AND "changed_by_patient_id" IS NULL)
  OR ("changed_by_type" = 'system' AND "changed_by_patient_id" IS NULL AND "changed_by_admin_id" IS NULL)
);
