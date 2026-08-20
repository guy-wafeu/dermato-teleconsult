import { sendSms } from "./sms.js";

export async function notifyConsultationSubmitted(telephone: string, refNumber: number): Promise<void> {
  await sendSms(
    telephone,
    `Dermato Téléconsultation : votre demande n°${String(refNumber).padStart(6, "0")} a bien été reçue. ` +
      `Un professionnel confirmera prochainement votre créneau.`,
  );
}
