import { create } from "zustand";
import type { AdminProfile, Patient } from "../types/api";

type AuthStatus = "loading" | "signedOut" | "needsProfile" | "signedInPatient" | "signedInAdmin" | "error";

interface AuthState {
  status: AuthStatus;
  firebaseUid: string | null;
  patient: Patient | null;
  admin: AdminProfile | null;
  errorMessage: string | null;
  setLoading: () => void;
  setSignedOut: () => void;
  setNeedsProfile: (firebaseUid: string) => void;
  setSignedInPatient: (patient: Patient) => void;
  setSignedInAdmin: (admin: AdminProfile) => void;
  // Distinct de setSignedOut() : la session Firebase reste valide (l'utilisateur
  // EST connecté), seul l'appel réseau vers notre backend a échoué. On garde
  // firebaseUid pour permettre un "Réessayer" sans redemander les identifiants.
  setError: (message: string, firebaseUid: string) => void;
}

// État d'auth global minimal. La logique de résolution (écouter Firebase, appeler
// /patients/me puis /admin/me, décider du statut) vit dans
// navigation/RootNavigator.tsx — ce store ne fait que refléter le résultat.
export const useAuthStore = create<AuthState>((set) => ({
  status: "loading",
  firebaseUid: null,
  patient: null,
  admin: null,
  errorMessage: null,
  setLoading: () => set({ status: "loading", errorMessage: null }),
  setSignedOut: () => set({ status: "signedOut", firebaseUid: null, patient: null, admin: null, errorMessage: null }),
  setNeedsProfile: (firebaseUid) =>
    set({ status: "needsProfile", firebaseUid, patient: null, admin: null, errorMessage: null }),
  setSignedInPatient: (patient) =>
    set({ status: "signedInPatient", patient, admin: null, firebaseUid: patient.firebaseUid, errorMessage: null }),
  setSignedInAdmin: (admin) =>
    set({ status: "signedInAdmin", admin, patient: null, firebaseUid: admin.firebaseUid, errorMessage: null }),
  setError: (errorMessage, firebaseUid) => set({ status: "error", errorMessage, firebaseUid }),
}));
