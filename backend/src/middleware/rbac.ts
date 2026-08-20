import type { NextFunction, Request, Response } from "express";
import { prisma } from "../db/client.js";
import { ForbiddenError, UnauthorizedError } from "../lib/errors.js";

// Charge le profil patient correspondant au jeton vérifié. Un jeton Firebase valide
// sans profil patient (ex. inscription interrompue avant l'appel à /patients/me) ou
// un compte supprimé n'obtient PAS l'accès — c'est le rempart contre un patient A qui
// tenterait d'agir avant que son profil n'existe ou après suppression.
export async function requirePatient(req: Request, _res: Response, next: NextFunction): Promise<void> {
  if (!req.auth) {
    next(new UnauthorizedError());
    return;
  }

  const patient = await prisma.patient.findUnique({ where: { firebaseUid: req.auth.firebaseUid } });

  if (!patient || patient.deletedAt) {
    next(new ForbiddenError("Aucun profil patient actif pour ce compte."));
    return;
  }

  req.auth.patient = patient;
  next();
}

// Même principe côté admin. isActive permet de révoquer un accès professionnel
// immédiatement sans supprimer la ligne (traçabilité conservée dans status_history).
export async function requireAdmin(req: Request, _res: Response, next: NextFunction): Promise<void> {
  if (!req.auth) {
    next(new UnauthorizedError());
    return;
  }

  const admin = await prisma.adminUser.findUnique({ where: { firebaseUid: req.auth.firebaseUid } });

  if (!admin || !admin.isActive) {
    next(new ForbiddenError("Aucun accès administrateur actif pour ce compte."));
    return;
  }

  req.auth.admin = admin;
  next();
}
