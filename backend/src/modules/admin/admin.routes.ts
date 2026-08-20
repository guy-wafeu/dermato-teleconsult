import { Router } from "express";
import { authenticate } from "../../middleware/auth.js";
import { requireAdmin } from "../../middleware/rbac.js";
import { validate } from "../../middleware/validate.js";
import {
  changeStatusSchema,
  consultationIdParamsSchema,
  listAdminConsultationsQuerySchema,
  photoIdParamsSchema,
} from "./admin.schemas.js";
import { consultationDraftSchema } from "../consultations/consultations.schemas.js";
import {
  changeConsultationStatus,
  getAdminConsultationDetail,
  getAdminPhotoStream,
  getAdminStats,
  listAdminConsultations,
  updateConsultationFields,
} from "./admin.service.js";

export const adminRouter = Router();

adminRouter.use(authenticate, requireAdmin);

adminRouter.get("/me", (req, res) => {
  res.json(req.auth!.admin);
});

adminRouter.get("/stats", async (req, res, next) => {
  try {
    res.json(await getAdminStats());
  } catch (error) {
    next(error);
  }
});

adminRouter.get("/consultations", validate({ query: listAdminConsultationsQuerySchema }), async (req, res, next) => {
  try {
    const items = await listAdminConsultations(req.query as never);
    res.json({ items });
  } catch (error) {
    next(error);
  }
});

adminRouter.get("/consultations/:id", validate({ params: consultationIdParamsSchema }), async (req, res, next) => {
  try {
    const consultation = await getAdminConsultationDetail(req.params.id);
    res.json(consultation);
  } catch (error) {
    next(error);
  }
});

adminRouter.get(
  "/consultations/:id/photos/:photoId/view",
  validate({ params: photoIdParamsSchema }),
  async (req, res, next) => {
    try {
      const { stream, mimeType } = await getAdminPhotoStream(req.params.id, req.params.photoId);
      res.setHeader("Content-Type", mimeType);
      stream.on("error", next).pipe(res);
    } catch (error) {
      next(error);
    }
  },
);

adminRouter.patch(
  "/consultations/:id/fields",
  validate({ params: consultationIdParamsSchema, body: consultationDraftSchema }),
  async (req, res, next) => {
    try {
      const consultation = await updateConsultationFields(req.params.id, req.body);
      res.json(consultation);
    } catch (error) {
      next(error);
    }
  },
);

adminRouter.patch(
  "/consultations/:id/status",
  validate({ params: consultationIdParamsSchema, body: changeStatusSchema }),
  async (req, res, next) => {
    try {
      const consultation = await changeConsultationStatus(req.auth!.admin!.id, req.params.id, req.body);
      res.json(consultation);
    } catch (error) {
      next(error);
    }
  },
);
