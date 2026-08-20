import { Router } from "express";
import { prisma } from "../../db/client.js";
import { authenticate } from "../../middleware/auth.js";

export const availabilitiesRouter = Router();

// Référentiel des créneaux récurrents. Lecture seule côté app — les créneaux sont
// gérés en base (seed ou futur écran admin), jamais créés depuis le mobile.
availabilitiesRouter.get("/", authenticate, async (_req, res) => {
  const availabilities = await prisma.availability.findMany({
    where: { actif: true },
    orderBy: { displayOrder: "asc" },
  });
  res.json({ items: availabilities });
});
