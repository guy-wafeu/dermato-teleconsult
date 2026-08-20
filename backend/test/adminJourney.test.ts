import { describe, expect, it } from "vitest";
import request from "supertest";
import { createApp } from "../src/app.js";
import { prisma } from "../src/db/client.js";
import { createAdmin, createPatient, createSubmittedConsultation } from "./factories.js";

// Parcours agent terrain / admin : lister les dossiers en attente, ouvrir un dossier,
// le faire avancer dans la machine à états (pending -> confirmed -> seen ->
// completed), en repassant par les vraies routes HTTP + la vraie base de test.
const app = createApp();

describe("Parcours administrateur", () => {
  it("liste, consulte et fait progresser un dossier jusqu'à terminé", async () => {
    const admin = await createAdmin();
    const patient = await createPatient(app);
    const { consultationId, availabilityId } = await createSubmittedConsultation(app, patient);

    const listResponse = await request(app)
      .get("/api/v1/admin/consultations")
      .query({ status: "pending" })
      .set("Authorization", admin.authHeader)
      .send();
    expect(listResponse.status).toBe(200);
    expect(listResponse.body.items.some((c: { id: string }) => c.id === consultationId)).toBe(true);

    const detailResponse = await request(app)
      .get(`/api/v1/admin/consultations/${consultationId}`)
      .set("Authorization", admin.authHeader)
      .send();
    expect(detailResponse.status).toBe(200);
    expect(detailResponse.body.patient.id).toBe(patient.patientId);
    expect(detailResponse.body.photos).toHaveLength(2);

    const photoId = detailResponse.body.photos[0].id as string;
    const photoViewResponse = await request(app)
      .get(`/api/v1/admin/consultations/${consultationId}/photos/${photoId}/view`)
      .set("Authorization", admin.authHeader)
      .send();
    expect(photoViewResponse.status).toBe(200);
    expect(photoViewResponse.headers["content-type"]).toMatch(/^image\//);

    const confirmResponse = await request(app)
      .patch(`/api/v1/admin/consultations/${consultationId}/status`)
      .set("Authorization", admin.authHeader)
      .send({ newStatus: "confirmed", availabilityId });
    expect(confirmResponse.status).toBe(200);
    expect(confirmResponse.body.status).toBe("confirmed");
    expect(confirmResponse.body.appointment.availability.id).toBe(availabilityId);

    const seenResponse = await request(app)
      .patch(`/api/v1/admin/consultations/${consultationId}/status`)
      .set("Authorization", admin.authHeader)
      .send({ newStatus: "seen" });
    expect(seenResponse.status).toBe(200);

    const completedResponse = await request(app)
      .patch(`/api/v1/admin/consultations/${consultationId}/status`)
      .set("Authorization", admin.authHeader)
      .send({ newStatus: "completed" });
    expect(completedResponse.status).toBe(200);
    expect(completedResponse.body.status).toBe("completed");

    const history = await prisma.statusHistory.findMany({
      where: { consultationId },
      orderBy: { createdAt: "asc" },
    });
    expect(history.map((h) => h.newStatus)).toEqual(["pending", "confirmed", "seen", "completed"]);
    expect(history.slice(1).every((h) => h.changedByType === "admin" && h.changedByAdminId === admin.adminId)).toBe(true);
  });

  it("refuse une transition qui saute des étapes (pending -> completed)", async () => {
    const admin = await createAdmin();
    const patient = await createPatient(app);
    const { consultationId } = await createSubmittedConsultation(app, patient);

    const response = await request(app)
      .patch(`/api/v1/admin/consultations/${consultationId}/status`)
      .set("Authorization", admin.authHeader)
      .send({ newStatus: "completed" });

    expect(response.status).toBe(409);
    expect(response.body.error.code).toBe("conflict");
  });

  it("exige un créneau pour confirmer un dossier", async () => {
    const admin = await createAdmin();
    const patient = await createPatient(app);
    const { consultationId } = await createSubmittedConsultation(app, patient);

    const response = await request(app)
      .patch(`/api/v1/admin/consultations/${consultationId}/status`)
      .set("Authorization", admin.authHeader)
      .send({ newStatus: "confirmed" });

    expect(response.status).toBe(422);
  });

  it("interdit l'accès aux routes admin à un compte patient", async () => {
    const patient = await createPatient(app);
    const response = await request(app)
      .get("/api/v1/admin/consultations")
      .set("Authorization", patient.authHeader)
      .send();
    expect(response.status).toBe(403);
  });

  it("annule un dossier avec un motif, journalisé dans l'historique", async () => {
    const admin = await createAdmin();
    const patient = await createPatient(app);
    const { consultationId } = await createSubmittedConsultation(app, patient);

    const response = await request(app)
      .patch(`/api/v1/admin/consultations/${consultationId}/status`)
      .set("Authorization", admin.authHeader)
      .send({ newStatus: "cancelled", reason: "Doublon avec un autre dossier" });

    expect(response.status).toBe(200);
    expect(response.body.status).toBe("cancelled");

    const lastHistory = await prisma.statusHistory.findFirst({
      where: { consultationId },
      orderBy: { createdAt: "desc" },
    });
    expect(lastHistory?.reason).toBe("Doublon avec un autre dossier");
  });
});
