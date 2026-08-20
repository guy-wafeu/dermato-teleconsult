import { apiRequest, apiUpload } from "./client";
import { env } from "../../config/env";
import { getIdToken } from "../auth/firebaseAuth";
import type { Photo, PhotoSlot } from "../../types/api";

// Upload en une seule étape (le fichier part directement vers le backend, qui le
// retransmet à Google Drive — voir backend/src/services/googleDrive.ts). Remplace
// l'ancien flux à deux temps (URL signée GCS + confirmation) : il n'y a plus rien
// à confirmer, l'appel réussit ou échoue.
export function uploadPhoto(
  consultationId: string,
  input: { slot: PhotoSlot; localUri: string; mimeType: string; fileName?: string },
): Promise<Photo> {
  const formData = new FormData();
  formData.append("slot", input.slot);
  // React Native accepte cette forme d'objet pour un champ fichier dans un
  // FormData — pas de lecture manuelle des octets côté app, `fetch` s'en charge.
  formData.append("file", {
    uri: input.localUri,
    type: input.mimeType,
    name: input.fileName ?? `${input.slot}.${input.mimeType.split("/")[1] ?? "jpg"}`,
  } as unknown as Blob);

  return apiUpload<Photo>(`/consultations/${consultationId}/photos`, formData);
}

export function deletePhoto(consultationId: string, photoId: string) {
  return apiRequest<void>(`/consultations/${consultationId}/photos/${photoId}`, { method: "DELETE" });
}

// La photo n'est jamais publique — l'écran qui l'affiche (voir
// AdminConsultationDetailScreen#PhotoRow) doit joindre ce jeton comme en-tête
// Authorization sur l'<Image>, pas juste pointer vers l'URL brute.
export async function getPhotoViewRequest(
  path: string,
): Promise<{ uri: string; headers: Record<string, string> }> {
  const token = await getIdToken();
  return { uri: `${env.apiBaseUrl}${path}`, headers: token ? { Authorization: `Bearer ${token}` } : {} };
}
