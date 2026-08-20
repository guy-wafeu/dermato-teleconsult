import React, { useEffect, useRef, useState } from "react";
import {
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../../theme/useTheme";
import { Icon, IconName } from "../../components/icons/Icon";
import { BottomWave, DotGrid, RingDecor } from "../../components/decor/Waves";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../../navigation/types";

const SLIDES: { title: string; body: string; icon: IconName }[] = [
  {
    title: "Consultez un dermatologue à distance",
    body: "Un dossier complet, transmis en toute sécurité, sans déplacement.",
    icon: "message",
  },
  {
    title: "Décrivez votre problème",
    body: "Un questionnaire clair, en plusieurs étapes courtes.",
    icon: "clipboard",
  },
  {
    title: "Ajoutez des photos de bonne qualité",
    body: "Des conseils simples pour des photos exploitables par le dermatologue.",
    icon: "camera",
  },
  {
    title: "Choisissez vos disponibilités",
    body: "Indiquez les créneaux qui vous conviennent.",
    icon: "calendar",
  },
  {
    title: "Recevez la confirmation de votre consultation",
    body: "Un accusé de réception et un suivi du statut de votre dossier.",
    icon: "checkCircle",
  },
];

type Props = NativeStackScreenProps<RootStackParamList, "Onboarding">;

export function OnboardingScreen({ navigation }: Props) {
  const { colors, spacing, radius, typography } = useTheme();
  const { width } = useWindowDimensions();
  const [index, setIndex] = useState(0);
  const scrollRef = useRef<ScrollView>(null);
  const isLast = index === SLIDES.length - 1;

  function handleScrollEnd(event: NativeSyntheticEvent<NativeScrollEvent>) {
    const nextIndex = Math.round(event.nativeEvent.contentOffset.x / width);
    setIndex(nextIndex);
  }

  // useWindowDimensions est déjà réactif à la rotation/au redimensionnement (pliable,
  // fenêtre flottante sur tablette) — mais le ScrollView paginé garde sa position en
  // pixels : sans ce recalage, une rotation en cours de lecture laisse l'utilisateur
  // entre deux slides au lieu de rester sur la slide affichée.
  useEffect(() => {
    scrollRef.current?.scrollTo({ x: index * width, animated: false });
  }, [width, index]);

  function goNext() {
    if (isLast) {
      navigation.navigate("SignUp");
      return;
    }
    const nextIndex = index + 1;
    setIndex(nextIndex);
    scrollRef.current?.scrollTo({ x: nextIndex * width, animated: true });
  }

  return (
    <SafeAreaView style={[styles.flex, { backgroundColor: colors.bg }]}>
      <DotGrid color={colors.border} corner="topRight" rows={4} cols={4} gap={11} />
      <RingDecor color={colors.border} size={20} style={{ top: 96, right: 34 }} />
      <RingDecor color={colors.border} size={14} style={{ bottom: 210, left: 18 }} />
      <BottomWave soft={colors.accentSoft} strong={colors.surfaceAlt} height={90} />

      <View style={[styles.brand, { paddingTop: spacing.xxl }]}>
        <Text style={typography.h2}>
          <Text style={{ color: colors.accentStrong, fontWeight: "800" }}>DERMATO</Text>
          <Text style={{ color: colors.text, fontWeight: "700" }}>TÉLÉCONSULT</Text>
        </Text>
        <Text style={[typography.caption, { color: colors.accent, letterSpacing: 1.2, marginTop: 2 }]}>
          TÉLÉCONSULTATION DERMATOLOGIQUE
        </Text>
      </View>

      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScrollEnd}
        accessibilityRole="adjustable"
        style={styles.flex}
      >
        {SLIDES.map((slide) => (
          <View key={slide.title} style={[styles.slide, { width, padding: spacing.xxl }]}>
            <View style={[styles.blob, { backgroundColor: colors.accentSoft }]}>
              <Icon name={slide.icon} size={64} color={colors.accentStrong} strokeWidth={1.4} />
            </View>
            <Text style={[typography.display, { color: colors.text, marginTop: spacing.xxxl, textAlign: "center" }]}>
              {slide.title}
            </Text>
            <Text style={[typography.body, { color: colors.textMuted, marginTop: spacing.md, textAlign: "center" }]}>
              {slide.body}
            </Text>
          </View>
        ))}
      </ScrollView>

      <View style={{ paddingBottom: spacing.huge }}>
        <View style={[styles.dots, { marginBottom: spacing.xxl }]}>
          {SLIDES.map((slide, i) => (
            <View
              key={slide.title}
              style={[
                styles.dot,
                {
                  backgroundColor: i === index ? colors.accent : colors.border,
                  width: i === index ? 20 : 6,
                },
              ]}
            />
          ))}
        </View>

        <View style={[styles.bottomRow, { paddingHorizontal: spacing.xxl }]}>
          <Pressable
            onPress={() => navigation.navigate("Login")}
            accessibilityRole="button"
            style={[styles.skipPill, { borderColor: colors.accent, borderRadius: radius.pill }]}
          >
            <Text style={[typography.label, { color: colors.accentStrong }]}>PASSER</Text>
          </Pressable>

          <Pressable
            onPress={goNext}
            accessibilityRole="button"
            accessibilityLabel={isLast ? "Commencer" : "Slide suivante"}
            style={[styles.nextButton, { backgroundColor: colors.accent, borderRadius: radius.pill }]}
          >
            <Icon name="arrowRight" size={22} color={colors.onAccent} />
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  brand: { alignItems: "center" },
  slide: { alignItems: "center", justifyContent: "center" },
  blob: { width: 176, height: 176, borderRadius: 88, alignItems: "center", justifyContent: "center" },
  dots: { flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 6 },
  dot: { height: 6, borderRadius: 999 },
  bottomRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  skipPill: { borderWidth: 1.5, paddingHorizontal: 22, paddingVertical: 12 },
  nextButton: { width: 52, height: 52, alignItems: "center", justifyContent: "center" },
});
