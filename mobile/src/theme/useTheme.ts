import { lightColors, radius, spacing, typography } from "./tokens";

// Thème clair forcé, indépendamment du mode système du téléphone — décision produit
// explicite (voir demande utilisateur) : l'app ne doit jamais basculer en sombre.
export function useTheme() {
  return { colors: lightColors, spacing, radius, typography, scheme: "light" as const };
}

export type Theme = ReturnType<typeof useTheme>;
