import type { NextFunction, Request, Response } from "express";
import { prisma } from "../db/client.js";
import { ForbiddenError, UnauthorizedError } from "../lib/errors.js";

// Charge le profil patient correspondant au jeton vérifié. Un jeton Firebase valide
// sans profil patient (ex. inscription interrompue avant l'appel à /patients/me) ou
// un compte supprimé n'obtient PAS l'accès — c'est le rempart contre un patient A qui
// tenterait d'agir avant que son profil n'existe ou après suppression.
// try/catch explicite : Express 4 ne rattrape PAS automatiquement le rejet d'une
// promesse renvoyée par un middleware (contrairement à Express 5) — sans ça, un
// aléa Prisma ici (client périmé après migration, base momentanément injoignable...)
// devient une exception non gérée qui fait planter tout le process, pas juste
// cette requête. Vécu en pratique pendant le développement, d'où ce garde-fou.
export async function requirePatient(req: Request, _res: Response, next: NextFunction): Promise<void> {
  if (!req.auth) {
    next(new UnauthorizedError());
    return;
  }

  try {
    const patient = await prisma.patient.findUnique({ where: { firebaseUid: req.auth.firebaseUid } });

    if (!patient || patient.deletedAt) {
      next(new ForbiddenError("Aucun profil patient actif pour ce compte."));
      return;
    }

    req.auth.patient = patient;
    next();
  } catch (error) {
    next(error);
  }
}

// Même principe côté admin. isActive permet de révoquer un accès professionnel
// immédiatement sans supprimer la ligne (traçabilité conservée dans status_history).
// Accepte les deux rôles (admin ET agent terrain) — c'est le portail commun des
// routes agent-consultations (voir agent.routes.ts), volontairement permissif ici ;
// requireAdminRole ci-dessous restreint au rôle admin pour le reste de l'espace admin.
export async function requireAdmin(req: Request, _res: Response, next: NextFunction): Promise<void> {
  if (!req.auth) {
    next(new UnauthorizedError());
    return;
  }

  try {
    const admin = await prisma.adminUser.findUnique({ where: { firebaseUid: req.auth.firebaseUid } });

    if (!admin || !admin.isActive) {
      next(new ForbiddenError("Aucun accès administrateur actif pour ce compte."));
      return;
    }

    req.auth.admin = admin;
    next();
  } catch (error) {
    next(error);
  }
}

// À poser APRÈS requireAdmin (qui charge req.auth.admin) sur les routes réservées
// au vrai rôle "admin" (liste complète des dossiers, statistiques, changement de
// statut, correction de dossiers déjà soumis) — /admin/me reste accessible aux
// deux rôles, seule cette étape supplémentaire distingue admin d'agent terrain.
// Un compte "agent" valide mais avec le mauvais rôle obtient un 403, pas un 401.
export function requireAdminRole(req: Request, _res: Response, next: NextFunction): void {
  if (req.auth?.admin?.role !== "admin") {
    next(new ForbiddenError("Réservé aux comptes administrateur."));
    return;
  }
  next();
}
