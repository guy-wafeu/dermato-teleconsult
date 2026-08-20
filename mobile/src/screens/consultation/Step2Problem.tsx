import React, { useState } from "react";
import { Text } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { StepScreen } from "./components/StepScreen";
import { TextField } from "../../components/TextField";
import { ChoiceGroup } from "../../components/ChoiceGroup";
import { YesNoToggle } from "../../components/YesNoToggle";
import { useTheme } from "../../theme/useTheme";
import { useConsultationDraftStore } from "../../store/consultationDraftStore";
import { useSaveDraftStep } from "./useSaveDraftStep";
import { CONSULTATION_TOTAL_STEPS, type ConsultationStackParamList } from "../../navigation/consultationTypes";

type Props = NativeStackScreenProps<ConsultationStackParamList, "Step2Problem">;

const DUREE_UNITE_OPTIONS = [
  { value: "jours", label: "Jours" },
  { value: "semaines", label: "Semaines" },
  { value: "mois", label: "Mois" },
  { value: "annees", label: "Années" },
];

const DEMANGEAISON_OPTIONS = [
  { value: "oui", label: "Oui" },
  { value: "non", label: "Non" },
  { value: "parfois", label: "Parfois" },
  { value: "nuit", label: "Principalement le soir ou la nuit" },
];

// Regroupe motif + histoire (durée) + démangeaisons — trois questions qui, en
// pratique, se répondent ensemble ("qu'est-ce qui ne va pas, depuis quand, est-ce
// que ça gratte ?") plutôt que sur trois écrans séparés (voir demande de
// consolidation 13 -> 6 étapes).
export function Step2Problem({ navigation }: Props) {
  const { colors, spacing, typography } = useTheme();
  const draft = useConsultationDraftStore((s) => s.draft);
  const updateDraft = useConsultationDraftStore((s) => s.updateDraft);
  const { saveAndContinue, saving, error } = useSaveDraftStep();
  const [localError, setLocalError] = useState<string | null>(null);

  const canContinue = Boolean(draft.motif?.trim() && draft.demangeaison);

  function handleContinue() {
    if (!draft.motif?.trim() || !draft.demangeaison) {
      setLocalError("La plainte et la présence de démangeaisons sont requises.");
      return;
    }
    setLocalError(null);
    saveAndContinue(() => navigation.navigate("Step3LesionAspect"));
  }

  return (
    <StepScreen
      step={2}
      totalSteps={CONSULTATION_TOTAL_STEPS}
      title="Votre problème"
      onBack={() => navigation.goBack()}
      onContinue={handleContinue}
      canContinue={canContinue}
      saving={saving}
      error={localError ?? error}
    >
      <TextField
        label="Quelles sont vos plaintes ? *"
        value={draft.motif ?? ""}
        onChangeText={(v) => updateDraft({ motif: v })}
        multiline
        numberOfLines={5}
        style={{ minHeight: 120, textAlignVertical: "top" }}
      />

      <Text style={[typography.label, { color: colors.text, marginTop: spacing.xl, marginBottom: spacing.sm }]}>
        Avez-vous besoin d'un conseil cosmétique ?
      </Text>
      <YesNoToggle
        value={draft.conseilCosmetiqueDemande}
        onChange={(value) => updateDraft({ conseilCosmetiqueDemande: value })}
      />
      {draft.conseilCosmetiqueDemande ? (
        <TextField
          label="Précisez votre besoin (savon corporel, lait corporel, produit adapté...)"
          value={draft.conseilCosmetiquePrecision ?? ""}
          onChangeText={(v) => updateDraft({ conseilCosmetiquePrecision: v })}
          multiline
          numberOfLines={3}
          style={{ minHeight: 80, textAlignVertical: "top", marginTop: spacing.lg }}
        />
      ) : null}

      <Text style={[typography.label, { color: colors.text, marginTop: spacing.xxl, marginBottom: spacing.md }]}>
        Depuis combien de temps le problème a-t-il commencé ?
      </Text>
      <TextField
        label="Nombre"
        value={draft.dureeValeur ? String(draft.dureeValeur) : ""}
        onChangeText={(v) => updateDraft({ dureeValeur: v ? Number(v.replace(/[^0-9]/g, "")) : undefined })}
        keyboardType="number-pad"
        style={{ maxWidth: 140 }}
      />
      <Text style={[typography.label, { color: colors.text, marginTop: spacing.sm, marginBottom: spacing.sm }]}>Unité</Text>
      <ChoiceGroup
        variant="pills"
        options={DUREE_UNITE_OPTIONS}
        selected={draft.dureeUnite ? [draft.dureeUnite] : []}
        onChange={([value]) => updateDraft({ dureeUnite: value as typeof draft.dureeUnite })}
      />

      <Text style={[typography.label, { color: colors.text, marginTop: spacing.xxl, marginBottom: spacing.sm }]}>
        Votre problème de peau vous démange-t-il ? *
      </Text>
      <ChoiceGroup
        options={DEMANGEAISON_OPTIONS}
        selected={draft.demangeaison ? [draft.demangeaison] : []}
        onChange={([value]) => updateDraft({ demangeaison: value as typeof draft.demangeaison })}
      />
    </StepScreen>
  );
}
