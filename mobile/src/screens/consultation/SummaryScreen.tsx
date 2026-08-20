import React, { useState } from "react";
import { Pressable, Text, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { ScreenContainer } from "../../components/ScreenContainer";
import { Card } from "../../components/Card";
import { Button } from "../../components/Button";
import { Icon } from "../../components/icons/Icon";
import { BODY_ZONE_LABELS } from "../../components/BodyMap";
import { useTheme } from "../../theme/useTheme";
import { useConsultationDraftStore } from "../../store/consultationDraftStore";
import { useIsDevPreview } from "../../hooks/useIsDevPreview";
import { submitConsultation } from "../../services/api/consultations";
import { submitWalkInConsultation } from "../../services/api/agent";
import { ApiError } from "../../services/api/client";
import type { ConsultationStackParamList } from "../../navigation/consultationTypes";

type Props = NativeStackScreenProps<ConsultationStackParamList, "Summary">;

const DUREE_UNITE_LABELS: Record<string, string> = { jours: "jour(s)", semaines: "semaine(s)", mois: "mois", annees: "année(s)" };

export function SummaryScreen({ navigation }: Props) {
  const { colors, spacing, radius, typography } = useTheme();
  const mode = useConsultationDraftStore((s) => s.mode);
  const draft = useConsultationDraftStore((s) => s.draft);
  const photos = useConsultationDraftStore((s) => s.photos);
  const consultationId = useConsultationDraftStore((s) => s.consultationId);
  const reset = useConsultationDraftStore((s) => s.reset);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isDevPreview = useIsDevPreview();

  function Section({
    title,
    onEdit,
    children,
  }: {
    title: string;
    onEdit: () => void;
    children: React.ReactNode;
  }) {
    return (
      <Card style={{ marginBottom: spacing.md }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.sm }}>
          <Text style={[typography.h2, { color: colors.text }]}>{title}</Text>
          <Pressable onPress={onEdit} hitSlop={8}>
            <Text style={[typography.label, { color: colors.accentStrong }]}>Modifier</Text>
          </Pressable>
        </View>
        {children}
      </Card>
    );
  }

  function Field({ label, value }: { label: string; value: string | undefined | null }) {
    if (!value) return null;
    return (
      <Text style={[typography.bodyMuted, { color: colors.textMuted, marginBottom: 4 }]}>
        <Text style={{ color: colors.text }}>{label} : </Text>
        {value}
      </Text>
    );
  }

  async function handleSubmit() {
    if (submitting) return;
    if (isDevPreview) {
      reset();
      navigation.reset({ index: 0, routes: [{ name: "Confirmation", params: { refNumber: 999999 } }] });
      return;
    }
    if (!consultationId) return;
    setSubmitting(true);
    setError(null);
    try {
      const result = mode === "agent" ? await submitWalkInConsultation(consultationId) : await submitConsultation(consultationId);
      const refNumber = result.refNumber;
      reset();
      navigation.reset({ index: 0, routes: [{ name: "Confirmation", params: { refNumber } }] });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Impossible d'envoyer votre demande. Réessayez.");
      setSubmitting(false);
    }
  }

  return (
    <ScreenContainer>
      <View style={{ flexDirection: "row", alignItems: "center", marginBottom: spacing.xxl }}>
        <View
          style={{
            width: 48,
            height: 48,
            borderRadius: radius.lg,
            backgroundColor: colors.accentSoft,
            alignItems: "center",
            justifyContent: "center",
            marginRight: spacing.md,
          }}
        >
          <Icon name="checkCircle" size={24} color={colors.accentStrong} strokeWidth={1.6} />
        </View>
        <Text style={[typography.h1, { color: colors.text, flex: 1 }]}>Vérifiez votre demande</Text>
      </View>

      <Section title="Informations personnelles" onEdit={() => navigation.navigate("Step1PersonalInfo")}>
        <Field label="Nom complet" value={draft.nomComplet} />
        <Field label="Âge" value={draft.age ? String(draft.age) : undefined} />
        <Field label="Téléphone" value={draft.telephoneContact} />
        <Field label="Confirmation par WhatsApp" value={draft.confirmationWhatsapp === undefined ? undefined : draft.confirmationWhatsapp ? "Oui" : "Non"} />
        <Field label="Ville" value={draft.ville} />
      </Section>

      <Section title="Votre problème" onEdit={() => navigation.navigate("Step2Problem")}>
        <Field label="Plainte" value={draft.motif} />
        <Field
          label="Démangeaisons"
          value={draft.demangeaison ? { oui: "Oui", non: "Non", parfois: "Parfois", nuit: "Le soir ou la nuit" }[draft.demangeaison] : undefined}
        />
        <Field
          label="Depuis"
          value={draft.dureeValeur && draft.dureeUnite ? `${draft.dureeValeur} ${DUREE_UNITE_LABELS[draft.dureeUnite]}` : undefined}
        />
      </Section>

      <Section title="Aspect des lésions" onEdit={() => navigation.navigate("Step3LesionAspect")}>
        <Field label="Aspects sélectionnés" value={draft.lesionTypes?.map((l) => l.code).join(", ")} />
        <Field
          label="Zones du corps"
          value={draft.lesionZones?.length ? draft.lesionZones.map((z) => BODY_ZONE_LABELS[z] ?? z).join(", ") : undefined}
        />
      </Section>

      <Section title="Contexte" onEdit={() => navigation.navigate("Step4Context")}>
        <Field label="Maladie chronique / traitement suivi" value={draft.antecedentsMedicaux ? "Oui" : "Non"} />
      </Section>

      <Section title="Photos" onEdit={() => navigation.navigate("Photos")}>
        <Field label="Photos ajoutées" value={`${photos.filter((p) => p.status === "uploaded").length}`} />
        <Field label="Qualité confirmée" value={draft.photosQualiteConfirmee === undefined ? undefined : draft.photosQualiteConfirmee ? "Oui" : "Non"} />
      </Section>

      <Section title="Consentement & disponibilités" onEdit={() => navigation.navigate("ConsentAvailabilities")}>
        <Field label="Créneaux sélectionnés" value={`${draft.availabilities?.length ?? 0}`} />
      </Section>

      {error ? (
        <Text style={[typography.bodyMuted, { color: colors.danger, marginTop: spacing.md, marginBottom: spacing.md }]}>
          {error}
        </Text>
      ) : null}

      <View style={{ marginTop: spacing.lg }}>
        <Button label="Envoyer ma demande" onPress={handleSubmit} loading={submitting} disabled={submitting} />
      </View>
    </ScreenContainer>
  );
}
