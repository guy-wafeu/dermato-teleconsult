import pino from "pino";
import { env } from "../config/env.js";

// Un seul logger structuré pour tout le service. Pas de PII (nom, email, contenu
// du dossier) dans les logs applicatifs — seulement des identifiants techniques.
export const logger = pino({
  level: env.isProduction ? "info" : "debug",
  redact: ["req.headers.authorization"],
});
