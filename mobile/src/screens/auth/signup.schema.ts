import { z } from "zod";

export const signUpSchema = z
  .object({
    nom: z.string().trim().min(1, "Nom requis"),
    prenom: z.string().trim().min(1, "Prénom requis"),
    telephone: z.string().trim().regex(/^\+?[0-9 ]{8,20}$/, "Numéro de téléphone invalide"),
    email: z.string().trim().toLowerCase().email("Email invalide"),
    password: z.string().min(6, "6 caractères minimum"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Les mots de passe ne correspondent pas",
    path: ["confirmPassword"],
  });

export type SignUpFormValues = z.infer<typeof signUpSchema>;
