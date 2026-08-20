import AfricasTalking from "africastalking";
import { env } from "../config/env.js";
import { logger } from "../lib/logger.js";

// Client null tant qu'Africa's Talking n'est pas configuré (voir config/env.ts) :
// les environnements sans compte (dev local, CI) continuent de fonctionner, l'envoi
// de SMS devient juste un no-op journalisé plutôt qu'un crash au démarrage.
const client =
  env.AT_API_KEY && env.AT_USERNAME ? AfricasTalking({ apiKey: env.AT_API_KEY, username: env.AT_USERNAME }) : null;

// Africa's Talking exige le format E.164 (+ indicatif, aucun espace) — les numéros
// saisis par les patients passent par le formulaire au format libre validé par un
// regex plus permissif (voir patients.schemas.ts), donc jamais garanti déjà propre ici.
function toE164(rawPhone: string): string {
  return rawPhone.replace(/[^\d+]/g, "");
}

// Ne lève jamais : un échec d'envoi SMS ne doit pas transformer une opération
// métier réussie (ex. soumission d'une consultation, déjà en base) en erreur 500
// côté patient. L'échec est journalisé pour être visible côté ops.
export async function sendSms(toPhone: string, body: string): Promise<void> {
  if (!client) {
    logger.warn({ toPhone }, "Africa's Talking non configuré — SMS ignoré.");
    return;
  }

  try {
    await client.SMS.send({
      to: toE164(toPhone),
      message: body,
      ...(env.AT_SENDER_ID ? { from: env.AT_SENDER_ID } : {}),
    });
  } catch (err) {
    logger.error({ err, toPhone }, "Échec d'envoi SMS");
  }
}
