import React from "react";
import { Image, Pressable, Text, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { ScreenContainer } from "../../components/ScreenContainer";
import { Card } from "../../components/Card";
import { Icon, type IconName } from "../../components/icons/Icon";
import { DotGrid } from "../../components/decor/Waves";
import { useTheme } from "../../theme/useTheme";
import { useAuthStore } from "../../store/authStore";
import type { ConsultationStackParamList } from "../../navigation/consultationTypes";

const LOGO_ICON = require("../../assets/brand/logo-icon.png");

type Props = NativeStackScreenProps<ConsultationStackParamList, "Confirmation">;

// Bouton pilule pleine largeur avec icône dans un cercle blanc à gauche —
// reprend le style demandé pour cet écran (voir aussi "Commencer le dossier"
// dans AgentNewConsultationStart) plutôt que le composant Button partagé, qui
// n'a pas cette variante icône-en-cercle.
function PrimaryPillButton({ icon, label, onPress }: { icon: IconName; label: string; onPress: () => void }) {
  const { colors, spacing, radius, typography } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={{
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: colors.accentStrong,
        borderRadius: radius.pill,
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.sm,
      }}
    >
      <View
        style={{
          width: 36,
          height: 36,
          borderRadius: 18,
          backgroundColor: colors.surface,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Icon name={icon} size={18} color={colors.accentStrong} />
      </View>
      <Text style={[typography.body, { color: colors.onAccent, fontWeight: "700", flex: 1, textAlign: "center", marginRight: 36 }]}>
        {label}
      </Text>
    </Pressable>
  );
}

function OutlinePillButton({ icon, label, onPress }: { icon: IconName; label: string; onPress: () => void }) {
  const { colors, spacing, radius, typography } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 1.5,
        borderColor: colors.accent,
        borderRadius: radius.pill,
        paddingVertical: spacing.md,
      }}
    >
      <Icon name={icon} size={18} color={colors.accentStrong} />
      <Text style={[typography.body, { color: colors.accentStrong, fontWeight: "700", marginLeft: spacing.sm }]}>{label}</Text>
    </Pressable>
  );
}

/** Petite étoile/plus décoratif, positionné en absolu autour d'un point d'ancrage. */
function Sparkle({ icon = "sparkle", size = 12, color, top, bottom, left, right }: {
  icon?: IconName;
  size?: number;
  color: string;
  top?: number;
  bottom?: number;
  left?: number;
  right?: number;
}) {
  return (
    <View pointerEvents="none" style={{ position: "absolute", top, bottom, left, right }}>
      <Icon name={icon} size={size} color={color} />
    </View>
  );
}

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
    <ScreenContainer>
      <View>
        <DotGrid color={colors.border} corner="topRight" rows={4} cols={4} gap={11} />
        <View
          pointerEvents="none"
          style={{
            position: "absolute",
            top: -36,
            left: -56,
            width: 140,
            height: 140,
            borderRadius: 70,
            backgroundColor: colors.accentSoft,
            opacity: 0.55,
          }}
        />
        <View
          pointerEvents="none"
          style={{
            position: "absolute",
            top: 46,
            left: -74,
            width: 88,
            height: 88,
            borderRadius: 44,
            backgroundColor: colors.accentSoft,
            opacity: 0.45,
          }}
        />

        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: spacing.huge }}>
          <Image source={LOGO_ICON} resizeMode="contain" style={{ width: 44, height: 44, marginRight: spacing.sm }} />
          <View>
            <Text style={typography.h2}>
              <Text style={{ color: colors.accentStrong, fontWeight: "800" }}>DERMA</Text>
              <Text style={{ color: colors.text, fontWeight: "800" }}>CONSULT</Text>
            </Text>
            <Text style={[typography.caption, { color: colors.accentStrong, letterSpacing: 0.6, fontWeight: "600" }]}>
              TÉLÉCONSULTATION DERMATOLOGIQUE
            </Text>
          </View>
        </View>
      </View>

      <View style={{ alignItems: "center" }}>
        <View style={{ width: 150, height: 150, alignItems: "center", justifyContent: "center", marginBottom: spacing.xxl }}>
          <View
            style={{
              position: "absolute",
              width: 150,
              height: 150,
              borderRadius: 75,
              borderWidth: 1.5,
              borderColor: colors.border,
            }}
          />
          <View
            style={{
              width: 100,
              height: 100,
              borderRadius: 50,
              backgroundColor: colors.accentSoft,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Icon name="checkCircle" size={48} color={colors.accentStrong} strokeWidth={1.6} />
          </View>
          <Sparkle icon="plus" size={18} color={colors.accent} top={10} right={4} />
          <Sparkle icon="sparkle" size={14} color={colors.accent} bottom={16} left={0} />
          <Sparkle icon="sparkle" size={12} color={colors.accent} bottom={22} right={2} />
          <Sparkle icon="sparkle" size={8} color={colors.border} top={30} left={4} />
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

        <Card style={{ marginTop: spacing.xxl, alignItems: "center", paddingVertical: spacing.xl }}>
          <View
            style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              backgroundColor: colors.accentSoft,
              alignItems: "center",
              justifyContent: "center",
              marginBottom: spacing.sm,
            }}
          >
            <Icon name="document" size={20} color={colors.accentStrong} />
          </View>
          <Text style={[typography.caption, { color: colors.textMuted, letterSpacing: 0.6 }]}>NUMÉRO DE DOSSIER</Text>
          {isPendingSync ? (
            <Text style={[typography.h2, { color: colors.accentStrong, marginTop: 4, textAlign: "center" }]}>
              En attente d'envoi
            </Text>
          ) : (
            <View style={{ flexDirection: "row", alignItems: "center", marginTop: 4 }}>
              <Icon name="sparkle" size={14} color={colors.accent} />
              <Text style={[typography.display, { color: colors.accentStrong, marginHorizontal: spacing.sm }]}>
                {String(refNumber).padStart(6, "0")}
              </Text>
              <Icon name="sparkle" size={14} color={colors.accent} />
            </View>
          )}
        </Card>

        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: colors.accentSoft,
            borderRadius: radius.lg,
            padding: spacing.lg,
            marginTop: spacing.xl,
            width: "100%",
          }}
        >
          <Icon name="shieldCheck" size={20} color={colors.accentStrong} />
          <Text style={[typography.bodyMuted, { color: colors.accentStrong, marginLeft: spacing.md, flex: 1 }]}>
            Vos données sont sécurisées et strictement confidentielles.
          </Text>
        </View>
      </View>

      <View style={{ marginTop: spacing.xxl, gap: spacing.sm }}>
        {isAgent ? (
          <>
            <PrimaryPillButton
              icon="plus"
              label="Nouveau dossier terrain"
              onPress={() => navigation.getParent()?.navigate("AgentNewConsultationStart")}
            />
            {isFullAdmin ? (
              // Deux niveaux : ConsultationNavigator -> AgentNavigator -> AdminNavigator
              // (voir AdminNavigator.tsx#AgentFlow) — un compte agent seul n'a pas ce
              // grand-parent, d'où la condition isFullAdmin ci-dessus.
              <OutlinePillButton
                icon="home"
                label="Retour à l'accueil"
                onPress={() => navigation.getParent()?.getParent()?.navigate("AdminList")}
              />
            ) : null}
          </>
        ) : (
          <PrimaryPillButton icon="home" label="Retour à l'accueil" onPress={() => navigation.getParent()?.navigate("PatientDashboard")} />
        )}
      </View>
    </ScreenContainer>
  );
}
