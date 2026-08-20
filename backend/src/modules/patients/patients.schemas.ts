import { z } from "zod";

export const createPatientProfileSchema = z.object({
  nom: z.string().trim().min(1).max(100),
  prenom: z.string().trim().min(1).max(100),
  telephone: z
    .string()
    .trim()
    .regex(/^\+?[0-9 ]{8,20}$/, "Numéro de téléphone invalide."),
  email: z.string().trim().toLowerCase().email(),
});

export type CreatePatientProfileInput = z.infer<typeof createPatientProfileSchema>;
