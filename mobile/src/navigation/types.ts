// Un seul stack racine, dont le contenu change selon l'état d'auth (voir
// RootNavigator.tsx) plutôt que des navigateurs imbriqués Onboarding/Auth/App —
// plus simple à raisonner pour une V1, et suffisant tant qu'il n'y a pas de tabs
// avec état partagé à préserver entre les écrons patient.
export type RootStackParamList = {
  Onboarding: undefined;
  Login: undefined;
  SignUp: undefined;
  PatientDashboard: undefined;
  NewConsultation: undefined;
  AdminDashboard: undefined;
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
