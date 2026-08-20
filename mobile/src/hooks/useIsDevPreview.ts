import { useAuthStore } from "../store/authStore";
import { useConsultationDraftStore } from "../store/consultationDraftStore";

// Vrai en mode aperçu dev patient OU agent (voir LoginScreen "Aperçu ... (dev)") —
// centralisé ici pour ne pas répéter la même condition mode-dépendante dans
// chaque écran du questionnaire (voir consultationDraftStore#mode).
export function useIsDevPreview(): boolean {
  const mode = useConsultationDraftStore((s) => s.mode);
  const patient = useAuthStore((s) => s.patient);
  const admin = useAuthStore((s) => s.admin);
  return mode === "agent" ? admin?.id === "dev-preview-admin" : patient?.id === "dev-preview";
}
