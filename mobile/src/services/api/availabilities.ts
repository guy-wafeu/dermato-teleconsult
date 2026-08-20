import { apiRequest } from "./client";
import type { Availability } from "../../types/api";

export function listAvailabilities() {
  return apiRequest<{ items: Availability[] }>("/availabilities");
}
