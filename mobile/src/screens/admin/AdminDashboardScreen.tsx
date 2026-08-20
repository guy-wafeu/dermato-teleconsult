import React from "react";
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Card } from "../../components/Card";
import { OfflineBanner } from "../../components/OfflineBanner";
import { Icon, IconName } from "../../components/icons/Icon";
import { StatusBadge } from "../../components/StatusBadge";
import { useTheme } from "../../theme/useTheme";
import { useAuthStore } from "../../store/authStore";
import { signOut } from "../../services/auth/firebaseAuth";
import { getAdminStats, listAdminConsultations, type AdminStats } from "../../services/api/admin";
import { listMockAdminConsultations } from "../../services/devPreview/adminMock";
import type { AdminConsultationListItem } from "../../types/api";
import type { AdminStackParamList } from "../../navigation/adminTypes";

type Props = NativeStackScreenProps<AdminStackParamList, "AdminList">;

function isToday(iso: string): boolean {
  const d = new Date(iso);
  const now = new Date();
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
}

// Approximation dev preview uniquement (voir listMockAdminConsultations) : le
// backend expose de vrais compteurs (GET /admin/stats) qui, eux, ne sont jamais
// tronqués par une pagination — voir getAdminStats plus bas.
function computeMockStats(items: AdminConsultationListItem[]): AdminStats {
  return {
    participants: new Set(items.map((i) => i.patient.telephone)).size,
    pending: items.filter((i) => i.status === "pending").length,
    completed: items.filter((i) => i.status === "completed").length,
    today: items.filter((i) => isToday(i.createdAt)).length,
  };
}

function formatRelativeTime(iso: string): string {
  const diffMin = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (diffMin < 1) return "À l'instant";
  if (diffMin < 60) return `Il y a ${diffMin} min`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `Il y a ${diffH} h`;
  return `Il y a ${Math.floor(diffH / 24)} j`;
}

function formatDossierId(item: { refNumber: number; createdAt: string }): string {
  return `DC-${new Date(item.createdAt).getFullYear()}-${String(item.refNumber).padStart(5, "0")}`;
}

// Ce service (liste des participants distincts) n'a pas d'endpoint dédié — plutôt
// que de fabriquer un faux écran, on l'annonce honnêtement comme à venir (même
// logique que les tuiles "Services" de l'accueil patient, voir DashboardScreen).
function notifyComingSoon(label: string) {
  Alert.alert(label, "Cette fonctionnalité arrive prochainement.");
}

