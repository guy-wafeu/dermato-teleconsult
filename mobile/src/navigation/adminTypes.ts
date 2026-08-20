import type { ConsultationStatus } from "../types/api";

export type AdminStackParamList = {
  AdminList: undefined;
  AdminConsultationsList: { initialFilter?: ConsultationStatus | "all" } | undefined;
  AdminConsultationDetail: { id: string };
  AdminEditConsultation: { id: string };
  // Mode terrain (voir screens/admin/AgentNewConsultationStart.tsx) : un admin
  // saisit un dossier complet pour une personne sans compte. AgentConsultation
  // englobe le même questionnaire que le parcours patient (ConsultationNavigator).
  AgentNewConsultationStart: undefined;
  AgentConsultation: undefined;
};
