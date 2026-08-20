import { Router } from "express";
import { Prisma } from "@prisma/client";
import { prisma } from "../../db/client.js";
import { authenticate } from "../../middleware/auth.js";
import { requirePatient } from "../../middleware/rbac.js";
import { validate } from "../../middleware/validate.js";
import { ConflictError, UnauthorizedError } from "../../lib/errors.js";
import { createPatientProfileSchema } from "./patients.schemas.js";

export const patientsRouter = Router();

// Appelé une seule fois juste après la création du compte Firebase (mobile), pour
// compléter le profil (nom, téléphone) que Firebase Auth seul ne stocke pas.
// Idempotent : si le profil existe déjà pour ce firebaseUid, on le renvoie tel quel
// plutôt que d'échouer — un retry réseau après signup ne doit pas bloquer l'usager.
patientsRouter.post("/me", authenticate, validate({ body: createPatientProfileSchema }), async (req, res, next) => {
  if (!req.auth) {
    next(new UnauthorizedError());
    return;
  }

  const existing = await prisma.patient.findUnique({ where: { firebaseUid: req.auth.firebaseUid } });
  if (existing) {
    res.status(200).json(existing);
    return;
  }

  try {
    const patient = await prisma.patient.create({
      data: { firebaseUid: req.auth.firebaseUid, ...req.body },
    });
    res.status(201).json(patient);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      next(new ConflictError("Cet email ou ce numéro de téléphone est déjà associé à un compte."));
      return;
    }
    next(error);
  }
});

patientsRouter.get("/me", authenticate, requirePatient, (req, res) => {
  res.json(req.auth!.patient);
});
