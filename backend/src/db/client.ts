import { PrismaClient } from "@prisma/client";
import { env } from "../config/env.js";

// Instance unique réutilisée entre les requêtes (Cloud Run réutilise l'instance
// entre invocations tant qu'elle reste chaude — recréer le client à chaque requête
// épuiserait le pool de connexions Cloud SQL).
export const prisma = new PrismaClient({
  log: env.isProduction ? ["warn", "error"] : ["warn", "error"],
});
