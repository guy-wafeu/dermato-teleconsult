import React, { useState } from "react";
import { ActivityIndicator, Text } from "react-native";
import { useQuery } from "@tanstack/react-query";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { StepScreen } from "./components/StepScreen";
import { Card } from "../../components/Card";
import { ChoiceGroup } from "../../components/ChoiceGroup";
import { TextField } from "../../components/TextField";
import { useTheme } from "../../theme/useTheme";
import { useConsultationDraftStore } from "../../store/consultationDraftStore";
import { useOfflineStore } from "../../store/offlineStore";
import { useIsDevPreview } from "../../hooks/useIsDevPreview";
import { useSaveDraftStep } from "./useSaveDraftStep";
import { recordConsent as recordConsentApi } from "../../services/api/consultations";
import { recordWalkInConsent } from "../../services/api/agent";
import { listAvailabilities } from "../../services/api/availabilities";
import { ApiError } from "../../services/api/client";
import { env } from "../../config/env";
import { CONSULTATION_TOTAL_STEPS, type ConsultationStackParamList } from "../../navigation/consultationTypes";
import type { Availability } from "../../types/api";

type Props = NativeStackScreenProps<ConsultationStackParamList, "ConsentAvailabilities">;

const AUTRE_VALUE = "autre";

const CONSENT_TEXT =
  "En cochant cette case, j'accepte de transmettre les informations et les photographies de mes lésions cutanées " +
  "au professionnel de santé en charge de ma téléconsultation, dans le seul but d'évaluer ma demande. Ces données " +
  "sont conservées de façon sécurisée et ne sont accessibles qu'aux personnes autorisées.";

// Mode aperçu dev (voir LoginScreen) : copie locale du référentiel de
// backend/prisma/seed.ts, pour parcourir cet écran sans appel serveur possible.
const DEV_PREVIEW_AVAILABILITIES: Availability[] = [
  { id: "dev-lundi", jourSemaine: "lundi", label: "Lundi 19h30–20h30", actif: true },
  { id: "dev-mardi", jourSemaine: "mardi", label: "Mardi 19h30–20h30", actif: true },
  { id: "dev-mercredi", jourSemaine: "mercredi", label: "Mercredi 19h30–20h30", actif: true },
  { id: "dev-jeudi", jourSemaine: "jeudi", label: "Jeudi 19h30–20h30", actif: true },
  { id: "dev-vendredi", jourSemaine: "vendredi", label: "Vendredi 19h30–20h30", actif: true },
  { id: "dev-samedi-matin", jourSemaine: "samedi", label: "Samedi 09h00–12h00", actif: true },
  { id: "dev-samedi-apresmidi", jourSemaine: "samedi", label: "Samedi 16h00–18h00", actif: true },
];

