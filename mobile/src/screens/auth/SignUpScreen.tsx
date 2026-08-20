import React, { useState } from "react";
import { Text } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { ScreenContainer } from "../../components/ScreenContainer";
import { TextField } from "../../components/TextField";
import { Button } from "../../components/Button";
import { useTheme } from "../../theme/useTheme";
import { signUpSchema, type SignUpFormValues } from "./signup.schema";
import { mapFirebaseAuthError, signUpWithEmail } from "../../services/auth/firebaseAuth";
import { createPatientProfile } from "../../services/api/patients";
import { useAuthStore } from "../../store/authStore";
import { ApiError } from "../../services/api/client";
import type { RootStackParamList } from "../../navigation/types";

type Props = NativeStackScreenProps<RootStackParamList, "SignUp">;

const EMPTY_FORM: SignUpFormValues = { nom: "", prenom: "", telephone: "", email: "", password: "", confirmPassword: "" };

export function SignUpScreen({ navigation }: Props) {
  const { colors, spacing, typography } = useTheme();
  const setSignedInPatient = useAuthStore((s) => s.setSignedInPatient);
  const [form, setForm] = useState<SignUpFormValues>(EMPTY_FORM);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof SignUpFormValues, string>>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function update<K extends keyof SignUpFormValues>(key: K, value: SignUpFormValues[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit() {
    setFormError(null);
    const result = signUpSchema.safeParse(form);
    if (!result.success) {
      const errors: Partial<Record<keyof SignUpFormValues, string>> = {};
      for (const issue of result.error.issues) {
        const key = issue.path[0] as keyof SignUpFormValues;
        errors[key] = issue.message;
      }
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});
    setLoading(true);
    try {
      const user = await signUpWithEmail(result.data.email, result.data.password);
      const patient = await createPatientProfile({
        nom: result.data.nom,
        prenom: result.data.prenom,
        telephone: result.data.telephone,
        email: result.data.email,
      });
      setSignedInPatient(patient);
    } catch (error) {
      if (error instanceof ApiError) {
        setFormError(error.message);
      } else {
        setFormError(mapFirebaseAuthError(error));
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScreenContainer center>
      <Text style={[typography.h1, { color: colors.text, marginBottom: spacing.xxl }]}>Créer mon compte</Text>

      <TextField label="Nom" value={form.nom} onChangeText={(v) => update("nom", v)} error={fieldErrors.nom} autoCapitalize="words" />
      <TextField
        label="Prénom"
        value={form.prenom}
        onChangeText={(v) => update("prenom", v)}
        error={fieldErrors.prenom}
        autoCapitalize="words"
      />
      <TextField
        label="Téléphone"
        value={form.telephone}
        onChangeText={(v) => update("telephone", v)}
        error={fieldErrors.telephone}
        keyboardType="phone-pad"
      />
      <TextField
        label="Email"
        value={form.email}
        onChangeText={(v) => update("email", v)}
        error={fieldErrors.email}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <TextField
        label="Mot de passe"
        value={form.password}
        onChangeText={(v) => update("password", v)}
        error={fieldErrors.password}
        secureTextEntry
      />
      <TextField
        label="Confirmation du mot de passe"
        value={form.confirmPassword}
        onChangeText={(v) => update("confirmPassword", v)}
        error={fieldErrors.confirmPassword}
        secureTextEntry
      />

      {formError ? (
        <Text style={[typography.bodyMuted, { color: colors.danger, marginBottom: spacing.lg }]}>{formError}</Text>
      ) : null}

      <Button label="Créer mon compte" onPress={handleSubmit} loading={loading} />
      <Button label="J'ai déjà un compte" variant="ghost" onPress={() => navigation.navigate("Login")} />
    </ScreenContainer>
  );
}
