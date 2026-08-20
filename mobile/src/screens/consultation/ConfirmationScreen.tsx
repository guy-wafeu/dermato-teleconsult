import React from "react";
import { Text, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { ScreenContainer } from "../../components/ScreenContainer";
import { Card } from "../../components/Card";
import { Button } from "../../components/Button";
import { Icon } from "../../components/icons/Icon";
import { BottomWave } from "../../components/decor/Waves";
import { useTheme } from "../../theme/useTheme";
import { useConsultationDraftStore } from "../../store/consultationDraftStore";
import type { ConsultationStackParamList } from "../../navigation/consultationTypes";

type Props = NativeStackScreenProps<ConsultationStackParamList, "Confirmation">;

export function ConfirmationScreen({ route, navigation }: Props) {
  const { colors, spacing, radius, typography } = useTheme();
  const { refNumber } = route.params;
  // Le store a déjà été reset par SummaryScreen avant la navigation vers cet écran
  // (voir handleSubmit) — on ne lit `mode` ici que pour adapter le texte et le
  // bouton de retour, pas pour agir sur le brouillon.
  const lastMode = useConsultationDraftStore((s) => s.mode);
  const isAgent = lastMode === "agent";

  return (
    <ScreenContainer scroll={false}>
      <BottomWave soft={colors.accentSoft} strong={colors.surfaceAlt} height={130} />
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <View style={[{ width: 88, height: 88, borderRadius: radius.pill, backgroundColor: colors.accentSoft }, { alignItems: "center", justifyContent: "center", marginBottom: spacing.xxl }]}>
          <Icon name="checkCircle" size={44} color={colors.accentStrong} strokeWidth={1.6} />
        </View>

        <Text style={[typography.h1, { color: colors.text, textAlign: "center" }]}>
          {isAgent ? "Le dossier a bien été enregistré." : "Votre demande a bien été reçue."}
        </Text>
        <Text style={[typography.body, { color: colors.textMuted, textAlign: "center", marginTop: spacing.md }]}>
          {isAgent
            ? "Il est en attente de traitement, comme les dossiers soumis directement par les patients."
            : "Elle est en attente de traitement. Un professionnel confirmera prochainement votre créneau."}
        </Text>

        <Card style={{ marginTop: spacing.xxl, alignItems: "center" }}>
          <Text style={[typography.caption, { color: colors.textMuted }]}>NUMÉRO DE DOSSIER</Text>
          <Text style={[typography.display, { color: colors.accentStrong, marginTop: 4 }]}>
            {String(refNumber).padStart(6, "0")}
          </Text>
        </Card>
      </View>

      {isAgent ? (
        <View style={{ gap: spacing.sm }}>
          <Button label="Nouveau dossier terrain" onPress={() => navigation.getParent()?.navigate("AgentNewConsultationStart")} />
          <Button label="Retour à l'accueil" variant="ghost" onPress={() => navigation.getParent()?.navigate("AdminList")} />
        </View>
      ) : (
        <Button label="Retour à l'accueil" onPress={() => navigation.getParent()?.navigate("PatientDashboard")} />
      )}
    </ScreenContainer>
  );
}
