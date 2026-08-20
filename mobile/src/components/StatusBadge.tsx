import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { useTheme } from "../theme/useTheme";
import type { ConsultationStatus } from "../types/api";

const STATUS_LABELS: Record<ConsultationStatus, string> = {
  draft: "Brouillon",
  pending: "En attente",
  confirmed: "Confirmée",
  seen: "Consultée",
  completed: "Terminée",
  cancelled: "Annulée",
};

// Couleur sémantique distincte de l'accent de marque — un statut se lit d'un coup
// d'œil (forme + couleur), pas seulement au texte.
function toneFor(status: ConsultationStatus): "neutral" | "accent" | "warn" | "danger" {
  switch (status) {
    case "draft":
      return "neutral";
    case "pending":
      return "warn";
    case "confirmed":
    case "seen":
    case "completed":
      return "accent";
    case "cancelled":
      return "danger";
  }
}

export function StatusBadge({ status }: { status: ConsultationStatus }) {
  const { colors, radius, spacing, typography } = useTheme();
  const tone = toneFor(status);

  const background =
    tone === "accent" ? colors.accentSoft : tone === "warn" ? colors.warnSoft : tone === "danger" ? colors.dangerSoft : colors.surfaceAlt;
  const foreground =
    tone === "accent" ? colors.accentStrong : tone === "warn" ? colors.warn : tone === "danger" ? colors.danger : colors.textMuted;

  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: background, borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: spacing.xs },
      ]}
    >
      <Text style={[typography.caption, { color: foreground, fontWeight: "600" }]}>{STATUS_LABELS[status]}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { alignSelf: "flex-start" },
});
