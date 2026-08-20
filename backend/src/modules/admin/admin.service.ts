import { ConsultationStatus } from "@prisma/client";
import { prisma } from "../../db/client.js";
import { ConflictError, NotFoundError, ValidationError } from "../../lib/errors.js";
import { streamPhotoFromDrive } from "../../services/googleDrive.js";
import { updateConsultationStatusInSheet } from "../../services/googleSheets.js";
import type { ConsultationDraftInput } from "../consultations/consultations.schemas.js";

const detailInclude = {
  patient: { select: { id: true, nom: true, prenom: true, telephone: true, email: true } },
  lesionTypes: { include: { lesionType: true } },
  availabilities: { include: { availability: true } },
  photos: { where: { deletedAt: null } },
  consent: true,
  appointment: { include: { availability: true, createdByAdmin: { select: { nom: true, prenom: true } } } },
  statusHistory: { orderBy: { createdAt: "desc" as const } },
} as const;

export async function listAdminConsultations(options: {
  status?: ConsultationStatus;
  search?: string;
  cursor?: string;
  limit: number;
}) {
  return prisma.consultation.findMany({
    where: {
      status: options.status,
      ...(options.search
        ? {
            patient: {
              OR: [
                { nom: { contains: options.search, mode: "insensitive" } },
                { prenom: { contains: options.search, mode: "insensitive" } },
                { telephone: { contains: options.search } },
              ],
            },
          }
        : {}),
    },
    include: { patient: { select: { nom: true, prenom: true, telephone: true } } },
    orderBy: { submittedAt: "desc" },
    take: options.limit,
    ...(options.cursor ? { skip: 1, cursor: { id: options.cursor } } : {}),
  });
}

// Compteurs pour l'accueil admin (participants inscrits, dossiers en attente/
// traités, consultations du jour) — des `count()` dédiés plutôt qu'un calcul côté
// mobile sur listAdminConsultations, dont la pagination (max 100) fausserait les
// totaux dès que la clinique dépasse une page de dossiers.
export async function getAdminStats() {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const [participants, pending, completed, today] = await Promise.all([
    prisma.patient.count(),
    prisma.consultation.count({ where: { status: "pending" } }),
    prisma.consultation.count({ where: { status: "completed" } }),
    prisma.consultation.count({ where: { createdAt: { gte: startOfToday } } }),
  ]);

  return { participants, pending, completed, today };
}

export async function getAdminConsultationDetail(id: string) {
  const consultation = await prisma.consultation.findUnique({ where: { id }, include: detailInclude });
  if (!consultation) throw new NotFoundError("Consultation introuvable.");
  return consultation;
}

// Correction d'un dossier déjà soumis (ex. faute de frappe repérée parmi 200
// dossiers saisis sur le terrain) — volontairement possible quel que soit le
// statut, contrairement à upsertDraft (patient) qui refuse toute modification
// après soumission. Ne touche jamais au statut ni à l'historique : c'est une
// correction de contenu, pas une transition métier (voir changeConsultationStatus
// pour ça).
export async function updateConsultationFields(consultationId: string, input: ConsultationDraftInput) {
  const existing = await prisma.consultation.findUnique({ where: { id: consultationId } });
  if (!existing) throw new NotFoundError("Consultation introuvable.");

  const { lesionTypes, availabilities, ...scalarFields } = input;

  if (lesionTypes?.length) {
    const validCodes = await prisma.lesionType.findMany({
      where: { code: { in: lesionTypes.map((l) => l.code) } },
      select: { code: true },
    });
    const validCodeSet = new Set(validCodes.map((c) => c.code));
    const unknown = lesionTypes.filter((l) => !validCodeSet.has(l.code));
    if (unknown.length > 0) {
      throw new ValidationError(`Type(s) de lésion inconnu(s) : ${unknown.map((l) => l.code).join(", ")}`);
    }
  }

  return prisma.$transaction(async (tx) => {
    await tx.consultation.update({ where: { id: consultationId }, data: scalarFields });

    if (lesionTypes) {
      await tx.consultationLesionType.deleteMany({ where: { consultationId } });
      if (lesionTypes.length > 0) {
        await tx.consultationLesionType.createMany({
          data: lesionTypes.map((l) => ({ consultationId, lesionCode: l.code, precision: l.precision })),
        });
      }
    }

    if (availabilities) {
      await tx.consultationAvailability.deleteMany({ where: { consultationId } });
      if (availabilities.length > 0) {
        await tx.consultationAvailability.createMany({
          data: availabilities.map((a) => ({
            consultationId,
            availabilityId: a.availabilityId,
            autrePrecision: a.autrePrecision,
          })),
        });
      }
    }

    // Si le nom/téléphone/email du dossier a été corrigé, on répercute sur la
    // fiche Patient — sinon la liste admin (qui lit patient.nom/prenom/telephone)
    // resterait incohérente avec le dossier qu'on vient de corriger.
    if (scalarFields.nomComplet || scalarFields.telephoneContact || scalarFields.emailContact) {
      const consultation = await tx.consultation.findUniqueOrThrow({ where: { id: consultationId } });
      const patch: { nom?: string; prenom?: string; telephone?: string; email?: string } = {};
      if (scalarFields.nomComplet) {
        const trimmed = scalarFields.nomComplet.trim();
        const spaceIndex = trimmed.indexOf(" ");
        patch.prenom = spaceIndex === -1 ? trimmed : trimmed.slice(0, spaceIndex);
        patch.nom = spaceIndex === -1 ? "" : trimmed.slice(spaceIndex + 1).trim();
      }
      if (scalarFields.telephoneContact) patch.telephone = scalarFields.telephoneContact;
      if (scalarFields.emailContact) patch.email = scalarFields.emailContact;
      await tx.patient.update({ where: { id: consultation.patientId }, data: patch });
    }

    return tx.consultation.findUniqueOrThrow({ where: { id: consultationId }, include: detailInclude });
  });
}

