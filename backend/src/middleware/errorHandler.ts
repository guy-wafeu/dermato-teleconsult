import type { NextFunction, Request, Response } from "express";
import { AppError, ValidationError } from "../lib/errors.js";
import { logger } from "../lib/logger.js";

// Point d'arrivée unique pour toute erreur non rattrapée. Une AppError connaît déjà
// son statut et un message sûr pour le patient ; toute autre erreur (bug, panne
// Prisma/GCS/Firebase) reste opaque côté client et part en détail dans les logs.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof AppError) {
    const body: Record<string, unknown> = { error: { code: err.code, message: err.message } };
    if (err instanceof ValidationError) {
      body.error = { ...(body.error as object), details: err.details };
    }
    if (err.statusCode >= 500) {
      logger.error({ err, path: req.path }, "Erreur applicative");
    }
    res.status(err.statusCode).json(body);
    return;
  }

  logger.error({ err, path: req.path }, "Erreur interne non gérée");
  res.status(500).json({ error: { code: "internal_error", message: "Une erreur interne est survenue." } });
}

export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({ error: { code: "not_found", message: "Route introuvable." } });
}
