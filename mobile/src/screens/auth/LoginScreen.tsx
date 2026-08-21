import React, { useState } from "react";
import { Image, Pressable, Text, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { ScreenContainer } from "../../components/ScreenContainer";
import { TextField } from "../../components/TextField";
import { Button } from "../../components/Button";
import { useTheme } from "../../theme/useTheme";
import { mapFirebaseAuthError, requestPasswordReset, signInWithEmail } from "../../services/auth/firebaseAuth";
import type { RootStackParamList } from "../../navigation/types";

const LOGO = require("../../assets/brand/logo.jpg");

type Props = NativeStackScreenProps<RootStackParamList, "Login">;

// V1 : connexion par email uniquement. La connexion par téléphone annoncée dans le
// brief demande un endpoint backend de résolution téléphone -> email (pas encore
// écrit, et volontairement pas simulé ici) — à ajouter avant d'exposer ce champ.
// Idem pour Google/Apple : pas d'auth sociale câblée côté Firebase/natif pour
// l'instant, donc pas de bouton promettant une fonctionnalité qui ne marche pas.
export function LoginScreen({ navigation }: Props) {
  const { colors, spacing, typography } = useTheme();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [resetMessage, setResetMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  // Après connexion, l'écoute globale sur l'état Firebase (RootNavigator) prend le
  // relais : elle appelle /patients/me puis /admin/me et redirige en conséquence —
  // cet écran n'a pas besoin de savoir où naviguer ensuite.
  async function handleSubmit() {
    setError(null);
    setResetMessage(null);
    if (!email.trim() || !password) {
      setError("Renseignez votre email et votre mot de passe.");
      return;
    }
    setLoading(true);
    try {
      await signInWithEmail(email.trim().toLowerCase(), password);
    } catch (err) {
      setError(mapFirebaseAuthError(err));
    } finally {
      setLoading(false);
    }
  }

  async function handleForgotPassword() {
    if (!email.trim()) {
      setError("Renseignez votre email pour recevoir le lien de réinitialisation.");
      return;
    }
    try {
      await requestPasswordReset(email.trim().toLowerCase());
      setError(null);
      setResetMessage("Un email de réinitialisation vous a été envoyé.");
    } catch (err) {
      setError(mapFirebaseAuthError(err));
    }
  }

  return (
    <ScreenContainer center>
      <View style={{ alignItems: "center", marginBottom: spacing.xxl }}>
        <Image source={LOGO} resizeMode="contain" style={{ width: 84, height: 84, borderRadius: 18, marginBottom: spacing.md }} />
        <Text style={typography.h2}>
          <Text style={{ color: colors.accentStrong, fontWeight: "800" }}>DERMATO</Text>
          <Text style={{ color: colors.text, fontWeight: "700" }}>TÉLÉCONSULT</Text>
        </Text>
      </View>

      <Text style={[typography.h1, { color: colors.text, textAlign: "center" }]}>Bienvenue !</Text>
      <Text
        style={[
          typography.bodyMuted,
          { color: colors.textMuted, textAlign: "center", marginTop: spacing.xs, marginBottom: spacing.xxl },
        ]}
      >
        Connectez-vous pour accéder à votre espace et consulter un dermatologue.
      </Text>

      <TextField
        label="Adresse e-mail"
        icon="mail"
        placeholder="Entrez votre adresse e-mail"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <TextField
        label="Mot de passe"
        icon="lock"
        revealable
        placeholder="Entrez votre mot de passe"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <Pressable onPress={handleForgotPassword} hitSlop={8} style={{ alignSelf: "flex-end", marginTop: -spacing.md, marginBottom: spacing.lg }}>
        <Text style={[typography.caption, { color: colors.accentStrong, fontWeight: "600" }]}>Mot de passe oublié ?</Text>
      </Pressable>

      {error ? <Text style={[typography.bodyMuted, { color: colors.danger, marginBottom: spacing.md }]}>{error}</Text> : null}
      {resetMessage ? (
        <Text style={[typography.bodyMuted, { color: colors.accentStrong, marginBottom: spacing.md }]}>{resetMessage}</Text>
      ) : null}

      <Button label="Se connecter" onPress={handleSubmit} loading={loading} />

      <Pressable
        onPress={() => navigation.navigate("SignUp")}
        style={{ flexDirection: "row", justifyContent: "center", marginTop: spacing.xxl }}
      >
        <Text style={[typography.body, { color: colors.textMuted }]}>Pas encore de compte ? </Text>
        <Text style={[typography.body, { color: colors.accentStrong, fontWeight: "700" }]}>S'inscrire</Text>
      </Pressable>
    </ScreenContainer>
  );
}
