import React from "react";
import { Text, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { ScreenContainer } from "../../components/ScreenContainer";
import { Card } from "../../components/Card";
import { Button } from "../../components/Button";
import { Icon } from "../../components/icons/Icon";
import { BottomWave } from "../../components/decor/Waves";
import { useTheme } from "../../theme/useTheme";
import { useAuthStore } from "../../store/authStore";
import type { ConsultationStackParamList } from "../../navigation/consultationTypes";

type Props = NativeStackScreenProps<ConsultationStackParamList, "Confirmation">;

export function ConfirmationScreen({ route, navigation }: Props) {
  const { colors, spacing, radius, typography } = useTheme();
  // `mode` vient des params de navigation, pas du store : SummaryScreen appelle
  // reset() (qui remet mode à "patient") avant de naviguer ici, donc le store ne
  // reflète plus le mode réel une fois cet écran affiché (voir consultationTypes.ts).
  const { refNumber, mode } = route.params;
  const isAgent = mode === "agent";
  // Envoi mis en file (voir SummaryScreen#handleSubmit) : pas encore de vrai
  // numéro, attribué par le serveur seulement une fois l'envoi réellement passé
  // (voir syncEngine.ts#syncPendingSubmits) — l'agent n'attend pas ce moment
  // pour continuer, il peut enchaîner sur le dossier suivant dès cet écran.
  const isPendingSync = refNumber === null;
  // Un compte de rôle "agent" n'a pas d'accueil admin vers lequel revenir (voir
  // AgentNavigator.tsx, écran unique) — seul un vrai administrateur qui a utilisé
  // le mode terrain depuis son propre espace peut y retourner.
  const isFullAdmin = useAuthStore((s) => s.admin?.role) === "admin";

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
          {isPendingSync
            ? "Il est enregistré sur cet appareil et sera transmis automatiquement dès le retour de la connexion — un numéro de dossier lui sera attribué à ce moment-là."
            : isAgent
              ? "Il est en attente de traitement, comme les dossiers soumis directement par les patients."
              : "Elle est en attente de traitement. Un professionnel confirmera prochainement votre créneau."}
        </Text>

        <Card style={{ marginTop: spacing.xxl, alignItems: "center" }}>
          <Text style={[typography.caption, { color: colors.textMuted }]}>NUMÉRO DE DOSSIER</Text>
          {isPendingSync ? (
            <Text style={[typography.h2, { color: colors.accentStrong, marginTop: 4, textAlign: "center" }]}>
              En attente d'envoi
            </Text>
          ) : (
            <Text style={[typography.display, { color: colors.accentStrong, marginTop: 4 }]}>
              {String(refNumber).padStart(6, "0")}
            </Text>
          )}
        </Card>
      </View>

      {isAgent ? (
        <View style={{ gap: spacing.sm }}>
          <Button label="Nouveau dossier terrain" onPress={() => navigation.getParent()?.navigate("AgentNewConsultationStart")} />
          {isFullAdmin ? (
            // Deux niveaux : ConsultationNavigator -> AgentNavigator -> AdminNavigator
            // (voir AdminNavigator.tsx#AgentFlow) — un compte agent seul n'a pas ce
            // grand-parent, d'où la condition isFullAdmin ci-dessus.
            <Button
              label="Retour à l'accueil"
              variant="ghost"
              onPress={() => navigation.getParent()?.getParent()?.navigate("AdminList")}
            />
          ) : null}
        </View>
      ) : (
        <Button label="Retour à l'accueil" onPress={() => navigation.getParent()?.navigate("PatientDashboard")} />
      )}
    </ScreenContainer>
  );
}
