import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Step1PersonalInfo } from "../screens/consultation/Step1PersonalInfo";
import { Step2Problem } from "../screens/consultation/Step2Problem";
import { Step3LesionAspect } from "../screens/consultation/Step3LesionAspect";
import { Step4Context } from "../screens/consultation/Step4Context";
import { PhotosScreen } from "../screens/consultation/PhotosScreen";
import { ConsentAvailabilities } from "../screens/consultation/ConsentAvailabilities";
import { SummaryScreen } from "../screens/consultation/SummaryScreen";
import { ConfirmationScreen } from "../screens/consultation/ConfirmationScreen";
import type { ConsultationStackParamList } from "./consultationTypes";

const Stack = createNativeStackNavigator<ConsultationStackParamList>();

// Nouvelle instance de brouillon à chaque entrée dans ce flux : le store
// consultationDraftStore génère un clientUuid frais à l'import (voir sa définition)
// et n'est réinitialisé explicitement qu'après une soumission réussie (Summary) ou
// un abandon — reprendre un brouillon existant depuis le dashboard est un cas non
// couvert par ce passage de code (voir README, section "Limites connues").
export function ConsultationNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Step1PersonalInfo" component={Step1PersonalInfo} />
      <Stack.Screen name="Step2Problem" component={Step2Problem} />
      <Stack.Screen name="Step3LesionAspect" component={Step3LesionAspect} />
      <Stack.Screen name="Step4Context" component={Step4Context} />
      <Stack.Screen name="Photos" component={PhotosScreen} />
      <Stack.Screen name="ConsentAvailabilities" component={ConsentAvailabilities} />
      <Stack.Screen name="Summary" component={SummaryScreen} />
      <Stack.Screen name="Confirmation" component={ConfirmationScreen} />
    </Stack.Navigator>
  );
}
