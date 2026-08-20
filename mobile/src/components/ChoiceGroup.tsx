import React from "react";
import { Image, Pressable, StyleSheet, Text, View, useWindowDimensions, type ImageSourcePropType } from "react-native";
import { useTheme } from "../theme/useTheme";

export interface ChoiceOption {
  value: string;
  label: string;
  description?: string;
  image?: ImageSourcePropType;
}

interface ChoiceGroupProps {
  options: ChoiceOption[];
  selected: string[];
  onChange: (next: string[]) => void;
  multiple?: boolean;
  /** "cards" (défaut) : une carte pleine largeur par option, avec radio/case et
   * place pour une description ou une image — pour des choix qui méritent d'être
   * lus posément (aspect des lésions, démangeaisons...).
   * "pills" : puces compactes côte à côte — pour un petit choix fermé et court
   * (ex. l'unité d'une durée : Jours/Semaines/Mois/Années) où des cartes pleine
   * largeur prennent une place disproportionnée par rapport à l'information.
   * "gallery" : grille 2 colonnes, photo large en haut de chaque carte — pour un
   * choix où l'image EST l'information (aspect des lésions) : une vignette de
   * 56px ne permet pas de juger si "ça ressemble à ce que j'ai", une vraie photo
   * en grand le permet. */
  variant?: "cards" | "pills" | "gallery";
}

// Cases à cocher / boutons radio réinventés comme des cartes tactiles — plus simple
// à lire et à toucher qu'un vrai <input type=checkbox> sur mobile, et ça permet
// d'afficher une description sous le libellé (utile pour "Papules — petites
// lésions solides" etc.)
export function ChoiceGroup({ options, selected, onChange, multiple = false, variant = "cards" }: ChoiceGroupProps) {
  const { colors, spacing, radius, typography } = useTheme();
  const { width: windowWidth } = useWindowDimensions();
  // Une seule colonne, pleine largeur (voir ScreenContainer, plafonné à 640) : les
  // photos de référence servent de base à un diagnostic visuel du patient — en
  // grille 2 colonnes elles étaient trop petites pour être exploitables. Calculé
  // plutôt que fixe pour rester correct sur petit téléphone comme sur tablette.
  const contentWidth = Math.min(windowWidth, 640) - spacing.xxl * 2;
  const galleryCardWidth = contentWidth;

  function toggle(value: string) {
    if (multiple) {
      onChange(selected.includes(value) ? selected.filter((v) => v !== value) : [...selected, value]);
    } else {
      onChange([value]);
    }
  }

  if (variant === "gallery") {
    return (
      <View style={{ gap: spacing.lg }}>
        {options.map((option) => {
          const isSelected = selected.includes(option.value);
          return (
            <Pressable
              key={option.value}
              onPress={() => toggle(option.value)}
              accessibilityRole={multiple ? "checkbox" : "radio"}
              accessibilityState={{ checked: isSelected }}
              style={[
                styles.galleryCard,
                {
                  width: galleryCardWidth,
                  borderRadius: radius.lg,
                  borderColor: isSelected ? colors.accent : colors.border,
                  borderWidth: isSelected ? 3 : 1,
                  backgroundColor: colors.surface,
                },
              ]}
            >
              {option.image ? (
                <View>
                  <Image
                    source={option.image}
                    resizeMode="cover"
                    style={[styles.galleryImage, { borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg }]}
                  />
                  {isSelected ? (
                    <View style={[styles.galleryCheck, { backgroundColor: colors.accent }]}>
                      <Text style={{ color: colors.onAccent, fontWeight: "700", fontSize: 18 }}>✓</Text>
                    </View>
                  ) : null}
                </View>
              ) : null}
              <View style={{ padding: spacing.lg }}>
                <Text style={[typography.h2, { color: colors.text }]}>{option.label}</Text>
                {option.description ? (
                  <Text style={[typography.bodyMuted, { color: colors.textMuted, marginTop: 4 }]}>{option.description}</Text>
                ) : null}
              </View>
            </Pressable>
          );
        })}
      </View>
    );
  }

  if (variant === "pills") {
    return (
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }}>
        {options.map((option) => {
          const isSelected = selected.includes(option.value);
          return (
            <Pressable
              key={option.value}
              onPress={() => toggle(option.value)}
              accessibilityRole={multiple ? "checkbox" : "radio"}
              accessibilityState={{ checked: isSelected }}
              style={[
                styles.pill,
                {
                  borderRadius: radius.pill,
                  borderColor: isSelected ? colors.accent : colors.border,
                  backgroundColor: isSelected ? colors.accent : colors.surface,
                  paddingVertical: spacing.sm,
                  paddingHorizontal: spacing.lg,
                },
              ]}
            >
              <Text style={[typography.body, { color: isSelected ? colors.onAccent : colors.text, fontWeight: "600" }]}>
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    );
  }

  return (
    <View style={{ gap: spacing.sm }}>
      {options.map((option) => {
        const isSelected = selected.includes(option.value);
        return (
          <Pressable
            key={option.value}
            onPress={() => toggle(option.value)}
            accessibilityRole={multiple ? "checkbox" : "radio"}
            accessibilityState={{ checked: isSelected }}
            style={[
              styles.option,
              {
                borderRadius: radius.md,
                borderColor: isSelected ? colors.accent : colors.border,
                backgroundColor: isSelected ? colors.accentSoft : colors.surface,
                padding: spacing.lg,
              },
            ]}
          >
            <View
              style={[
                multiple ? styles.checkbox : styles.radio,
                {
                  borderColor: isSelected ? colors.accent : colors.textMuted,
                  backgroundColor: isSelected ? colors.accent : "transparent",
                },
              ]}
            />
            {option.image ? (
              <Image
                source={option.image}
                resizeMode="cover"
                style={[
                  styles.optionImage,
                  { borderRadius: radius.sm, marginLeft: spacing.md, borderColor: colors.border },
                ]}
              />
            ) : null}
            <View style={{ flex: 1, marginLeft: spacing.md }}>
              <Text style={[typography.body, { color: colors.text, fontWeight: "600" }]}>{option.label}</Text>
              {option.description ? (
                <Text style={[typography.caption, { color: colors.textMuted, marginTop: 2 }]}>{option.description}</Text>
              ) : null}
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  option: { flexDirection: "row", alignItems: "center", borderWidth: 1.5 },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2 },
  checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 2 },
  optionImage: { width: 56, height: 56, borderWidth: 1 },
  pill: { borderWidth: 1.5 },
  galleryCard: { overflow: "hidden" },
  galleryImage: { width: "100%", height: 260 },
  galleryCheck: {
    position: "absolute",
    top: 12,
    right: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
});