export function AdminDashboardScreen({ navigation }: Props) {
  const { colors, spacing, radius, typography } = useTheme();
  const admin = useAuthStore((s) => s.admin);
  const isDevPreview = admin?.id === "dev-preview-admin";

  // Compteurs réels (jamais tronqués par la pagination de la liste) — voir
  // GET /admin/stats côté backend (admin.service.ts#getAdminStats).
  const statsQuery = useQuery({
    queryKey: ["admin", "stats"],
    queryFn: () => getAdminStats(),
    enabled: !isDevPreview,
  });

  // Aperçu des 5 dossiers les plus récents seulement — le filtrage/recherche
  // complet vit sur l'écran "Tous les dossiers" (AdminConsultationsListScreen),
  // l'accueil ne fait qu'un survol.
  const recentQuery = useQuery({
    queryKey: ["admin", "consultations", "recent"],
    queryFn: () => listAdminConsultations({ limit: 5 }),
    enabled: !isDevPreview,
  });

  const isLoading = isDevPreview ? false : statsQuery.isLoading || recentQuery.isLoading;
  const isError = isDevPreview ? false : statsQuery.isError || recentQuery.isError;
  function refetch() {
    statsQuery.refetch();
    recentQuery.refetch();
  }
  const isRefetching = statsQuery.isRefetching || recentQuery.isRefetching;

  const mockItems = isDevPreview ? listMockAdminConsultations() : [];
  const dashboardStats: AdminStats = isDevPreview ? computeMockStats(mockItems) : (statsQuery.data ?? { participants: 0, pending: 0, completed: 0, today: 0 });

  const recent = isDevPreview
    ? [...mockItems].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5)
    : (recentQuery.data?.items ?? []);

  const stats: { icon: IconName; value: number; label: string; subtitle: string }[] = [
    { icon: "users", value: dashboardStats.participants, label: "Participants", subtitle: "Total inscrits" },
    { icon: "clipboard", value: dashboardStats.pending, label: "Dossiers en attente", subtitle: "À consulter" },
    { icon: "checkCircle", value: dashboardStats.completed, label: "Dossiers traités", subtitle: "Total traités" },
    { icon: "calendar", value: dashboardStats.today, label: "Consultations", subtitle: "Aujourd'hui" },
  ];

  const quickActions: { icon: IconName; label: string; subtitle: string; onPress: () => void }[] = [
    { icon: "users", label: "Voir participants", subtitle: "Consulter la liste des participants", onPress: () => notifyComingSoon("Voir participants") },
    {
      icon: "folder",
      label: "Tous les dossiers",
      subtitle: "Accéder à tous les dossiers",
      onPress: () => navigation.navigate("AdminConsultationsList", { initialFilter: "all" }),
    },
    {
      icon: "checkCircle",
      label: "Dossiers traités",
      subtitle: "Voir les dossiers déjà traités",
      onPress: () => navigation.navigate("AdminConsultationsList", { initialFilter: "completed" }),
    },
    {
      icon: "plus",
      label: "Nouveau dossier terrain",
      subtitle: "Pour une personne sans compte",
      onPress: () => navigation.navigate("AgentNewConsultationStart"),
    },
  ];

  function handleMenuPress() {
    Alert.alert("Menu", undefined, [
      { text: "Se déconnecter", style: "destructive", onPress: () => signOut() },
      { text: "Annuler", style: "cancel" },
    ]);
  }

  function handleBellPress() {
    Alert.alert(
      "Notifications",
      dashboardStats.pending > 0
        ? `${dashboardStats.pending} dossier${dashboardStats.pending > 1 ? "s" : ""} en attente de traitement.`
        : "Aucune nouvelle notification.",
    );
  }

  function renderRecentItem(item: AdminConsultationListItem, index: number) {
    const initials = `${item.patient.prenom[0] ?? ""}${item.patient.nom[0] ?? ""}`.toUpperCase();
    return (
      <Pressable
        key={item.id}
        onPress={() => navigation.navigate("AdminConsultationDetail", { id: item.id })}
        style={[
          styles.recentRow,
          { paddingVertical: spacing.md, borderTopWidth: index === 0 ? 0 : 1, borderTopColor: colors.border },
        ]}
      >
        <View style={[styles.avatar, { backgroundColor: colors.accentSoft, marginRight: spacing.md }]}>
          <Text style={[typography.label, { color: colors.accentStrong }]}>{initials}</Text>
        </View>
        <View style={{ flex: 1, marginRight: spacing.sm }}>
          <Text style={[typography.body, { color: colors.text, fontWeight: "700" }]}>
            {item.patient.prenom} {item.patient.nom}
          </Text>
          <Text style={[typography.bodyMuted, { color: colors.textMuted, marginTop: 2 }]} numberOfLines={1}>
            {item.motif ?? "Motif non renseigné"}
          </Text>
          <Text style={[typography.caption, { color: colors.textMuted, marginTop: 2 }]}>ID: {formatDossierId(item)}</Text>
        </View>
        <View style={{ alignItems: "flex-end" }}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <StatusBadge status={item.status} />
            <Icon name="chevronRight" size={18} color={colors.textMuted} />
          </View>
          <Text style={[typography.caption, { color: colors.textMuted, marginTop: spacing.sm }]}>
            {formatRelativeTime(item.createdAt)}
          </Text>
        </View>
      </Pressable>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <OfflineBanner />
      <ScrollView contentContainerStyle={{ paddingBottom: spacing.xxl }}>
        <View style={{ paddingHorizontal: spacing.xxl, paddingTop: spacing.lg }}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Pressable
              onPress={handleMenuPress}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Menu"
              style={{ padding: spacing.xs, marginRight: spacing.md }}
            >
              <Icon name="menu" size={22} color={colors.text} />
            </Pressable>
            <View style={{ flex: 1 }}>
              <Text style={typography.display}>
                <Text style={{ color: colors.text }}>Bonjour, </Text>
                <Text style={{ color: colors.accentStrong }}>{admin?.prenom ?? "Admin"}</Text>
              </Text>
              <Text style={[typography.bodyMuted, { color: colors.textMuted }]}>Voici un aperçu de votre activité</Text>
            </View>
            <Pressable onPress={handleBellPress} hitSlop={8} accessibilityRole="button" accessibilityLabel="Notifications" style={{ padding: spacing.xs }}>
              <Icon name="bell" size={24} color={colors.text} />
              {dashboardStats.pending > 0 ? <View style={[styles.dot, { backgroundColor: colors.warn }]} /> : null}
            </Pressable>
          </View>

          <View style={[styles.statsGrid, { marginTop: spacing.xl }]}>
            {stats.map((stat) => (
              <Card key={stat.label} style={{ width: "48%", marginBottom: spacing.md }}>
                <View style={[styles.statIcon, { backgroundColor: colors.accentSoft, marginBottom: spacing.md }]}>
                  <Icon name={stat.icon} size={20} color={colors.accentStrong} />
                </View>
                <Text style={[typography.display, { color: colors.text }]}>{isLoading ? "–" : stat.value}</Text>
                <Text style={[typography.body, { color: colors.text, fontWeight: "700", marginTop: 2 }]}>{stat.label}</Text>
                <Text style={[typography.caption, { color: colors.textMuted, marginTop: 2 }]}>{stat.subtitle}</Text>
              </Card>
            ))}
          </View>
        </View>

        <View style={{ paddingHorizontal: spacing.xxl, marginTop: spacing.md }}>
          <Card>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <Text style={[typography.h2, { color: colors.text }]}>Consultations récentes</Text>
              <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.md }}>
                {isRefetching ? (
                  <ActivityIndicator size="small" color={colors.accent} />
                ) : (
                  <Pressable onPress={refetch} hitSlop={8}>
                    <Text style={[typography.label, { color: colors.accentStrong }]}>Actualiser</Text>
                  </Pressable>
                )}
                <Pressable onPress={() => navigation.navigate("AdminConsultationsList", { initialFilter: "all" })} hitSlop={8}>
                  <Text style={[typography.label, { color: colors.accentStrong }]}>Voir tout</Text>
                </Pressable>
              </View>
            </View>

            {isLoading ? (
              <View style={{ paddingVertical: spacing.xxl, alignItems: "center" }}>
                <ActivityIndicator color={colors.accent} />
              </View>
            ) : isError ? (
              <View style={{ paddingVertical: spacing.lg, alignItems: "center" }}>
                <Text style={[typography.bodyMuted, { color: colors.textMuted, marginBottom: spacing.sm }]}>
                  Impossible de charger les dossiers.
                </Text>
                <Pressable onPress={() => refetch()}>
                  <Text style={[typography.label, { color: colors.accentStrong }]}>Réessayer</Text>
                </Pressable>
              </View>
            ) : recent.length === 0 ? (
              <Text style={[typography.bodyMuted, { color: colors.textMuted, paddingVertical: spacing.lg }]}>
                Aucun dossier pour le moment.
              </Text>
            ) : (
              recent.map(renderRecentItem)
            )}
          </Card>
        </View>

        <View style={{ paddingHorizontal: spacing.xxl, marginTop: spacing.xl }}>
          <Card>
            <Text style={[typography.h2, { color: colors.text, marginBottom: spacing.md }]}>Actions rapides</Text>
            <View style={{ flexDirection: "row", gap: spacing.sm }}>
              {quickActions.map((action) => (
                <Pressable key={action.label} onPress={action.onPress} style={{ flex: 1 }}>
                  <View style={[styles.actionTile, { borderColor: colors.border }]}>
                    <Icon name={action.icon} size={20} color={colors.accentStrong} />
                    <Text style={[typography.caption, { color: colors.text, fontWeight: "700", textAlign: "center", marginTop: spacing.sm }]}>
                      {action.label}
                    </Text>
                    <Text style={[typography.caption, { color: colors.textMuted, textAlign: "center", marginTop: 2, fontSize: 10, lineHeight: 13 }]}>
                      {action.subtitle}
                    </Text>
                  </View>
                </Pressable>
              ))}
            </View>
          </Card>
        </View>
      </ScrollView>

      <View style={[styles.tabBar, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
        <View style={[styles.tabItem, { backgroundColor: colors.accentSoft, borderRadius: radius.md }]}>
          <Icon name="home" size={20} color={colors.accentStrong} />
          <Text style={[typography.caption, { color: colors.accentStrong, fontWeight: "700", marginTop: 2 }]}>Accueil</Text>
        </View>
        <Pressable style={styles.tabItem} onPress={() => notifyComingSoon("Participants")}>
          <Icon name="users" size={20} color={colors.textMuted} />
          <Text style={[typography.caption, { color: colors.textMuted, marginTop: 2 }]}>Participants</Text>
        </Pressable>
        <Pressable style={styles.tabItem} onPress={() => navigation.navigate("AdminConsultationsList", { initialFilter: "all" })}>
          <Icon name="folder" size={20} color={colors.textMuted} />
          <Text style={[typography.caption, { color: colors.textMuted, marginTop: 2 }]}>Dossiers</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  statsGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" },
  statIcon: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  recentRow: { flexDirection: "row", alignItems: "flex-start" },
  avatar: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  dot: { position: "absolute", top: 4, right: 4, width: 8, height: 8, borderRadius: 4 },
  actionTile: { borderWidth: 1, borderRadius: 12, paddingVertical: 12, paddingHorizontal: 6, alignItems: "center" },
  tabBar: { flexDirection: "row", borderTopWidth: 1, paddingTop: 8, paddingBottom: 8, paddingHorizontal: 12 },
  tabItem: { flex: 1, alignItems: "center", paddingVertical: 8, marginHorizontal: 4 },
});
