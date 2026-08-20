import { z } from "zod";
import { PhotoSlot } from "@prisma/client";

export const consultationIdParamSchema = z.object({ consultationId: z.string().uuid() });
export const photoIdParamsSchema = z.object({ consultationId: z.string().uuid(), photoId: z.string().uuid() });

// Le fichier lui-même (mimeType, taille) arrive en multipart, hors du corps JSON —
// vérifié par middleware/upload.ts (fileFilter + limits), pas ici. Ce schéma ne
// couvre plus que le champ texte qui accompagne le fichier.
export const uploadPhotoBodySchema = z.object({
  slot: z.nativeEnum(PhotoSlot),
});
