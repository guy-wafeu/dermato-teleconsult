import { env } from "../../config/env";
import { getIdToken } from "../auth/firebaseAuth";
import type { ApiErrorBody } from "../../types/api";

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  authenticated?: boolean;
}

// Point d'entrée unique vers l'API : jamais d'URL en dur ailleurs dans l'app, jamais
// un message d'erreur brut du serveur affiché directement à l'utilisateur (voir
// mapApiErrorToUserMessage dans chaque écran, qui décide du texte affiché).
export async function apiRequest<TResponse>(path: string, options: RequestOptions = {}): Promise<TResponse> {
  const { method = "GET", body, authenticated = true } = options;

  const headers: Record<string, string> = { "Content-Type": "application/json" };

  if (authenticated) {
    const token = await getIdToken();
    if (!token) {
      throw new ApiError(401, "unauthenticated", "Session expirée, reconnectez-vous.");
    }
    headers.Authorization = `Bearer ${token}`;
  }

  let response: Response;
  try {
    response = await fetch(`${env.apiBaseUrl}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError(0, "network_error", "Impossible de joindre le serveur. Vérifiez votre connexion.");
  }

  if (response.status === 204) {
    return undefined as TResponse;
  }

  const json = (await response.json().catch(() => null)) as TResponse | ApiErrorBody | null;

  if (!response.ok) {
    const errorBody = json as ApiErrorBody | null;
    throw new ApiError(
      response.status,
      errorBody?.error?.code ?? "unknown_error",
      errorBody?.error?.message ?? "Une erreur est survenue.",
    );
  }

  return json as TResponse;
}

// Pour l'envoi de fichiers (photos) : le corps est un FormData, jamais du JSON —
// on laisse fetch poser lui-même l'en-tête Content-Type (avec sa boundary
// multipart), le fixer à la main casserait le parsing côté serveur (voir
// middleware/upload.ts).
export async function apiUpload<TResponse>(path: string, formData: FormData): Promise<TResponse> {
  const token = await getIdToken();
  if (!token) {
    throw new ApiError(401, "unauthenticated", "Session expirée, reconnectez-vous.");
  }

  let response: Response;
  try {
    response = await fetch(`${env.apiBaseUrl}${path}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });
  } catch {
    throw new ApiError(0, "network_error", "Impossible de joindre le serveur. Vérifiez votre connexion.");
  }

  const json = (await response.json().catch(() => null)) as TResponse | ApiErrorBody | null;

  if (!response.ok) {
    const errorBody = json as ApiErrorBody | null;
    throw new ApiError(
      response.status,
      errorBody?.error?.code ?? "unknown_error",
      errorBody?.error?.message ?? "Une erreur est survenue.",
    );
  }

  return json as TResponse;
}
