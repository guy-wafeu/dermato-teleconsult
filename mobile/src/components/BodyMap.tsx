import React, { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Circle, Ellipse, Rect, Svg } from "react-native-svg";
import { useTheme } from "../theme/useTheme";

// Schéma corporel simplifié (pas anatomiquement précis, juste assez lisible pour
// pointer une zone) — même principe que les cartes du corps des applications de
// téléconsultation type OMS : une silhouette avant/arrière avec des zones tactiles
// larges plutôt que des contours anatomiques réels, pour rester utilisable au
// doigt sur un petit écran.
export const BODY_ZONE_LABELS: Record<string, string> = {
  tete: "Tête / visage",
  cou: "Cou",
  torse: "Torse (avant)",
  dos: "Dos",
  bras_droit: "Bras droit",
  bras_gauche: "Bras gauche",
  main_droite: "Main droite",
  main_gauche: "Main gauche",
  jambe_droite: "Jambe droite",
  jambe_gauche: "Jambe gauche",
  pied_droit: "Pied droit",
  pied_gauche: "Pied gauche",
};

type ShapeDef =
  | { code: string; kind: "circle"; cx: number; cy: number; r: number }
  | { code: string; kind: "rect"; x: number; y: number; width: number; height: number; rx: number }
  | { code: string; kind: "ellipse"; cx: number; cy: number; rx: number; ry: number };

// Vue de face : gauche/droite anatomiques telles qu'on les verrait en regardant la
// personne (donc inversées à l'écran — bras_droit du patient à gauche de l'image).
const FRONT_SHAPES: ShapeDef[] = [
  { code: "tete", kind: "circle", cx: 100, cy: 30, r: 22 },
  { code: "cou", kind: "rect", x: 90, y: 50, width: 20, height: 14, rx: 6 },
  { code: "torse", kind: "rect", x: 62, y: 62, width: 76, height: 100, rx: 20 },
  { code: "bras_droit", kind: "rect", x: 30, y: 66, width: 26, height: 100, rx: 13 },
  { code: "bras_gauche", kind: "rect", x: 144, y: 66, width: 26, height: 100, rx: 13 },
  { code: "main_droite", kind: "ellipse", cx: 43, cy: 178, rx: 16, ry: 18 },
  { code: "main_gauche", kind: "ellipse", cx: 157, cy: 178, rx: 16, ry: 18 },
  { code: "jambe_droite", kind: "rect", x: 64, y: 162, width: 32, height: 140, rx: 16 },
  { code: "jambe_gauche", kind: "rect", x: 104, y: 162, width: 32, height: 140, rx: 16 },
  { code: "pied_droit", kind: "ellipse", cx: 80, cy: 320, rx: 20, ry: 14 },
  { code: "pied_gauche", kind: "ellipse", cx: 120, cy: 320, rx: 20, ry: 14 },
];

// Vue de dos : la personne a pivoté à 180°, donc gauche/droite anatomiques sont
// inversées par rapport à la vue de face pour rester correctes (le bras droit du
// patient reste à droite de l'écran quand on le voit de dos).
const BACK_SHAPES: ShapeDef[] = [
  { code: "tete", kind: "circle", cx: 100, cy: 30, r: 22 },
  { code: "cou", kind: "rect", x: 90, y: 50, width: 20, height: 14, rx: 6 },
  { code: "dos", kind: "rect", x: 62, y: 62, width: 76, height: 100, rx: 20 },
  { code: "bras_gauche", kind: "rect", x: 30, y: 66, width: 26, height: 100, rx: 13 },
  { code: "bras_droit", kind: "rect", x: 144, y: 66, width: 26, height: 100, rx: 13 },
  { code: "main_gauche", kind: "ellipse", cx: 43, cy: 178, rx: 16, ry: 18 },
  { code: "main_droite", kind: "ellipse", cx: 157, cy: 178, rx: 16, ry: 18 },
  { code: "jambe_gauche", kind: "rect", x: 64, y: 162, width: 32, height: 140, rx: 16 },
  { code: "jambe_droite", kind: "rect", x: 104, y: 162, width: 32, height: 140, rx: 16 },
  { code: "pied_gauche", kind: "ellipse", cx: 80, cy: 320, rx: 20, ry: 14 },
  { code: "pied_droit", kind: "ellipse", cx: 120, cy: 320, rx: 20, ry: 14 },
];

interface BodyMapProps {
  selected: string[];
  onChange: (next: string[]) => void;
}

export function BodyMap({ selected, onChange }: BodyMapProps) {
  const { colors, spacing, radius, typography } = useTheme();
  const [view, setView] = useState<"front" | "back">("front");
  const shapes = view === "front" ? FRONT_SHAPES : BACK_SHAPES;

  function toggle(code: string) {
    onChange(selected.includes(code) ? selected.filter((c) => c !== code) : [...selected, code]);
  }

  function fillFor(code: string) {
    return selected.includes(code) ? colors.accent : colors.surfaceAlt;
  }
  function strokeFor(code: string) {
    return selected.includes(code) ? colors.accentStrong : colors.border;
  }

  return (
    <View>
      <View style={[styles.tabs, { marginBottom: spacing.md }]}>
        {(["front", "back"] as const).map((v) => {
          const isActive = v === view;
          return (
            <Pressable
              key={v}
              onPress={() => setView(v)}
              style={[
                styles.tab,
                {
                  borderRadius: radius.pill,
                  backgroundColor: isActive ? colors.accent : colors.surface,
                  borderColor: isActive ? colors.accent : colors.border,
                },
              ]}
            >
              <Text style={[typography.label, { color: isActive ? colors.onAccent : colors.textMuted }]}>
                {v === "front" ? "Vue de face" : "Vue de dos"}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View style={[styles.diagramWrap, { backgroundColor: colors.surfaceAlt, borderRadius: radius.lg }]}>
        <Svg width={200} height={350} viewBox="0 0 200 350">
          {shapes.map((shape) => {
            const common = {
              key: shape.code,
              fill: fillFor(shape.code),
              stroke: strokeFor(shape.code),
              strokeWidth: 1.5,
              onPress: () => toggle(shape.code),
            };
            if (shape.kind === "circle") return <Circle {...common} cx={shape.cx} cy={shape.cy} r={shape.r} />;
            if (shape.kind === "ellipse") return <Ellipse {...common} cx={shape.cx} cy={shape.cy} rx={shape.rx} ry={shape.ry} />;
            return <Rect {...common} x={shape.x} y={shape.y} width={shape.width} height={shape.height} rx={shape.rx} />;
          })}
        </Svg>
      </View>

      {selected.length > 0 ? (
        <View style={[styles.chips, { marginTop: spacing.md }]}>
          {selected.map((code) => (
            <Pressable
              key={code}
              onPress={() => toggle(code)}
              style={[styles.chip, { backgroundColor: colors.accentSoft, borderRadius: radius.pill }]}
            >
              <Text style={[typography.caption, { color: colors.accentStrong, fontWeight: "600" }]}>
                {BODY_ZONE_LABELS[code] ?? code} ✕
              </Text>
            </Pressable>
          ))}
        </View>
      ) : (
        <Text style={[typography.caption, { color: colors.textMuted, marginTop: spacing.md }]}>
          Touchez les zones du corps concernées (plusieurs choix possibles).
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  tabs: { flexDirection: "row", gap: 8 },
  tab: { paddingHorizontal: 16, paddingVertical: 8, borderWidth: 1.5 },
  diagramWrap: { alignItems: "center", paddingVertical: 12 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { paddingHorizontal: 12, paddingVertical: 6 },
});
