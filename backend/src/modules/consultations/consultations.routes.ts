import { Router } from "express";
import { authenticate } from "../../middleware/auth.js";
import { requirePatient } from "../../middleware/rbac.js";
import { validate } from "../../middleware/validate.js";
import { UnauthorizedError } from "../../lib/errors.js";
import {
  consentSchema,
  consultationDraftSchema,
  consultationIdParamsSchema,
  listConsultationsQuerySchema,
  upsertDraftParamsSchema,
} from "./consultations.schemas.js";
import { getConsultation, listConsultations, recordConsent, submitConsultation, upsertDraft } from "./consultations.service.js";

export const consultationsRouter = Router();

consultationsRouter.use(authenticate, requirePatient);

consultationsRouter.put(
  "/draft/:clientUuid",
  validate({ params: upsertDraftParamsSchema, body: consultationDraftSchema }),
  async (req, res, next) => {
    try {
      const consultation = await upsertDraft(req.auth!.patient!.id, req.params.clientUuid, req.body);
      res.status(200).json(consultation);
    } catch (error) {
      next(error);
    }
  },
);

consultationsRouter.get("/", validate({ query: listConsultationsQuerySchema }), async (req, res, next) => {
  try {
    const items = await listConsultations(req.auth!.patient!.id, req.query as never);
    res.json({ items });
  } catch (error) {
    next(error);
  }
});

consultationsRouter.get("/:id", validate({ params: consultationIdParamsSchema }), async (req, res, next) => {
  try {
    const consultation = await getConsultation(req.auth!.patient!.id, req.params.id);
    res.json(consultation);
  } catch (error) {
    next(error);
  }
});

consultationsRouter.post(
  "/:id/consent",
  validate({ params: consultationIdParamsSchema, body: consentSchema }),
  async (req, res, next) => {
    if (!req.auth) {
      next(new UnauthorizedError());
      return;
    }
    try {
      const consent = await recordConsent(req.auth.patient!.id, req.params.id, req.body.consentTextVersion, req.ip);
      res.status(201).json(consent);
    } catch (error) {
      next(error);
    }
  },
);

consultationsRouter.post("/:id/submit", validate({ params: consultationIdParamsSchema }), async (req, res, next) => {
  try {
    const consultation = await submitConsultation(req.auth!.patient!.id, req.params.id);
    res.status(200).json(consultation);
  } catch (error) {
    next(error);
  }
});
