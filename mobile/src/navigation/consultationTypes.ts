// Questionnaire consolidé en 6 étapes (contre 13 auparavant) — pertinent pour un
// usage terrain où l'on remplit beaucoup de dossiers à la suite : moins d'écrans à
// enchaîner, chaque étape regroupant les questions qui se répondent ensemble
// naturellement (voir StepXxx.tsx pour le détail de chaque regroupement).
export type ConsultationStackParamList = {
  Step1PersonalInfo: undefined;
  Step2Problem: undefined;
  Step3LesionAspect: undefined;
  Step4Context: undefined;
  Photos: undefined;
  ConsentAvailabilities: undefined;
  Summary: undefined;
  Confirmation: { refNumber: number };
};

export const CONSULTATION_TOTAL_STEPS = 6;
