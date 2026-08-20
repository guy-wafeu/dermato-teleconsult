import { apiRequest } from "./client";

export interface LesionTypeOption {
  code: string;
  labelFr: string;
  description: string | null;
  displayOrder: number;
}

export function listLesionTypes() {
  return apiRequest<{ items: LesionTypeOption[] }>("/lesion-types");
}
