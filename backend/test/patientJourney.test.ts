import { randomUUID } from "node:crypto";
import { beforeAll, describe, expect, it } from "vitest";
import request from "supertest";
import { createApp } from "../src/app.js";
import { prisma } from "../src/db/client.js";
import { africasTalkingSmsSend, authHeader } from "./mocks.js";
import { createPatient, createSubmittedConsultation } from "./factories.js";

// Parcours complet du patient (inscription -> connexion -> formulaire -> photos ->
// créneau -> accusé de réception), en repassant par les vraies routes HTTP sur une
// base Postgres de test réelle (voir .env.test.example) — pas des insertions Prisma
// directes. Firebase Auth et Cloud Storage sont mockés (voir test/mocks.ts) ; tout le
// reste (validation, transactions, contraintes SQL) est le vrai code de prod.
const app = createApp();

describe("Parcours patient complet", () => {
  it("inscription -> connexion -> brouillon -> photos -> consentement -> soumission", async () => {
    const patient = await createPatient(app);

    // "Connexion" : un nouvel appel authentifié avec la même identité retrouve le
    // même profil (c'est ce que fait /patients/me au démarrage de l'app, voir
    // RootNavigator côté mobile).
    const meResponse = await request(app).get("/api/v1/patients/me").set("Authorization", patient.authHeader).send();
    expect(meResponse.status).toBe(200);
    expect(meResponse.body.id).toBe(patient.patientId);

    const { consultationId, refNumber } = await createSubmittedConsultation(app, patient);
    expect(refNumber).toBeGreaterThan(0);

    // Accusé de réception : le patient peut relire son dossier soumis et son statut.
    const getResponse = await request(app)
      .get(`/api/v1/consultations/${consultationId}`)
      .set("Authorization", patient.authHeader)
      .send();
    expect(getResponse.status).toBe(200);
    expect(getResponse.body.status).toBe("pending");
    expect(getResponse.body.submittedAt).not.toBeNull();

    // Les données arrivent bien et correctement en base (pas seulement dans la
    // réponse HTTP) : c'est le point que le formulaire papier ne pouvait pas
    // garantir automatiquement.
    const stored = await prisma.consultation.findUniqueOrThrow({
      where: { id: consultationId },
      include: { photos: true, consent: true, availabilities: true, lesionTypes: true, statusHistory: true },
    });
    expect(stored.patientId).toBe(patient.patientId);
    expect(stored.status).toBe("pending");
    expect(stored.motif).toContain("démangent");
    expect(stored.photos.filter((p) => p.status === "uploaded")).toHaveLength(2);
    expect(stored.consent?.consentTextVersion).toBe("v1.0-test");
    expect(stored.availabilities).toHaveLength(1);
    expect(stored.lesionTypes.map((l) => l.lesionCode)).toEqual(["plaque"]);
    expect(stored.statusHistory).toHaveLength(1);
    expect(stored.statusHistory[0].newStatus).toBe("pending");
    expect(stored.statusHistory[0].changedByType).toBe("patient");

    // Accusé de réception par SMS déclenché après la soumission (voir
    // consultations.service.ts#submitConsultation), avec le numéro de dossier dans
    // le message envoyé au numéro du compte patient (pas telephoneContact, qui peut
    // différer — voir Patient.telephone vs Consultation.telephoneContact).
    expect(africasTalkingSmsSend).toHaveBeenCalledWith(
      expect.objectContaining({ message: expect.stringContaining(String(refNumber).padStart(6, "0")) }),
    );
    const [smsCallArgs] = africasTalkingSmsSend.mock.calls[africasTalkingSmsSend.mock.calls.length - 1];
    expect(String(smsCallArgs.to).replace(/\s/g, "")).toMatch(/^\+225\d+$/);
  });

  it("refuse la soumission si un champ requis manque", async () => {
    const patient = await createPatient(app);
    const clientUuid = randomUUID();

    const draftResponse = await request(app)
      .put(`/api/v1/consultations/draft/${clientUuid}`)
      .set("Authorization", patient.authHeader)
      .send({ motif: "Démangeaisons" });
    expect(draftResponse.status).toBe(200);

    const submitResponse = await request(app)
      .post(`/api/v1/consultations/${draftResponse.body.id}/submit`)
      .set("Authorization", patient.authHeader)
      .send();

    expect(submitResponse.status).toBe(422);
    expect(submitResponse.body.error.code).toBe("validation_error");
    expect(submitResponse.body.error.message).toContain("requis");
  });

  it("refuse la soumission tant que les photos requises manquent, même avec tous les autres champs remplis", async () => {
    const patient = await createPatient(app);
    const clientUuid = randomUUID();

    const draftResponse = await request(app)
      .put(`/api/v1/consultations/draft/${clientUuid}`)
      .set("Authorization", patient.authHeader)
      .send({
        nomComplet: "Aya Traoré",
        sexe: "F",
        age: 30,
        telephoneContact: "+22501020304",
        confirmationWhatsapp: false,
        motif: "Plaques",
        demangeaison: "non",
        photosQualiteConfirmee: true,
      });
    expect(draftResponse.status).toBe(200);

    const submitResponse = await request(app)
      .post(`/api/v1/consultations/${draftResponse.body.id}/submit`)
      .set("Authorization", patient.authHeader)
      .send();

    expect(submitResponse.status).toBe(422);
    expect(submitResponse.body.error.message).toContain("Photo");
  });

  it("rejeu du même clientUuid après coupure réseau : idempotent, ne duplique pas le dossier", async () => {
    const patient = await createPatient(app);
    const clientUuid = randomUUID();
    const payload = { motif: "Plaque sur l'avant-bras", age: 40 };

    const first = await request(app)
      .put(`/api/v1/consultations/draft/${clientUuid}`)
      .set("Authorization", patient.authHeader)
      .send(payload);
    const second = await request(app)
      .put(`/api/v1/consultations/draft/${clientUuid}`)
      .set("Authorization", patient.authHeader)
      .send(payload);

    expect(first.body.id).toBe(second.body.id);

    const count = await prisma.consultation.count({ where: { clientUuid } });
    expect(count).toBe(1);
  });

  it("empêche un patient d'accéder au dossier d'un autre patient", async () => {
    const owner = await createPatient(app);
    const intruder = await createPatient(app);

    const clientUuid = randomUUID();
    const draftResponse = await request(app)
      .put(`/api/v1/consultations/draft/${clientUuid}`)
      .set("Authorization", owner.authHeader)
      .send({ motif: "Confidentiel" });

    const response = await request(app)
      .get(`/api/v1/consultations/${draftResponse.body.id}`)
      .set("Authorization", intruder.authHeader)
      .send();

    expect(response.status).toBe(403);
  });

  it("refuse tout appel sans jeton Firebase valide", async () => {
    const response = await request(app).get("/api/v1/patients/me").set("Authorization", "Bearer un-jeton-invente").send();
    expect(response.status).toBe(401);
  });
});

