// Design system : mêmes teintes que les documents d'architecture (accent teal
// clinique, neutres légèrement bleu-vert plutôt que gris pur). Un seul endroit à
// modifier pour changer la palette de toute l'app.

export const lightColors = {
  bg: "#F5F7F5",
  surface: "#FFFFFF",
  surfaceAlt: "#EBF0EC",
  text: "#16211D",
  textMuted: "#55655D",
  accent: "#0E6F63",
  accentStrong: "#0A5148",
  accentSoft: "#DCEEE9",
  border: "#DCE3DE",
  warn: "#9A6B24",
  warnSoft: "#F3E6D2",
  danger: "#A83A3A",
  dangerSoft: "#F5DEDE",
  onAccent: "#FFFFFF",
} as const;

export const darkColors = {
  bg: "#10161A",
  surface: "#161E22",
  surfaceAlt: "#1B2429",
  text: "#E7EDE9",
  textMuted: "#9AACA2",
  accent: "#46BBA4",
  accentStrong: "#6FD2BC",
  accentSoft: "#1C332E",
  border: "#2A343A",
  warn: "#E0A94F",
  warnSoft: "#33291A",
  danger: "#E37E7E",
  dangerSoft: "#362323",
  onAccent: "#0A1512",
} as const;

export type ThemeColors = typeof lightColors;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 40,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  pill: 999,
} as const;

export const typography = {
  display: { fontSize: 30, lineHeight: 36, fontWeight: "700" as const },
  h1: { fontSize: 24, lineHeight: 30, fontWeight: "700" as const },
  h2: { fontSize: 19, lineHeight: 25, fontWeight: "600" as const },
  body: { fontSize: 16, lineHeight: 23, fontWeight: "400" as const },
  bodyMuted: { fontSize: 15, lineHeight: 21, fontWeight: "400" as const },
  label: { fontSize: 13, lineHeight: 17, fontWeight: "600" as const },
  caption: { fontSize: 12, lineHeight: 16, fontWeight: "400" as const },
} as const;
