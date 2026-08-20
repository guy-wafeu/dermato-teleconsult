import React, { PropsWithChildren } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../theme/useTheme";
import { OfflineBanner } from "./OfflineBanner";

interface ScreenContainerProps {
  scroll?: boolean;
  padded?: boolean;
  /** Centre le contenu verticalement (écrans courts : connexion, inscription...)
   * plutôt que de le coller en haut. Sans effet si le contenu dépasse l'écran. */
  center?: boolean;
}

export function ScreenContainer({
  children,
  scroll = true,
  padded = true,
  center = false,
}: PropsWithChildren<ScreenContainerProps>) {
  const { colors, spacing } = useTheme();
  // Largeur plafonnée et centrée : sur téléphone ça ne change rien (l'écran est
  // presque toujours plus étroit que 640), mais sur tablette ça évite des champs de
  // formulaire et des lignes de texte étirés sur toute la largeur, illisibles.
  const content = (
    <View
      style={[!scroll && styles.flex, styles.maxWidth, padded ? { padding: spacing.xxl } : undefined]}
    >
      {children}
    </View>
  );

  return (
    <SafeAreaView style={[styles.flex, { backgroundColor: colors.bg }]}>
      <OfflineBanner />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 16 : 0}
      >
        {scroll ? (
          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={[styles.flexGrow, styles.center, center && styles.justifyCenter]}
          >
            {content}
          </ScrollView>
        ) : (
          <View style={[styles.flex, styles.center, center && styles.justifyCenter]}>{content}</View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  flexGrow: { flexGrow: 1 },
  center: { alignItems: "center" },
  justifyCenter: { justifyContent: "center" },
  maxWidth: { width: "100%", maxWidth: 640 },
});
