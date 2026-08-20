import { Router } from "express";
import { authenticate } from "../../middleware/auth.js";
import { requireAdmin } from "../../middleware/rbac.js";
import { validate } from "../../middleware/validate.js";
import { uploadPhotoMiddleware } from "../../middleware/upload.js";
import { ValidationError } from "../../lib/errors.js";
import {
  consentSchema,
  consultationDraftSchema,
  consultationIdParamsSchema,
  upsertDraftParamsSchema,
} from "../consultations/consultations.schemas.js";
import { getConsultation, recordConsent, submitConsultation } from "../consultations/consultations.service.js";
import { consultationIdParamSchema, photoIdParamsSchema, uploadPhotoBodySchema } from "../photos/photos.schemas.js";
import { deletePhoto, getPhotoStream, uploadPhoto } from "../photos/photos.service.js";
import { createOrUpdateWalkInDraft, resolveWalkInPatientId } from "./agent.service.js";

// Espace "agent terrain" : un admin authentifié saisit un dossier complet pour une
// personne qui n'a (et n'aura jamais) de compte Firebase propre — voir
// agent.service.ts#resolveWalkInPatientId pour le garde-fou qui empêche cet accès
// de toucher au dossier d'un vrai patient inscrit. Réutilise les mêmes services que
// le parcours patient (upsertDraft, photos, consentement, soumission) : le
// comportement métier (validations, machine à états) reste identique, seule
// l'identité de qui agit change.
export const agentConsultationsRouter = Router();

agentConsultationsRouter.use(authenticate, requireAdmin);

agentConsultationsRouter.put(
  "/draft/:clientUuid",
  validate({ params: upsertDraftParamsSchema, body: consultationDraftSchema }),
  async (req, res, next) => {
    try {
      const consultation = await createOrUpdateWalkInDraft(req.auth!.admin!.id, req.params.clientUuid, req.body);
      res.status(200).json(consultation);
    } catch (error) {
      next(error);
    }
  },
);

agentConsultationsRouter.get("/:id", validate({ params: consultationIdParamsSchema }), async (req, res, next) => {
  try {
    const patientId = await resolveWalkInPatientId(req.params.id);
    const consultation = await getConsultation(patientId, req.params.id);
    res.json(consultation);
  } catch (error) {
    next(error);
  }
});

agentConsultationsRouter.post(
  "/:id/consent",
  validate({ params: consultationIdParamsSchema, body: consentSchema }),
  async (req, res, next) => {
    try {
      const patientId = await resolveWalkInPatientId(req.params.id);
      const consent = await recordConsent(patientId, req.params.id, req.body.consentTextVersion, req.ip);
      res.status(201).json(consent);
    } catch (error) {
      next(error);
    }
  },
);

agentConsultationsRouter.post("/:id/submit", validate({ params: consultationIdParamsSchema }), async (req, res, next) => {
  try {
    const patientId = await resolveWalkInPatientId(req.params.id);
    const consultation = await submitConsultation(patientId, req.params.id);
    res.status(200).json(consultation);
  } catch (error) {
    next(error);
  }
});

// Photos : même mécanique que le parcours patient (voir photos.service.ts), juste
// avec l'identité walk-in résolue à la place de req.auth.patient.
agentConsultationsRouter.post(
  "/:consultationId/photos",
  uploadPhotoMiddleware,
  validate({ params: consultationIdParamSchema, body: uploadPhotoBodySchema }),
  async (req, res, next) => {
    try {
      if (!req.file) throw new ValidationError("Fichier photo manquant.");
      const patientId = await resolveWalkInPatientId(req.params.consultationId);
      const photo = await uploadPhoto(patientId, req.params.consultationId, {
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

agentConsultationsRouter.get(
  "/:consultationId/photos/:photoId/view",
  validate({ params: photoIdParamsSchema }),
  async (req, res, next) => {
    try {
      const patientId = await resolveWalkInPatientId(req.params.consultationId);
      const { stream, mimeType } = await getPhotoStream(patientId, req.params.consultationId, req.params.photoId);
      res.setHeader("Content-Type", mimeType);
      stream.on("error", next).pipe(res);
    } catch (error) {
      next(error);
    }
  },
);

agentConsultationsRouter.delete(
  "/:consultationId/photos/:photoId",
  validate({ params: photoIdParamsSchema }),
  async (req, res, next) => {
    try {
      const patientId = await resolveWalkInPatientId(req.params.consultationId);
      await deletePhoto(patientId, req.params.consultationId, req.params.photoId);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  },
);
