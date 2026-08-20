import { Router } from "express";
import { prisma } from "../../db/client.js";
import { authenticate } from "../../middleware/auth.js";

export const lesionTypesRouter = Router();

// Référentiel des aspects de lésion (étape 5 du questionnaire). Lecture seule côté
// app — alimenté par prisma/seed.ts, modifiable en base sans redéploiement mobile.
lesionTypesRouter.get("/", authenticate, async (_req, res) => {
  const lesionTypes = await prisma.lesionType.findMany({ orderBy: { displayOrder: "asc" } });
  res.json({ items: lesionTypes });
});
