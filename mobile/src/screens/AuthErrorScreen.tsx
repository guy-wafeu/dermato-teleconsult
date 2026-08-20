import React from "react";
import { Image, Text, View } from "react-native";
import { useTheme } from "../theme/useTheme";
import { Button } from "../components/Button";

const LOGO = require("../assets/brand/logo.jpg");

interface Props {
  message: string | null;
  onRetry: () => void;
  onSignOut: () => void;
}

// Affiché quand Firebase a bien authentifié l'utilisateur mais que l'appel réseau
// vers notre backend a échoué (coupure, serveur injoignable...) — jamais en
// silence : voir la note dans RootNavigator sur le bug corrigé ici.
export function AuthErrorScreen({ message, onRetry, onSignOut }: Props) {
  const { colors, spacing, typography } = useTheme();
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.bg, padding: spacing.xxl }}>
      <Image source={LOGO} resizeMode="contain" style={{ width: 88, height: 88, borderRadius: 18, marginBottom: spacing.xl }} />
      <Text style={[typography.h1, { color: colors.text, textAlign: "center", marginBottom: spacing.sm }]}>
        Connexion au serveur impossible
      </Text>
      <Text style={[typography.body, { color: colors.textMuted, textAlign: "center", marginBottom: spacing.xxl }]}>
        {message ?? "Une erreur est survenue. Réessayez."}
      </Text>
      <View style={{ width: "100%", gap: spacing.md }}>
        <Button label="Réessayer" onPress={onRetry} />
        <Button label="Se déconnecter" variant="ghost" onPress={onSignOut} />
      </View>
    </View>
  );
}
