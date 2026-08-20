import React from "react";
import { StyleSheet, View } from "react-native";
import { Circle, Path, Svg } from "react-native-svg";

// Éléments purement décoratifs (vagues, pastilles, grille de points) réutilisés sur
// les écrans splash / onboarding / login pour donner le même habillage graphique que
// la maquette de référence, sans dépendre d'illustrations externes.

/** Vague pleine largeur, ancrée en bas de l'écran, en deux tons superposés. */
export function BottomWave({ soft, strong, height = 140 }: { soft: string; strong: string; height?: number }) {
  return (
    <View pointerEvents="none" style={[styles.bottom, { height }]}>
      <Svg width="100%" height="100%" viewBox="0 0 400 140" preserveAspectRatio="none">
        <Path d="M0,55 C110,110 290,0 400,50 L400,140 L0,140 Z" fill={soft} />
        <Path d="M0,90 C130,140 270,60 400,95 L400,140 L0,140 Z" fill={strong} />
      </Svg>
    </View>
  );
}

/** Grille discrète de points, calée dans un coin (haut-gauche par défaut). */
export function DotGrid({
  color,
  corner = "topLeft",
  rows = 3,
  cols = 3,
  gap = 12,
}: {
  color: string;
  corner?: "topLeft" | "topRight" | "bottomRight";
  rows?: number;
  cols?: number;
  gap?: number;
}) {
  const dots = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      dots.push(<Circle key={`${r}-${c}`} cx={c * gap + 4} cy={r * gap + 4} r={1.6} fill={color} />);
    }
  }
  const size = Math.max(rows, cols) * gap + 8;
  const positionStyle =
    corner === "topLeft"
      ? { top: 18, left: 18 }
      : corner === "topRight"
        ? { top: 18, right: 18 }
        : { bottom: 18, right: 18 };

  return (
    <View pointerEvents="none" style={[styles.absolute, positionStyle]}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {dots}
      </Svg>
    </View>
  );
}

/** Petit anneau flottant (cercle non rempli), purement décoratif. */
export function RingDecor({ color, size = 16, style }: { color: string; size?: number; style?: object }) {
  return (
    <View pointerEvents="none" style={[styles.absolute, style]}>
      <Svg width={size} height={size} viewBox="0 0 16 16">
        <Circle cx={8} cy={8} r={6.5} stroke={color} strokeWidth={1.6} fill="none" />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  bottom: { position: "absolute", left: 0, right: 0, bottom: 0 },
  absolute: { position: "absolute" },
});
