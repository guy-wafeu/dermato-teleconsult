import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { useTheme } from "../theme/useTheme";

interface ProgressStepProps {
  currentStep: number;
  totalSteps: number;
}

// Barre de progression seule (le titre de l'étape est affiché par StepScreen, dans
// le même bandeau que le pictogramme — voir StepScreen.tsx) : même piste arrondie
// couleur accent que partout ailleurs dans l'app (onboarding, boutons...).
export function ProgressStep({ currentStep, totalSteps }: ProgressStepProps) {
  const { colors, spacing, radius, typography } = useTheme();
  const ratio = Math.min(Math.max(currentStep / totalSteps, 0), 1);

  return (
    <View style={{ marginBottom: spacing.xl }}>
      <View style={[styles.row, { marginBottom: spacing.sm }]}>
        <Text style={[typography.caption, { color: colors.accentStrong, fontWeight: "700" }]}>
          Étape {currentStep} sur {totalSteps}
        </Text>
        <Text style={[typography.caption, { color: colors.textMuted }]}>{Math.round(ratio * 100)}%</Text>
      </View>
      <View
        style={[styles.track, { backgroundColor: colors.surfaceAlt, borderRadius: radius.pill }]}
        accessibilityRole="progressbar"
        accessibilityValue={{ min: 0, max: totalSteps, now: currentStep }}
      >
        <View
          style={[
            styles.fill,
            { width: `${ratio * 100}%`, backgroundColor: colors.accent, borderRadius: radius.pill },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  track: { height: 6, overflow: "hidden" },
  fill: { height: "100%" },
});
