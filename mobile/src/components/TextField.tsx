import React, { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, TextInputProps, View } from "react-native";
import { useTheme } from "../theme/useTheme";
import { Icon, IconName } from "./icons/Icon";

interface TextFieldProps extends TextInputProps {
  label: string;
  error?: string;
  helperText?: string;
  /** Icône affichée à gauche du champ (mail, lock, ...). */
  icon?: IconName;
  /** Ajoute un bouton œil / œil barré pour afficher-masquer un mot de passe.
   * Ne s'applique que si `secureTextEntry` est utilisé. */
  revealable?: boolean;
}

export function TextField({ label, error, helperText, icon, revealable, style, secureTextEntry, ...inputProps }: TextFieldProps) {
  const { colors, spacing, radius, typography } = useTheme();
  const [revealed, setRevealed] = useState(false);
  const showToggle = revealable && secureTextEntry !== undefined;
  // Layout enrichi (icône, œil œil-barré) seulement si demandé explicitement — les
  // écrans existants (souvent multiline, avec des styles de hauteur personnalisés)
  // gardent le TextInput bordé d'origine pour ne rien casser.
  const enriched = Boolean(icon) || showToggle;

  return (
    <View style={{ marginBottom: spacing.lg }}>
      <Text style={[typography.label, { color: colors.text, marginBottom: spacing.xs }]}>{label}</Text>
      {enriched ? (
        <View
          style={[
            styles.inputWrap,
            {
              backgroundColor: colors.surface,
              borderColor: error ? colors.danger : colors.border,
              borderRadius: radius.md,
            },
          ]}
        >
          {icon ? (
            <View style={styles.leftIcon}>
              <Icon name={icon} size={19} color={colors.textMuted} />
            </View>
          ) : null}
          <TextInput
            {...inputProps}
            secureTextEntry={showToggle ? !revealed : secureTextEntry}
            accessibilityLabel={label}
            placeholderTextColor={colors.textMuted}
            style={[typography.body, styles.input, { color: colors.text }, style]}
          />
          {showToggle ? (
            <Pressable
              onPress={() => setRevealed((v) => !v)}
              hitSlop={8}
              style={styles.rightIcon}
              accessibilityRole="button"
              accessibilityLabel={revealed ? "Masquer le mot de passe" : "Afficher le mot de passe"}
            >
              <Icon name={revealed ? "eyeOff" : "eye"} size={19} color={colors.textMuted} />
            </Pressable>
          ) : null}
        </View>
      ) : (
        <TextInput
          {...inputProps}
          secureTextEntry={secureTextEntry}
          accessibilityLabel={label}
          placeholderTextColor={colors.textMuted}
          style={[
            typography.body,
            styles.legacyInput,
            {
              color: colors.text,
              backgroundColor: colors.surface,
              borderColor: error ? colors.danger : colors.border,
              borderRadius: radius.md,
            },
            style,
          ]}
        />
      )}
      {error ? (
        <Text style={[typography.caption, { color: colors.danger, marginTop: spacing.xs }]}>{error}</Text>
      ) : helperText ? (
        <Text style={[typography.caption, { color: colors.textMuted, marginTop: spacing.xs }]}>{helperText}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 48,
    borderWidth: 1,
  },
  leftIcon: { paddingLeft: 14 },
  rightIcon: { paddingRight: 14, paddingLeft: 6 },
  input: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  legacyInput: {
    minHeight: 48,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
});
