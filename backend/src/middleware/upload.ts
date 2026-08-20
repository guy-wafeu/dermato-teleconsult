import multer from "multer";
import type { NextFunction, Request, Response } from "express";
import { ALLOWED_PHOTO_MIME_TYPES, MAX_PHOTO_SIZE_BYTES } from "../services/googleDrive.js";
import { ValidationError } from "../lib/errors.js";

// Reçoit le fichier en mémoire (pas sur disque : la taille max de 25 Mo reste
// raisonnable à garder en RAM le temps de le retransmettre à Google Drive, voir
// services/googleDrive.ts#uploadPhotoToDrive) puis le retransmet — jamais écrit
// tel quel sur le disque du serveur.
const multerSingle = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_PHOTO_SIZE_BYTES },
  fileFilter: (_req, file, cb) => {
    if (!(file.mimetype in ALLOWED_PHOTO_MIME_TYPES)) {
      cb(new Error("unsupported_mime_type"));
      return;
    }
    cb(null, true);
  },
}).single("file");

// multer appelle son callback avec une erreur au lieu de la propager comme les
// autres middlewares — on la traduit ici en ValidationError pour que
// errorHandler.ts la traite comme le reste des 422, jamais comme une 500 brute.
export function uploadPhotoMiddleware(req: Request, res: Response, next: NextFunction): void {
  multerSingle(req, res, (err: unknown) => {
    if (!err) {
      next();
      return;
    }
    if (err instanceof Error && err.message === "unsupported_mime_type") {
      next(new ValidationError("Format d'image non supporté (jpeg, png, heic, webp uniquement)."));
      return;
    }
    if (err instanceof multer.MulterError && err.code === "LIMIT_FILE_SIZE") {
      next(new ValidationError("Fichier trop volumineux (25 Mo maximum)."));
      return;
    }
    next(new ValidationError("Fichier photo invalide."));
  });
}
