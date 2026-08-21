import { apiRequest } from "./client";
import type {
  AdminConsultationDetail,
  AdminConsultationListItem,
  AdminProfile,
  ConsultationDraft,
  ConsultationStatus,
} from "../../types/api";

export function getMyAdminProfile() {
  return apiRequest<AdminProfile>("/admin/me");
}

// Un agent terrain crée des dossiers pour des tiers sous son propre compte
// (voir agent.service.ts) — `patient.nom/prenom/telephone` identifie donc le
// compte connecté, pas forcément la personne consultée. `nomComplet`/
// `telephoneContact` (saisis à l'étape 1 du questionnaire pour ce dossier
// précis) sont la source de vérité à afficher dès qu'ils existent.
export function consultationPatientName(item: Pick<AdminConsultationListItem, "nomComplet" | "patient">): string {
  return item.nomComplet?.trim() || `${item.patient.prenom} ${item.patient.nom}`;
}

export function consultationPatientPhone(item: Pick<AdminConsultationListItem, "telephoneContact" | "patient">): string {
  return item.telephoneContact?.trim() || item.patient.telephone;
}

export interface AdminStats {
  participants: number;
  pending: number;
  completed: number;
  today: number;
}

export function getAdminStats() {
  return apiRequest<AdminStats>("/admin/stats");
}

export function listAdminConsultations(params: { status?: ConsultationStatus; search?: string; limit?: number } = {}) {
  const query = new URLSearchParams();
  if (params.status) query.set("status", params.status);
  if (params.search) query.set("search", params.search);
  if (params.limit) query.set("limit", String(params.limit));
  const suffix = query.toString() ? `?${query.toString()}` : "";
  return apiRequest<{ items: AdminConsultationListItem[] }>(`/admin/consultations${suffix}`);
}

export function getAdminConsultationDetail(id: string) {
  return apiRequest<AdminConsultationDetail>(`/admin/consultations/${id}`);
}

// Correction de contenu (faute de frappe, information mal saisie sur le terrain) —
// possible quel que soit le statut du dossier, ne touche jamais au statut lui-même
// (voir changeConsultationStatus pour les transitions). N'envoyer que les champs
// réellement modifiés : `lesionTypes`/`availabilities`, si inclus, remplacent
// entièrement la sélection existante côté serveur.
export function updateConsultationFields(id: string, input: Partial<ConsultationDraft>) {
  return apiRequest<AdminConsultationDetail>(`/admin/consultations/${id}/fields`, { method: "PATCH", body: input });
}

// La photo n'est plus une URL signée temporaire (voir services/googleDrive.ts côté
// backend) mais un flux protégé par l'authentification normale — voir
// services/api/photos.ts#getPhotoViewRequest, réutilisé ici avec le bon chemin.
export function adminPhotoViewPath(consultationId: string, photoId: string): string {
  return `/admin/consultations/${consultationId}/photos/${photoId}/view`;
}

export interface ChangeStatusInput {
  newStatus: ConsultationStatus;
  reason?: string;
  availabilityId?: string;
  scheduledAt?: string;
  notes?: string;
}

export function changeConsultationStatus(id: string, input: ChangeStatusInput) {
  return apiRequest<AdminConsultationDetail>(`/admin/consultations/${id}/status`, { method: "PATCH", body: input });
}
