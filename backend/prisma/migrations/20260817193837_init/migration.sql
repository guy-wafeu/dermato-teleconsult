-- CreateEnum
CREATE TYPE "ConsultationStatus" AS ENUM ('draft', 'pending', 'confirmed', 'seen', 'completed', 'cancelled');

-- CreateEnum
CREATE TYPE "Sexe" AS ENUM ('M', 'F');

-- CreateEnum
CREATE TYPE "StatutMatrimonial" AS ENUM ('celibataire', 'marie', 'vie_en_couple', 'veuf_veuve', 'autre');

-- CreateEnum
CREATE TYPE "DureeUnite" AS ENUM ('jours', 'semaines', 'mois', 'annees');

-- CreateEnum
CREATE TYPE "Demangeaison" AS ENUM ('oui', 'non', 'parfois', 'nuit');

-- CreateEnum
CREATE TYPE "EntourageStatus" AS ENUM ('oui', 'non', 'ne_sait_pas');

-- CreateEnum
CREATE TYPE "PhotoSlot" AS ENUM ('vue_generale', 'vue_rapprochee', 'complementaire');

-- CreateEnum
CREATE TYPE "PhotoStatus" AS ENUM ('pending_upload', 'uploaded', 'failed', 'deleted');

-- CreateEnum
CREATE TYPE "ChangedByType" AS ENUM ('patient', 'admin', 'system');

-- CreateEnum
CREATE TYPE "JourSemaine" AS ENUM ('lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi');

-- CreateEnum
CREATE TYPE "AdminRole" AS ENUM ('admin');