export async function getAdminPhotoStream(consultationId: string, photoId: string) {
  const photo = await prisma.photo.findUnique({ where: { id: photoId } });
  if (!photo || photo.consultationId !== consultationId || photo.deletedAt || photo.status !== "uploaded") {
    throw new NotFoundError("Photo introuvable.");
  }
  return streamPhotoFromDrive(photo.driveFileId);
}

// Machine à états explicite : toute transition non listée est refusée. Ça empêche
// par exemple de faire passer un dossier "terminé" directement à "confirmée", ou de
// réutiliser une route de statut pour contourner le flux métier.
export const ALLOWED_TRANSITIONS: Record<ConsultationStatus, ConsultationStatus[]> = {
  draft: [],
  pending: [ConsultationStatus.confirmed, ConsultationStatus.cancelled],
  confirmed: [ConsultationStatus.seen, ConsultationStatus.cancelled],
  seen: [ConsultationStatus.completed, ConsultationStatus.cancelled],
  completed: [],
  cancelled: [],
};

export async function changeConsultationStatus(
  adminId: string,
  consultationId: string,
  input: { newStatus: ConsultationStatus; reason?: string; availabilityId?: string; scheduledAt?: Date; notes?: string },
) {
  const consultation = await prisma.consultation.findUnique({ where: { id: consultationId } });
  if (!consultation) throw new NotFoundError("Consultation introuvable.");

  const allowed = ALLOWED_TRANSITIONS[consultation.status];
  if (!allowed.includes(input.newStatus)) {
    throw new ConflictError(
      `Transition "${consultation.status}" -> "${input.newStatus}" non autorisée.`,
    );
  }

  if (input.newStatus === ConsultationStatus.confirmed && !input.availabilityId && !input.scheduledAt) {
    throw new ValidationError("Indiquez un créneau (availabilityId ou scheduledAt) pour confirmer la consultation.");
  }

  const updated = await prisma.$transaction(async (tx) => {
    await tx.consultation.update({
      where: { id: consultationId },
      data: { status: input.newStatus },
    });

    await tx.statusHistory.create({
      data: {
        consultationId,
        previousStatus: consultation.status,
        newStatus: input.newStatus,
        changedByType: "admin",
        changedByAdminId: adminId,
        reason: input.reason,
      },
    });

    if (input.newStatus === ConsultationStatus.confirmed) {
      await tx.appointment.upsert({
        where: { consultationId },
        create: {
          consultationId,
          availabilityId: input.availabilityId,
          scheduledAt: input.scheduledAt,
          notes: input.notes,
          createdByAdminId: adminId,
        },
        update: {
          availabilityId: input.availabilityId,
          scheduledAt: input.scheduledAt,
          notes: input.notes,
          createdByAdminId: adminId,
        },
      });
    }

    // Relu après toutes les mutations (statut + rendez-vous) : renvoyer l'objet
    // capturé avant l'upsert de l'appointment ferait apparaître "appointment: null"
    // dans la réponse juste après une confirmation, alors que la ligne existe déjà
    // en base — c'est exactement le genre d'incohérence qu'un test bout en bout
    // attrape et qu'un test unitaire mocké aurait laissé passer.
    return tx.consultation.findUniqueOrThrow({ where: { id: consultationId }, include: detailInclude });
  });

  // Hors transaction, volontairement (voir notifyConsultationSubmitted dans
  // consultations.service.ts pour la même logique) : un aléa Google Sheets ne
  // doit jamais faire échouer un changement de statut déjà acquis en base.
  await updateConsultationStatusInSheet(consultationId, input.newStatus);

  return updated;
}
