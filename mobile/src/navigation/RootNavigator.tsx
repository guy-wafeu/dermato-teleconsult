import React, { useCallback, useEffect } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { getCurrentUser, signOut, subscribeToAuthState } from "../services/auth/firebaseAuth";
import { getMyProfile } from "../services/api/patients";
import { getMyAdminProfile } from "../services/api/admin";
import { ApiError } from "../services/api/client";
import { useAuthStore } from "../store/authStore";
import { LoadingScreen } from "../screens/LoadingScreen";
import { AuthErrorScreen } from "../screens/AuthErrorScreen";
import { OnboardingScreen } from "../screens/onboarding/OnboardingScreen";
import { LoginScreen } from "../screens/auth/LoginScreen";
import { SignUpScreen } from "../screens/auth/SignUpScreen";
import { DashboardScreen } from "../screens/dashboard/DashboardScreen";
import { AdminNavigator } from "./AdminNavigator";
import { ConsultationNavigator } from "./ConsultationNavigator";
import type { RootStackParamList } from "./types";
import type { User } from "@react-native-firebase/auth";

const Stack = createNativeStackNavigator<RootStackParamList>();

// Un seul point de vérité pour "qui est connecté et avec quel rôle" : on écoute
// Firebase, puis on interroge le backend (source de vérité pour le rôle — voir
// Phase 2, "le rôle n'est pas un custom claim Firebase"). /patients/me d'abord (cas
// majoritaire), /admin/me en repli seulement si le compte n'est pas un patient.
export function RootNavigator() {
  const status = useAuthStore((s) => s.status);
  const errorMessage = useAuthStore((s) => s.errorMessage);
  const setLoading = useAuthStore((s) => s.setLoading);
  const setSignedOut = useAuthStore((s) => s.setSignedOut);
  const setNeedsProfile = useAuthStore((s) => s.setNeedsProfile);
  const setSignedInPatient = useAuthStore((s) => s.setSignedInPatient);
  const setSignedInAdmin = useAuthStore((s) => s.setSignedInAdmin);
  const setError = useAuthStore((s) => s.setError);

  // Extrait pour être rejouable depuis le bouton "Réessayer" (AuthErrorScreen) sans
  // dupliquer la logique de résolution de rôle.
  const resolveProfile = useCallback(
    async (user: User) => {
      setLoading();
      try {
        const patient = await getMyProfile();
        setSignedInPatient(patient);
        return;
      } catch (error) {
        // 403 = compte Firebase valide mais pas un profil patient : on tente
        // ensuite /admin/me. Toute autre erreur (réseau, 500...) ne veut PAS dire
        // "déconnecté" — la session Firebase est toujours valide, seul l'appel
        // serveur a échoué. La déconnexion silencieuse ici était le bug : un
        // patient bien connecté se retrouvait renvoyé sur l'écran de connexion
        // sans aucune explication dès que le réseau avait un hoquet.
        if (!(error instanceof ApiError) || error.status !== 403) {
          setError(
            error instanceof ApiError && error.status === 0
              ? "Impossible de joindre le serveur. Vérifiez votre connexion et réessayez."
              : "Une erreur est survenue. Réessayez.",
            user.uid,
          );
          return;
        }
      }

      try {
        const admin = await getMyAdminProfile();
        setSignedInAdmin(admin);
      } catch {
        // Compte Firebase valide mais sans profil patient ni admin : signup
        // interrompu avant l'appel à POST /patients/me.
        setNeedsProfile(user.uid);
      }
    },
    [setLoading, setSignedInPatient, setSignedInAdmin, setNeedsProfile, setError],
  );

  useEffect(() => {
    const unsubscribe = subscribeToAuthState(async (user) => {
      if (!user) {
        setSignedOut();
        return;
      }
      await resolveProfile(user);
    });

    return unsubscribe;
  }, [resolveProfile, setSignedOut]);

  function handleRetry() {
    const user = getCurrentUser();
    if (user) {
      resolveProfile(user);
    } else {
      setSignedOut();
    }
  }

  if (status === "loading") {
    return <LoadingScreen />;
  }

  if (status === "error") {
    return <AuthErrorScreen message={errorMessage} onRetry={handleRetry} onSignOut={() => signOut()} />;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {status === "signedOut" || status === "needsProfile" ? (
          <>
            <Stack.Screen name="Onboarding" component={OnboardingScreen} />
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="SignUp" component={SignUpScreen} />
          </>
        ) : status === "signedInPatient" ? (
          <>
            <Stack.Screen name="PatientDashboard" component={DashboardScreen} />
            <Stack.Screen name="NewConsultation" component={ConsultationNavigator} />
          </>
        ) : (
          <Stack.Screen name="AdminDashboard" component={AdminNavigator} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
