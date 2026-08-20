import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useTheme } from "../theme/useTheme";

interface YesNoToggleProps {
  value: boolean | undefined;
  onChange: (value: boolean) => void;
  yesLabel?: string;
  noLabel?: string;
}

export function YesNoToggle({ value, onChange, yesLabel = "Oui", noLabel = "Non" }: YesNoToggleProps) {
  const { colors, spacing, radius, typography } = useTheme();

  function renderOption(optionValue: boolean, label: string) {
    const isSelected = value === optionValue;
    return (
      <Pressable
        onPress={() => onChange(optionValue)}
        accessibilityRole="radio"
        accessibilityState={{ checked: isSelected }}
        style={[
          styles.option,
          {
            borderRadius: radius.md,
            borderColor: isSelected ? colors.accent : colors.border,
            backgroundColor: isSelected ? colors.accentSoft : colors.surface,
            paddingVertical: spacing.lg,
          },
        ]}
      >
        <Text style={[typography.body, { color: isSelected ? colors.accentStrong : colors.text, fontWeight: "600" }]}>
          {label}
        </Text>
      </Pressable>
    );
  }

  return (
    <View style={{ flexDirection: "row", gap: 12 }}>
      {renderOption(true, yesLabel)}
      {renderOption(false, noLabel)}
    </View>
  );
}

const styles = StyleSheet.create({
  option: { flex: 1, alignItems: "center", borderWidth: 1.5 },
});
