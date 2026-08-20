import { Router } from "express";
import { authenticate } from "../../middleware/auth.js";
import { requirePatient } from "../../middleware/rbac.js";
import { validate } from "../../middleware/validate.js";
import { uploadPhotoMiddleware } from "../../middleware/upload.js";
import { ValidationError } from "../../lib/errors.js";
import { consultationIdParamSchema, photoIdParamsSchema, uploadPhotoBodySchema } from "./photos.schemas.js";
import { deletePhoto, getPhotoStream, uploadPhoto } from "./photos.service.js";

// Monté sous /api/v1/consultations/:consultationId/photos — voir app.ts.
export const photosRouter = Router({ mergeParams: true });

photosRouter.use(authenticate, requirePatient);

photosRouter.post(
  "/",
  uploadPhotoMiddleware,
  validate({ params: consultationIdParamSchema, body: uploadPhotoBodySchema }),
  async (req, res, next) => {
    try {
      if (!req.file) throw new ValidationError("Fichier photo manquant.");
      const photo = await uploadPhoto(req.auth!.patient!.id, req.params.consultationId, {
        slot: req.body.slot,
        mimeType: req.file.mimetype,
        sizeBytes: req.file.size,
        buffer: req.file.buffer,
      });
      res.status(201).json(photo);
    } catch (error) {
      next(error);
    }
  },
);

photosRouter.get("/:photoId/view", validate({ params: photoIdParamsSchema }), async (req, res, next) => {
  try {
    const { stream, mimeType } = await getPhotoStream(req.auth!.patient!.id, req.params.consultationId, req.params.photoId);
    res.setHeader("Content-Type", mimeType);
    stream.on("error", next).pipe(res);
  } catch (error) {
    next(error);
  }
});

photosRouter.delete("/:photoId", validate({ params: photoIdParamsSchema }), async (req, res, next) => {
  try {
    await deletePhoto(req.auth!.patient!.id, req.params.consultationId, req.params.photoId);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});