describe("Disponibilités (référentiel)", () => {
  it("liste les créneaux actifs seedés", async () => {
    const patient = await createPatient(app);
    const response = await request(app).get("/api/v1/availabilities").set("Authorization", patient.authHeader).send();
    expect(response.status).toBe(200);
    expect(response.body.items.length).toBeGreaterThan(0);
    expect(response.body.items.every((a: { actif: boolean }) => a.actif)).toBe(true);
  });
});

beforeAll(async () => {
  // Garde-fou : si le référentiel n'a pas été seedé sur dermato_test, tous les
  // tests du fichier échoueraient un par un avec un message peu clair — un seul
  // message explicite ici est plus utile.
  const availabilities = await prisma.availability.count();
  if (availabilities === 0) {
    throw new Error(
      "Base de test vide — lancez `DATABASE_URL=<url de .env.test> npx tsx prisma/seed.ts` avant `npm test`.",
    );
  }
});

// Sanity check que authHeader() produit bien des jetons distincts par identité (sinon
// deux patients de test se retrouveraient authentifiés l'un comme l'autre).
describe("test/mocks.ts", () => {
  it("authHeader() est unique par appel", () => {
    const a = authHeader({ uid: "x" });
    const b = authHeader({ uid: "x" });
    expect(a).not.toBe(b);
  });
});
