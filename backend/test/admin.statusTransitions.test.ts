import { describe, expect, it } from "vitest";
import { ConsultationStatus } from "@prisma/client";
import { ALLOWED_TRANSITIONS } from "../src/modules/admin/admin.service.js";

describe("Machine à états des consultations", () => {
  it("ne permet aucune transition admin depuis un brouillon", () => {
    expect(ALLOWED_TRANSITIONS[ConsultationStatus.draft]).toEqual([]);
  });

  it("les statuts terminaux (completed, cancelled) n'ont pas de transition sortante", () => {
    expect(ALLOWED_TRANSITIONS[ConsultationStatus.completed]).toEqual([]);
    expect(ALLOWED_TRANSITIONS[ConsultationStatus.cancelled]).toEqual([]);
  });

  it("pending ne peut aller que vers confirmed ou cancelled", () => {
    expect(ALLOWED_TRANSITIONS[ConsultationStatus.pending]).toEqual([
      ConsultationStatus.confirmed,
      ConsultationStatus.cancelled,
    ]);
  });

  it("un dossier confirmé ne peut pas revenir en attente", () => {
    expect(ALLOWED_TRANSITIONS[ConsultationStatus.confirmed]).not.toContain(ConsultationStatus.pending);
  });
});
