import { randomUUID } from "node:crypto";
import request from "supertest";
import type { Express } from "express";
import { prisma } from "../src/db/client.js";
import { authHeader, type FakeIdentity } from "./mocks.js";

let uniqueCounter = 0;

// Suffixe unique par appel : la base de test (dermato_test, voir .env.test.example)
// est réutilisée entre les exécutions, donc les tests ne doivent jamais dépendre
// d'un email/téléphone/uid fixe déjà présent en base d'un run précédent.
function unique(): string {
  uniqueCounter += 1;
  return `${Date.now()}-${process.pid}-${uniqueCounter}`;
}

export interface TestPatient {
  identity: FakeIdentity;
  authHeader: string;
  patientId: string;
}

export async function createPatient(app: Express): Promise<TestPatient> {
  const suffix = unique();
  const identity: FakeIdentity = { uid: `patient-${suffix}`, email: `patient-${suffix}@test.local` };
  const header = authHeader(identity);

  const response = await request(app)
    .post("/api/v1/patients/me")
    .set("Authorization", header)
    .send({
      nom: "Dupont",
      prenom: "Awa",
      telephone: `+225${String(Math.floor(1000000 + Math.random() * 8999999))}`,
      email: identity.email,
    });

  if (response.status !== 201) {
    throw new Error(`Échec de création du patient de test : ${response.status} ${JSON.stringify(response.body)}`);
  }

  return { identity, authHeader: header, patientId: response.body.id as string };
}

export interface TestAdmin {
  identity: FakeIdentity;
  authHeader: string;
  adminId: string;
}

export async function createAdmin(): Promise<TestAdmin> {
  const suffix = unique();
  const identity: FakeIdentity = { uid: `admin-${suffix}`, email: `admin-${suffix}@test.local` };
  const admin = await prisma.adminUser.create({
    data: { firebaseUid: identity.uid, nom: "Konan", prenom: "Yves", email: identity.email! },
  });
  return { identity, authHeader: authHeader(identity), adminId: admin.id };
}

// Construit un dossier jusqu'à un état donné en repassant par les vraies routes HTTP
// (pas des insertions Prisma directes) : c'est ce qui vérifie que le parcours complet
// fonctionne de bout en bout, pas seulement que les données finales sont cohérentes.
export async function createSubmittedConsultation(app: Express, patient: TestPatient) {
  const clientUuid = randomUUID();

  const availabilities = await prisma.availability.findMany({ where: { actif: true }, take: 1 });
  if (availabilities.length === 0) {
    throw new Error("Aucune disponibilité en base de test — lancez `npx tsx prisma/seed.ts` sur dermato_test.");
  }

  const draftResponse = await request(app)
    .put(`/api/v1/consultations/draft/${clientUuid}`)
    .set("Authorization", patient.authHeader)
    .send({
      nomComplet: "Yao Konan",
      sexe: "F",
      age: 29,
      ville: "Abidjan",
      telephoneContact: "+22501020304",
      confirmationWhatsapp: true,
      motif: "Plaques rouges qui démangent depuis une semaine",
      demangeaison: "oui",
      photosQualiteConfirmee: true,
      lesionTypes: [{ code: "plaque" }],
      availabilities: [{ availabilityId: availabilities[0].id }],
    });

  if (draftResponse.status !== 200) {
    throw new Error(`Échec de sauvegarde du brouillon : ${draftResponse.status} ${JSON.stringify(draftResponse.body)}`);
  }

  const consultationId = draftResponse.body.id as string;

  // Upload en une seule étape (voir photos.routes.ts) : le fichier part en
  // multipart, Drive est mocké (test/mocks.ts) donc n'importe quel petit buffer
  // suffit — ce n'est pas le contenu de l'image qui est testé ici.
  for (const slot of ["vue_generale", "vue_rapprochee"] as const) {
    const uploadResponse = await request(app)
      .post(`/api/v1/consultations/${consultationId}/photos`)
      .set("Authorization", patient.authHeader)
      .field("slot", slot)
      .attach("file", Buffer.from("fake-jpeg-bytes"), { filename: `${slot}.jpg`, contentType: "image/jpeg" });

    if (uploadResponse.status !== 201) {
      throw new Error(`Échec d'envoi de la photo (${slot}) : ${uploadResponse.status} ${JSON.stringify(uploadResponse.body)}`);
    }
  }

  const consentResponse = await request(app)
    .post(`/api/v1/consultations/${consultationId}/consent`)
    .set("Authorization", patient.authHeader)
    .send({ consentTextVersion: "v1.0-test" });

  if (consentResponse.status !== 201) {
    throw new Error(`Échec d'enregistrement du consentement : ${consentResponse.status} ${JSON.stringify(consentResponse.body)}`);
  }

  const submitResponse = await request(app)
    .post(`/api/v1/consultations/${consultationId}/submit`)
    .set("Authorization", patient.authHeader)
    .send();

  if (submitResponse.status !== 200) {
    throw new Error(`Échec de soumission : ${submitResponse.status} ${JSON.stringify(submitResponse.body)}`);
  }

  return { consultationId, refNumber: submitResponse.body.refNumber as number, availabilityId: availabilities[0].id };
}
