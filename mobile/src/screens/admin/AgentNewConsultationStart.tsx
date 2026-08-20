import React, { useState } from "react";
import { Text, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { ScreenContainer } from "../../components/ScreenContainer";
import { TextField } from "../../components/TextField";
import { Button } from "../../components/Button";
import { Icon } from "../../components/icons/Icon";
import { useTheme } from "../../theme/useTheme";
import { useConsultationDraftStore } from "../../store/consultationDraftStore";
import type { AdminStackParamList } from "../../navigation/adminTypes";

type Props = NativeStackScreenProps<AdminStackParamList, "AgentNewConsultationStart">;

// Point d'entrée du "mode terrain" : un admin saisit nom + téléphone pour démarrer
// un dossier au nom d'une personne qui n'a pas de compte. Ces deux champs ne
// déclenchent aucun appel réseau ici — ils sont simplement posés dans le brouillon
// (voir consultationDraftStore) et c'est le premier "Continuer" de Step1PersonalInfo
// qui crée réellement le patient et la consultation côté serveur (voir
// useSaveDraftStep + backend/src/modules/agent/agent.service.ts#createOrUpdateWalkInDraft).
// Les autres champs de Step1PersonalInfo restent à compléter normalement.
export function AgentNewConsultationStart({ navigation }: Props) {
  const { colors, spacing, typography } = useTheme();
  const resetDraft = useConsultationDraftStore((s) => s.reset);
  const setMode = useConsultationDraftStore((s) => s.setMode);
  const updateDraft = useConsultationDraftStore((s) => s.updateDraft);
  const [nomComplet, setNomComplet] = useState("");
  const [telephone, setTelephone] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleStart() {
    if (!nomComplet.trim() || !telephone.trim()) {
      setError("Le nom complet et le numéro de téléphone sont requis.");
      return;
    }
    setError(null);
    resetDraft();
    setMode("agent");
    updateDraft({ nomComplet: nomComplet.trim(), telephoneContact: telephone.trim() });
    navigation.navigate("AgentConsultation");
  }

  return (
    <ScreenContainer center>
      <View style={{ alignItems: "center", marginBottom: spacing.xxl }}>
        <View
          style={{
            width: 56,
            height: 56,
            borderRadius: 28,
            backgroundColor: colors.accentSoft,
            alignItems: "center",
            justifyContent: "center",
            marginBottom: spacing.md,
          }}
        >
          <Icon name="plus" size={26} color={colors.accentStrong} />
        </View>
        <Text style={[typography.h1, { color: colors.text, textAlign: "center" }]}>Nouveau dossier terrain</Text>
        <Text style={[typography.bodyMuted, { color: colors.textMuted, textAlign: "center", marginTop: spacing.xs }]}>
          Pour une personne présente avec vous, sans compte dans l'application.
        </Text>
      </View>

      <TextField label="Nom complet *" value={nomComplet} onChangeText={setNomComplet} />
      <TextField label="Numéro de téléphone *" value={telephone} onChangeText={setTelephone} keyboardType="phone-pad" />

      {error ? <Text style={[typography.bodyMuted, { color: colors.danger, marginBottom: spacing.md }]}>{error}</Text> : null}

      <Button label="Commencer le dossier" onPress={handleStart} />
      <Button label="Retour" variant="ghost" onPress={() => navigation.goBack()} />
    </ScreenContainer>
  );
}