-- CreateTable
CREATE TABLE "patients" (
    "id" UUID NOT NULL,
    "firebase_uid" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "prenom" TEXT NOT NULL,
    "telephone" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "patients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admin_users" (
    "id" UUID NOT NULL,
    "firebase_uid" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "prenom" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" "AdminRole" NOT NULL DEFAULT 'admin',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "admin_users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "consultations" (
    "id" UUID NOT NULL,
    "ref_number" SERIAL NOT NULL,
    "client_uuid" UUID NOT NULL,
    "patient_id" UUID NOT NULL,
    "status" "ConsultationStatus" NOT NULL DEFAULT 'draft',
    "sexe" "Sexe",
    "statut_matrimonial" "StatutMatrimonial",
    "age" INTEGER,
    "ville" TEXT,
    "profession" TEXT,
    "telephone_contact" TEXT,
    "email_contact" TEXT,
    "poids_kg" DECIMAL(5,2),
    "taille_cm" DECIMAL(5,1),
    "temperature_c" DECIMAL(3,1),
    "motif" TEXT,
    "conseil_cosmetique_demande" BOOLEAN NOT NULL DEFAULT false,
    "conseil_cosmetique_precision" TEXT,
    "duree_valeur" INTEGER,
    "duree_unite" "DureeUnite",
    "localisation_premieres_lesions" TEXT,
    "demangeaison" "Demangeaison",
    "autres_lesions" BOOLEAN,
    "autres_lesions_aspect" TEXT,
    "autres_lesions_localisation" TEXT,
    "zones_sensibles_atteintes" BOOLEAN,
    "zones_sensibles_precision" TEXT,
    "entourage_status" "EntourageStatus",
    "entourage_precision" TEXT,
    "produits_utilises" BOOLEAN,
    "produits_precision" TEXT,
    "antecedents_medicaux" BOOLEAN,
    "antecedents_precision" TEXT,
    "notes_complementaires" TEXT,
    "submitted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "consultations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lesion_types" (
    "code" TEXT NOT NULL,
    "label_fr" TEXT NOT NULL,
    "description" TEXT,
    "display_order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "lesion_types_pkey" PRIMARY KEY ("code")
);

-- CreateTable
CREATE TABLE "consultation_lesion_types" (
    "consultation_id" UUID NOT NULL,
    "lesion_code" TEXT NOT NULL,
    "precision" TEXT,

    CONSTRAINT "consultation_lesion_types_pkey" PRIMARY KEY ("consultation_id","lesion_code")
);

-- CreateTable
CREATE TABLE "photos" (
    "id" UUID NOT NULL,
    "consultation_id" UUID NOT NULL,
    "slot" "PhotoSlot" NOT NULL,
    "gcs_object_path" TEXT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "size_bytes" BIGINT,
    "width_px" INTEGER,
    "height_px" INTEGER,
    "status" "PhotoStatus" NOT NULL DEFAULT 'pending_upload',
    "uploaded_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "photos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "availabilities" (
    "id" UUID NOT NULL,
    "jour_semaine" "JourSemaine" NOT NULL,
    "heure_debut" TIME(0) NOT NULL,
    "heure_fin" TIME(0) NOT NULL,
    "label" TEXT NOT NULL,
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "display_order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "availabilities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "consultation_availabilities" (
    "id" UUID NOT NULL,
    "consultation_id" UUID NOT NULL,
    "availability_id" UUID,
    "autre_precision" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "consultation_availabilities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "consents" (
    "id" UUID NOT NULL,
    "consultation_id" UUID NOT NULL,
    "consent_text_version" TEXT NOT NULL,
    "consented_at" TIMESTAMP(3) NOT NULL,
    "ip_address" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "consents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "appointments" (
    "id" UUID NOT NULL,
    "consultation_id" UUID NOT NULL,
    "availability_id" UUID,
    "scheduled_at" TIMESTAMP(3),
    "notes" TEXT,
    "created_by_admin_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "appointments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "status_history" (
    "id" UUID NOT NULL,
    "consultation_id" UUID NOT NULL,
    "previous_status" "ConsultationStatus",
    "new_status" "ConsultationStatus" NOT NULL,
    "changed_by_type" "ChangedByType" NOT NULL,
    "changed_by_patient_id" UUID,
    "changed_by_admin_id" UUID,
    "reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "status_history_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "patients_firebase_uid_key" ON "patients"("firebase_uid");

-- CreateIndex
CREATE UNIQUE INDEX "admin_users_firebase_uid_key" ON "admin_users"("firebase_uid");

-- CreateIndex
CREATE UNIQUE INDEX "admin_users_email_key" ON "admin_users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "consultations_ref_number_key" ON "consultations"("ref_number");

-- CreateIndex
CREATE UNIQUE INDEX "consultations_client_uuid_key" ON "consultations"("client_uuid");

-- CreateIndex
CREATE INDEX "consultations_patient_id_idx" ON "consultations"("patient_id");

-- CreateIndex
CREATE INDEX "consultations_status_idx" ON "consultations"("status");

-- CreateIndex
CREATE INDEX "consultations_submitted_at_idx" ON "consultations"("submitted_at");

-- CreateIndex
CREATE UNIQUE INDEX "photos_gcs_object_path_key" ON "photos"("gcs_object_path");

-- CreateIndex
CREATE INDEX "photos_consultation_id_idx" ON "photos"("consultation_id");

-- CreateIndex
CREATE INDEX "consultation_availabilities_consultation_id_idx" ON "consultation_availabilities"("consultation_id");

-- CreateIndex
CREATE UNIQUE INDEX "consents_consultation_id_key" ON "consents"("consultation_id");

-- CreateIndex
CREATE UNIQUE INDEX "appointments_consultation_id_key" ON "appointments"("consultation_id");

-- CreateIndex
CREATE INDEX "status_history_consultation_id_idx" ON "status_history"("consultation_id");

-- CreateIndex
CREATE INDEX "status_history_created_at_idx" ON "status_history"("created_at");

-- AddForeignKey
ALTER TABLE "consultations" ADD CONSTRAINT "consultations_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consultation_lesion_types" ADD CONSTRAINT "consultation_lesion_types_consultation_id_fkey" FOREIGN KEY ("consultation_id") REFERENCES "consultations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consultation_lesion_types" ADD CONSTRAINT "consultation_lesion_types_lesion_code_fkey" FOREIGN KEY ("lesion_code") REFERENCES "lesion_types"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "photos" ADD CONSTRAINT "photos_consultation_id_fkey" FOREIGN KEY ("consultation_id") REFERENCES "consultations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consultation_availabilities" ADD CONSTRAINT "consultation_availabilities_consultation_id_fkey" FOREIGN KEY ("consultation_id") REFERENCES "consultations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consultation_availabilities" ADD CONSTRAINT "consultation_availabilities_availability_id_fkey" FOREIGN KEY ("availability_id") REFERENCES "availabilities"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consents" ADD CONSTRAINT "consents_consultation_id_fkey" FOREIGN KEY ("consultation_id") REFERENCES "consultations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_consultation_id_fkey" FOREIGN KEY ("consultation_id") REFERENCES "consultations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_availability_id_fkey" FOREIGN KEY ("availability_id") REFERENCES "availabilities"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_created_by_admin_id_fkey" FOREIGN KEY ("created_by_admin_id") REFERENCES "admin_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "status_history" ADD CONSTRAINT "status_history_consultation_id_fkey" FOREIGN KEY ("consultation_id") REFERENCES "consultations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "status_history" ADD CONSTRAINT "status_history_changed_by_patient_id_fkey" FOREIGN KEY ("changed_by_patient_id") REFERENCES "patients"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "status_history" ADD CONSTRAINT "status_history_changed_by_admin_id_fkey" FOREIGN KEY ("changed_by_admin_id") REFERENCES "admin_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
