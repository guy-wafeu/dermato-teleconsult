import type { NextFunction, Request, Response } from "express";
import type { ZodSchema } from "zod";
import { ValidationError } from "../lib/errors.js";

interface Schemas {
  body?: ZodSchema;
  params?: ZodSchema;
  query?: ZodSchema;
}

// Valide et remplace req.body/params/query par la version parsée (types corrects,
// champs inconnus retirés). Toute donnée entrante passe par ici avant d'atteindre
// une couche métier — aucune route ne fait confiance au JSON reçu tel quel.
export function validate(schemas: Schemas) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (schemas.body) {
      const result = schemas.body.safeParse(req.body);
      if (!result.success) {
        next(new ValidationError("Corps de requête invalide.", result.error.flatten()));
        return;
      }
      req.body = result.data;
    }

    if (schemas.params) {
      const result = schemas.params.safeParse(req.params);
      if (!result.success) {
        next(new ValidationError("Paramètres d'URL invalides.", result.error.flatten()));
        return;
      }
      req.params = result.data as typeof req.params;
    }

    if (schemas.query) {
      const result = schemas.query.safeParse(req.query);
      if (!result.success) {
        next(new ValidationError("Paramètres de requête invalides.", result.error.flatten()));
        return;
      }
      req.query = result.data as typeof req.query;
    }

    next();
  };
}
