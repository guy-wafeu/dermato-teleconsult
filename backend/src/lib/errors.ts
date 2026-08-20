// Erreurs métier avec un statut HTTP et un message déjà sûr à renvoyer au client.
// Toute erreur qui n'est PAS une AppError est traitée comme interne par errorHandler
// et ne fuite jamais son message brut vers le client (voir middleware/errorHandler.ts).
export class AppError extends Error {
  readonly statusCode: number;
  readonly code: string;

  constructor(statusCode: number, code: string, message: string) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.code = code;
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Authentification requise ou invalide.") {
    super(401, "unauthorized", message);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "Accès refusé à cette ressource.") {
    super(403, "forbidden", message);
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Ressource introuvable.") {
    super(404, "not_found", message);
  }
}

export class ConflictError extends AppError {
  constructor(message = "Cette opération entre en conflit avec l'état actuel de la ressource.") {
    super(409, "conflict", message);
  }
}

export class ValidationError extends AppError {
  readonly details: unknown;

  constructor(message: string, details?: unknown) {
    super(422, "validation_error", message);
    this.details = details;
  }
}