// Dernière étape du questionnaire : consentement puis disponibilités — deux
// formalités courtes qui n'ont pas besoin d'écrans séparés (voir demande de
// consolidation 13 -> 6 étapes). Le consentement est toujours enregistré avant les
// disponibilités (ordre repris des deux écrans d'origine).
export function ConsentAvailabilities({ navigation }: Props) {
  const { colors, spacing, typography } = useTheme();
  const mode = useConsultationDraftStore((s) => s.mode);
  const consultationId = useConsultationDraftStore((s) => s.consultationId);
  const consentGiven = useConsultationDraftStore((s) => s.consentGiven);
  const setConsentGiven = useConsultationDraftStore((s) => s.setConsentGiven);
  const draft = useConsultationDraftStore((s) => s.draft);
  const updateDraft = useConsultationDraftStore((s) => s.updateDraft);
  const isOnline = useOfflineStore((s) => s.isOnline);
  const isDevPreview = useIsDevPreview();
  const { saveAndContinue, saving, error } = useSaveDraftStep();
  const [consentSaving, setConsentSaving] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["availabilities"],
    queryFn: listAvailabilities,
    enabled: !isDevPreview,
  });
  const availabilityItems = isDevPreview ? DEV_PREVIEW_AVAILABILITIES : (data?.items ?? []);

  const selections = draft.availabilities ?? [];
  const selectedIds = selections.filter((s) => s.availabilityId).map((s) => s.availabilityId as string);
  const autreEntry = selections.find((s) => !s.availabilityId);
  const selectedValues = autreEntry ? [...selectedIds, AUTRE_VALUE] : selectedIds;

  function handleAvailabilityChange(values: string[]) {
    const hasAutre = values.includes(AUTRE_VALUE);
    const chosenIds = values.filter((v) => v !== AUTRE_VALUE);
    updateDraft({
      availabilities: [
        ...chosenIds.map((id) => ({ availabilityId: id })),
        ...(hasAutre ? [{ autrePrecision: autreEntry?.autrePrecision ?? "" }] : []),
      ],
    });
  }

  function handleAutrePrecision(text: string) {
    updateDraft({
      availabilities: [...selectedIds.map((id) => ({ availabilityId: id })), { autrePrecision: text }],
    });
  }

  async function handleContinue() {
    if (!consentGiven) {
      setLocalError("Le consentement est requis pour transmettre votre dossier.");
      return;
    }
    if (selectedValues.length === 0) {
      setLocalError("Sélectionnez au moins une disponibilité.");
      return;
    }
    setLocalError(null);

    if (isDevPreview) {
      navigation.navigate("Summary");
      return;
    }

    if (!consultationId) {
      setLocalError(
        isOnline
          ? "Synchronisation de vos réponses en cours, patientez un instant puis réessayez."
          : "Cette étape nécessite une connexion internet. Vos réponses précédentes sont enregistrées sur cet appareil et seront synchronisées automatiquement — réessayez une fois connecté.",
      );
      return;
    }

    setConsentSaving(true);
    try {
      if (mode === "agent") {
        await recordWalkInConsent(consultationId, env.consentTextVersion);
      } else {
        await recordConsentApi(consultationId, env.consentTextVersion);
      }
    } catch (err) {
      setConsentSaving(false);
      setLocalError(err instanceof ApiError ? err.message : "Impossible d'enregistrer le consentement. Réessayez.");
      return;
    }
    setConsentSaving(false);

    saveAndContinue(() => navigation.navigate("Summary"));
  }

  return (
    <StepScreen
      step={6}
      totalSteps={CONSULTATION_TOTAL_STEPS}
      title="Consentement & disponibilités"
      icon="shieldCheck"
      onBack={() => navigation.goBack()}
      onContinue={handleContinue}
      canContinue={consentGiven && selectedValues.length > 0}
      saving={consentSaving || saving}
      error={localError ?? error}
    >
      <Card style={{ marginBottom: spacing.lg }}>
        <Text style={[typography.bodyMuted, { color: colors.text }]}>{CONSENT_TEXT}</Text>
      </Card>
      <ChoiceGroup
        multiple
        options={[{ value: "accept", label: "J'accepte de transmettre mes informations et mes photos" }]}
        selected={consentGiven ? ["accept"] : []}
        onChange={(values) => setConsentGiven(values.includes("accept"))}
      />

      <Text style={[typography.h2, { color: colors.text, marginTop: spacing.xxl, marginBottom: spacing.sm }]}>
        Vos disponibilités
      </Text>
      <Text style={[typography.bodyMuted, { color: colors.textMuted, marginBottom: spacing.md }]}>
        Sélectionnez tous les créneaux qui vous conviennent.
      </Text>
      {isLoading ? (
        <ActivityIndicator color={colors.accent} />
      ) : (
        <ChoiceGroup
          multiple
          options={[
            ...availabilityItems.map((a: Availability) => ({ value: a.id, label: a.label })),
            { value: AUTRE_VALUE, label: "Autres plages" },
          ]}
          selected={selectedValues}
          onChange={handleAvailabilityChange}
        />
      )}
      {autreEntry ? (
        <TextField
          label="Proposez une autre disponibilité"
          value={autreEntry.autrePrecision ?? ""}
          onChangeText={handleAutrePrecision}
          style={{ marginTop: 16 }}
        />
      ) : null}
    </StepScreen>
  );
}
