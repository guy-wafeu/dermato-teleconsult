import type { NextFunction, Request, Response } from "express";
import { firebaseAuth } from "../lib/firebaseAdmin.js";
import { UnauthorizedError } from "../lib/errors.js";

// Vérifie le jeton Bearer sur toute route protégée. Ne suppose rien sur le rôle —
// requirePatient/requireAdmin (middleware/rbac.ts) chargent ensuite la bonne entité
// et décident si l'appelant a le droit d'être ici.
export async function authenticate(req: Request, _res: Response, next: NextFunction): Promise<void> {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    next(new UnauthorizedError("En-tête Authorization Bearer manquant."));
    return;
  }

  const token = header.slice("Bearer ".length);

  try {
    const decoded = await firebaseAuth.verifyIdToken(token);
    req.auth = { firebaseUid: decoded.uid, email: decoded.email };
    next();
  } catch {
    next(new UnauthorizedError("Session invalide ou expirée."));
  }
}
