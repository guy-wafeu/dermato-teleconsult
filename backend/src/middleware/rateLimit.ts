import rateLimit from "express-rate-limit";
import { env } from "../config/env.js";

// Limite en mémoire, par instance Cloud Run. Utile contre un client isolé qui
// s'emballe, mais N'EST PAS une protection fiable contre un abus distribué une fois
// que le service tourne sur plusieurs instances (chacune a son propre compteur) —
// voir la note "Arbitrage technique" de la Phase 1. Cloud Armor en périmètre et,
// si le volume le justifie, un compteur partagé (Memorystore) sont les évolutions.
export const apiRateLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MINUTES * 60 * 1000,
  max: env.RATE_LIMIT_MAX_REQUESTS,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: { code: "rate_limited", message: "Trop de requêtes, réessayez dans quelques instants." } },
});
