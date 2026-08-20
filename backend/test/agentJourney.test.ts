import { randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";
import request from "supertest";
import { createApp } from "../src/app.js";
import { prisma } from "../src/db/client.js";
import { createAdmin, createPatient, createSubmittedConsultation } from "./factories.js";

// Parcours agent terrain : un admin authentifié saisit un dossier complet pour une
// personne sans compte Firebase (voir backend/src/modules/agent). Repasse par les
// vraies routes HTTP sur la base Postgres de test réelle, comme les autres parcours.
const app = createApp();

describe("Parcours agent terrain", () => {
  it("crée un patient sans compte, remplit le dossier, envoie les photos et soumet", async () => {
    const agent = await createAdmin();
    const clientUuid = randomUUID();

    const availabilities = await prisma.availability.findMany({ where: { actif: true }, take: 1 });
    if (availabilities.length === 0) {
      throw new Error("Aucune disponibilité en base de test — lancez `npx tsx prisma/seed.ts` sur dermato_test.");
    }

    // Téléphone aléatoire : la base de test est réutilisée entre les runs (voir
    // test/factories.ts#unique), un numéro fixe finit par percuter la contrainte
    // unique sur patients.telephone dès la deuxième exécution du test.
    const telephoneContact = `+225${String(Math.floor(1000000 + Math.random() * 8999999))}`;

    const draftResponse = await request(app)
      .put(`/api/v1/admin/agent-consultations/draft/${clientUuid}`)
      .set("Authorization", agent.authHeader)
      .send({
        nomComplet: "Kouadio Marie",
        sexe: "F",
        age: 52,
        ville: "Daloa",
        telephoneContact,
        confirmationWhatsapp: false,
        motif: "Plaie qui ne cicatrise pas depuis dix jours",
        demangeaison: "non",
        photosQualiteConfirmee: true,
        lesionTypes: [{ code: "plaie" }],
        availabilities: [{ availabilityId: availabilities[0].id }],
      });

    expect(draftResponse.status).toBe(200);
    const consultationId = draftResponse.body.id as string;

    // Un Patient a bien été créé, sans compte Firebase, tracé sur l'agent qui l'a saisi.
    const stored = await prisma.consultation.findUniqueOrThrow({
      where: { id: consultationId },
      include: { patient: true },
    });
    expect(stored.patient.firebaseUid).toBeNull();
    expect(stored.patient.createdByAdminId).toBe(agent.adminId);
    expect(stored.patient.prenom).toBe("Kouadio");
    expect(stored.patient.nom).toBe("Marie");
    expect(stored.patient.telephone).toBe(telephoneContact);

    for (const slot of ["vue_generale", "vue_rapprochee"] as const) {
      const uploadResponse = await request(app)
        .post(`/api/v1/admin/agent-consultations/${consultationId}/photos`)
        .set("Authorization", agent.authHeader)
        .field("slot", slot)
        .attach("file", Buffer.from("fake-jpeg-bytes"), { filename: `${slot}.jpg`, contentType: "image/jpeg" });
      expect(uploadResponse.status).toBe(201);
    }

    const consentResponse = await request(app)
      .post(`/api/v1/admin/agent-consultations/${consultationId}/consent`)
      .set("Authorization", agent.authHeader)
      .send({ consentTextVersion: "v1.0-test" });
    expect(consentResponse.status).toBe(201);

    const submitResponse = await request(app)
      .post(`/api/v1/admin/agent-consultations/${consultationId}/submit`)
      .set("Authorization", agent.authHeader)
      .send();
    expect(submitResponse.status).toBe(200);
    expect(submitResponse.body.status).toBe("pending");

    // Le dossier créé par l'agent apparaît dans la liste admin standard, au même
    // titre qu'un dossier auto-soumis par un vrai patient.
    const listResponse = await request(app)
      .get("/api/v1/admin/consultations?status=pending")
      .set("Authorization", agent.authHeader)
      .send();
    expect(listResponse.status).toBe(200);
    expect(listResponse.body.items.some((item: { id: string }) => item.id === consultationId)).toBe(true);
  });

  it("réutilise la même fiche patient terrain quand un second dossier reprend le même numéro", async () => {
    const agent = await createAdmin();
    const telephoneContact = `+225${String(Math.floor(1000000 + Math.random() * 8999999))}`;

    const firstDraft = await request(app)
      .put(`/api/v1/admin/agent-consultations/draft/${randomUUID()}`)
      .set("Authorization", agent.authHeader)
      .send({ nomComplet: "Yao Prisca", telephoneContact, motif: "Première visite" });
    expect(firstDraft.status).toBe(200);

    const secondDraft = await request(app)
      .put(`/api/v1/admin/agent-consultations/draft/${randomUUID()}`)
      .set("Authorization", agent.authHeader)
      .send({ nomComplet: "Yao Prisca", telephoneContact, motif: "Deuxième visite, quelques mois plus tard" });
    expect(secondDraft.status).toBe(200);

    const [first, second] = await Promise.all([
      prisma.consultation.findUniqueOrThrow({ where: { id: firstDraft.body.id }, select: { patientId: true } }),
      prisma.consultation.findUniqueOrThrow({ where: { id: secondDraft.body.id }, select: { patientId: true } }),
    ]);
    expect(second.patientId).toBe(first.patientId);
  });

  it("refuse de créer un dossier terrain avec le numéro d'un compte patient déjà inscrit", async () => {
    const patient = await createPatient(app);
    const registeredPatient = await prisma.patient.findUniqueOrThrow({ where: { id: patient.patientId } });
    const agent = await createAdmin();

    const response = await request(app)
      .put(`/api/v1/admin/agent-consultations/draft/${randomUUID()}`)
      .set("Authorization", agent.authHeader)
      .send({ nomComplet: "Test Conflit", telephoneContact: registeredPatient.telephone });

    expect(response.status).toBe(409);
  });

  it("refuse qu'un agent modifie le dossier d'un vrai patient inscrit via les routes agent", async () => {
    const patient = await createPatient(app);
    const { consultationId } = await createSubmittedConsultation(app, patient);
    const agent = await createAdmin();

    const response = await request(app)
      .post(`/api/v1/admin/agent-consultations/${consultationId}/consent`)
      .set("Authorization", agent.authHeader)
      .send({ consentTextVersion: "v1.0-test" });

    expect(response.status).toBe(403);
  });

  it("permet à l'admin de corriger un dossier déjà soumis via /fields", async () => {
    const patient = await createPatient(app);
    const { consultationId } = await createSubmittedConsultation(app, patient);
    const admin = await createAdmin();

    const response = await request(app)
      .patch(`/api/v1/admin/consultations/${consultationId}/fields`)
      .set("Authorization", admin.authHeader)
      .send({ motif: "Motif corrigé par l'admin après relecture" });

    expect(response.status).toBe(200);
    expect(response.body.motif).toBe("Motif corrigé par l'admin après relecture");

    const stored = await prisma.consultation.findUniqueOrThrow({ where: { id: consultationId } });
    expect(stored.motif).toBe("Motif corrigé par l'admin après relecture");
  });
});
