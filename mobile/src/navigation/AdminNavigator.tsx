import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { AdminDashboardScreen } from "../screens/admin/AdminDashboardScreen";
import { AdminConsultationsListScreen } from "../screens/admin/AdminConsultationsListScreen";
import { AdminConsultationDetailScreen } from "../screens/admin/AdminConsultationDetailScreen";
import { AdminEditConsultationScreen } from "../screens/admin/AdminEditConsultationScreen";
import { AgentNewConsultationStart } from "../screens/admin/AgentNewConsultationStart";
import { ConsultationNavigator } from "./ConsultationNavigator";
import type { AdminStackParamList } from "./adminTypes";

const Stack = createNativeStackNavigator<AdminStackParamList>();

export function AdminNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="AdminList" component={AdminDashboardScreen} />
      <Stack.Screen name="AdminConsultationsList" component={AdminConsultationsListScreen} />
      <Stack.Screen name="AdminConsultationDetail" component={AdminConsultationDetailScreen} />
      <Stack.Screen name="AdminEditConsultation" component={AdminEditConsultationScreen} />
      <Stack.Screen name="AgentNewConsultationStart" component={AgentNewConsultationStart} />
      {/* Réutilise intégralement le questionnaire patient (voir consultationDraftStore#mode
          et hooks/useIsDevPreview) — aucun écran dupliqué pour le mode terrain. */}
      <Stack.Screen name="AgentConsultation" component={ConsultationNavigator} />
    </Stack.Navigator>
  );
}
