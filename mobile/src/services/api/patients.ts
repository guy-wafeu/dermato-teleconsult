import { apiRequest } from "./client";
import type { Patient } from "../../types/api";

export interface CreatePatientProfileInput {
  nom: string;
  prenom: string;
  telephone: string;
  email: string;
}

export function createPatientProfile(input: CreatePatientProfileInput) {
  return apiRequest<Patient>("/patients/me", { method: "POST", body: input });
}

export function getMyProfile() {
  return apiRequest<Patient>("/patients/me");
}
