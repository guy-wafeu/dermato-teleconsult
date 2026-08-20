import { useState } from "react";
import { saveDraft } from "../../services/api/consultations";
import { saveWalkInDraft } from "../../services/api/agent";
import { ApiError } from "../../services/api/client";
import { useConsultationDraftStore } from "../../store/consultationDraftStore";
import { useOfflineStore } from "../../store/offlineStore";
import { useIsDevPreview } from "../../hooks/useIsDevPreview";
import { countPendingDrafts, saveDraftLocally } from "../../services/offline/draftQueue";

// Appelé au "Continuer" de chaque étape : sauvegarde tout le brouillon (pas
// seulement le champ de l'étape courante). Si le réseau répond (même avec une
// erreur métier), on bloque et on affiche l'erreur — mais si l'appel échoue
// pour cause de connectivité (ApiError status 0, voir services/api/client), on
// n'empêche pas l'utilisateur d'avancer : le snapshot est mis en file locale
// (services/offline/draftQueue) et sera rejoué automatiquement par
// syncEngine dès le retour de la connexion. La bannière globale
// (OfflineBanner) informe l'utilisateur du stockage local — inutile de le
// répéter à chaque étape.
//
// Mode "agent" (voir consultationDraftStore#mode) : même mécanique, mais vise
// /admin/agent-consultations (services/api/agent.ts) — un admin saisit le dossier
// pour un patient sans compte, voir "mode terrain" dans AdminDashboardScreen.
export function useSaveDraftStep() {
  const mode = useConsultationDraftStore((s) => s.mode);
  const clientUuid = useConsultationDraftStore((s) => s.clientUuid);
  const draft = useConsultationDraftStore((s) => s.draft);
  const setConsultationMeta = useConsultationDraftStore((s) => s.setConsultationMeta);
  const setDraftStatus = useOfflineStore((s) => s.setDraftStatus);
  const setPendingCount = useOfflineStore((s) => s.setPendingCount);
  const isDevPreview = useIsDevPreview();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function saveAndContinue(onSuccess: () => void) {
    // Mode aperçu dev (voir LoginScreen) : aucun compte Firebase réel, donc aucun
    // appel API possible — on avance directement pour permettre de parcourir tout le
    // formulaire hors ligne.
    if (isDevPreview) {
      onSuccess();
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const result = mode === "agent" ? await saveWalkInDraft(clientUuid, draft) : await saveDraft(clientUuid, draft);
      setConsultationMeta(result.id, result.refNumber);
      setDraftStatus(clientUuid, "synced");
      onSuccess();
    } catch (err) {
      if (err instanceof ApiError && err.status === 0) {
        saveDraftLocally(clientUuid, draft);
        setDraftStatus(clientUuid, "pending");
        setPendingCount(countPendingDrafts());
        onSuccess();
      } else {
        setError(err instanceof ApiError ? err.message : "Une erreur est survenue. Réessayez.");
      }
    } finally {
      setSaving(false);
    }
  }

  return { saveAndContinue, saving, error };
}
