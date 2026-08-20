import type { AdminUser, Patient } from "@prisma/client";

// Étend Request avec le contexte d'authentification posé par les middlewares.
// `firebaseUid`/`email` sont posés par `authenticate` ; `patient`/`admin` sont posés
// respectivement par `requirePatient`/`requireAdmin` une fois le rôle vérifié en base.
declare global {
  namespace Express {
    interface Request {
      auth?: {
        firebaseUid: string;
        email?: string;
        patient?: Patient;
        admin?: AdminUser;
      };
    }
  }
}

export {};
