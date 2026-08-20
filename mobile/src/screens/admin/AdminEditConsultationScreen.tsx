import React, { useEffect, useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { ScreenContainer } from "../../components/ScreenContainer";
import { Card } from "../../components/Card";
import { Button } from "../../components/Button";
import { TextField } from "../../components/TextField";
import { ChoiceGroup } from "../../components/ChoiceGroup";
import { YesNoToggle } from "../../components/YesNoToggle";
import { BodyMap } from "../../components/BodyMap";
import { useTheme } from "../../theme/useTheme";
import { getAdminConsultationDetail, updateConsultationFields } from "../../services/api/admin";
import { ApiError } from "../../services/api/client";
import type { AdminStackParamList } from "../../navigation/adminTypes";
import type { ConsultationDraft } from "../../types/api";

type Props = NativeStackScreenProps<AdminStackParamList, "AdminEditConsultation">;

const DUREE_UNITE_OPTIONS = [
  { value: "jours", label: "Jours" },
  { value: "semaines", label: "Semaines" },
  { value: "mois", label: "Mois" },
  { value: "annees", label: "Années" },
];
const DEMANGEAISON_OPTIONS = [
  { value: "oui", label: "Oui" },
  { value: "non", label: "Non" },
  { value: "parfois", label: "Parfois" },
  { value: "nuit", label: "Principalement le soir ou la nuit" },
];
const ENTOURAGE_OPTIONS = [
  { value: "oui", label: "Oui" },
  { value: "non", label: "Non" },
  { value: "ne_sait_pas", label: "Je ne sais pas" },
];

// Corrige le contenu d'un dossier déjà soumis — utile sur le terrain quand une
// erreur de saisie est repérée parmi de nombreux dossiers (voir
// PATCH /admin/consultations/:id/fields, qui accepte le même format que le
// brouillon patient). Ne couvre volontairement pas l'aspect des lésions
// (galerie photo) ni les disponibilités : la première nécessite un référentiel
// chargé séparément, la seconde se gère déjà via l'action "Confirmer le
// rendez-vous" sur la fiche dossier.
export function AdminEditConsultationScreen({ route, navigation }: Props) {
  const { id } = route.params;
  const { colors, spacing, typography } = useTheme();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["admin", "consultation", id],
    queryFn: () => getAdminConsultationDetail(id),
  });

  const [form, setForm] = useState<ConsultationDraft | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (query.data && !form) {
      setForm({ ...query.data });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query.data]);

  function patch(fields: Partial<ConsultationDraft>) {
    setForm((prev) => (prev ? { ...prev, ...fields } : prev));
  }

  const mutation = useMutation({
    mutationFn: (input: Partial<ConsultationDraft>) => updateConsultationFields(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "consultation", id] });
      queryClient.invalidateQueries({ queryKey: ["admin", "consultations"] });
      navigation.goBack();
    },
    onError: (err) => {
      setError(err instanceof ApiError ? err.message : "Impossible d'enregistrer les modifications.");
    },
  });

  function handleSave() {
    if (!form) return;
    setError(null);
    // On envoie tout le formulaire scalaire sauf lesionTypes/availabilities, que
    // cet écran ne modifie pas — les inclure (même vides) écraserait la sélection
    // existante côté serveur (voir updateConsultationFields côté admin.service.ts).
    const scalarFields: Partial<ConsultationDraft> = { ...form };
    delete scalarFields.lesionTypes;
    delete scalarFields.availabilities;
    mutation.mutate(scalarFields);
  }

  if (query.isLoading || !form) {
    return (
      <ScreenContainer>
        <ActivityIndicator color={colors.accent} />
      </ScreenContainer>
    );
  }

  if (query.isError) {
    return (
      <ScreenContainer>
        <Card>
          <Text style={[typography.body, { color: colors.text }]}>Impossible de charger ce dossier.</Text>
          <View style={{ marginTop: spacing.md }}>
            <Button label="Réessayer" variant="secondary" onPress={() => query.refetch()} />
          </View>
        </Card>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <Button label="← Annuler" variant="ghost" fullWidth={false} onPress={() => navigation.goBack()} />
      <Text style={[typography.h1, { color: colors.text, marginTop: spacing.lg, marginBottom: spacing.xxl }]}>
        Modifier le dossier
      </Text>

      <Text style={[typography.h2, { color: colors.text, marginBottom: spacing.md }]}>Identité</Text>
      <TextField label="Nom complet" value={form.nomComplet ?? ""} onChangeText={(v) => patch({ nomComplet: v })} />
      <ChoiceGroup
        options={[
          { value: "M", label: "Masculin" },
          { value: "F", label: "Féminin" },
        ]}
        selected={form.sexe ? [form.sexe] : []}
        onChange={([v]) => patch({ sexe: v as "M" | "F" })}
      />
      <TextField
        label="Âge"
        value={form.age ? String(form.age) : ""}
        onChangeText={(v) => patch({ age: v ? Number(v.replace(/[^0-9]/g, "")) : undefined })}
        keyboardType="number-pad"
        style={{ marginTop: spacing.lg }}
      />
      <TextField label="Ville" value={form.ville ?? ""} onChangeText={(v) => patch({ ville: v })} />
      <TextField label="Profession" value={form.profession ?? ""} onChangeText={(v) => patch({ profession: v })} />
      <TextField
        label="Numéro de téléphone"
        value={form.telephoneContact ?? ""}
        onChangeText={(v) => patch({ telephoneContact: v })}
        keyboardType="phone-pad"
      />
      <TextField
        label="Email"
        value={form.emailContact ?? ""}
        onChangeText={(v) => patch({ emailContact: v })}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <Text style={[typography.h2, { color: colors.text, marginTop: spacing.xxl, marginBottom: spacing.md }]}>
        Motif et symptômes
      </Text>
      <TextField
        label="Plainte"
        value={form.motif ?? ""}
        onChangeText={(v) => patch({ motif: v })}
        multiline
        numberOfLines={4}
        style={{ minHeight: 100, textAlignVertical: "top" }}
      />
      <TextField
        label="Durée (nombre)"
        value={form.dureeValeur ? String(form.dureeValeur) : ""}
        onChangeText={(v) => patch({ dureeValeur: v ? Number(v.replace(/[^0-9]/g, "")) : undefined })}
        keyboardType="number-pad"
        style={{ maxWidth: 140, marginTop: spacing.lg }}
      />
      <Text style={[typography.label, { color: colors.text, marginTop: spacing.sm, marginBottom: spacing.sm }]}>Unité</Text>
      <ChoiceGroup
        variant="pills"
        options={DUREE_UNITE_OPTIONS}
        selected={form.dureeUnite ? [form.dureeUnite] : []}
        onChange={([v]) => patch({ dureeUnite: v as ConsultationDraft["dureeUnite"] })}
      />
      <Text style={[typography.label, { color: colors.text, marginTop: spacing.xl, marginBottom: spacing.sm }]}>
        Démangeaisons
      </Text>
      <ChoiceGroup
        options={DEMANGEAISON_OPTIONS}
        selected={form.demangeaison ? [form.demangeaison] : []}
        onChange={([v]) => patch({ demangeaison: v as ConsultationDraft["demangeaison"] })}
      />

      <Text style={[typography.h2, { color: colors.text, marginTop: spacing.xxl, marginBottom: spacing.md }]}>
        Zones du corps touchées
      </Text>
      <BodyMap selected={form.lesionZones ?? []} onChange={(zones) => patch({ lesionZones: zones })} />

      <Text style={[typography.h2, { color: colors.text, marginTop: spacing.xxl, marginBottom: spacing.sm }]}>
        Autres lésions
      </Text>
      <YesNoToggle value={form.autresLesions} onChange={(v) => patch({ autresLesions: v })} />
      {form.autresLesions ? (
        <TextField
          label="Décrivez leur aspect"
          value={form.autresLesionsAspect ?? ""}
          onChangeText={(v) => patch({ autresLesionsAspect: v })}
          style={{ marginTop: spacing.lg }}
        />
      ) : null}

      <Text style={[typography.label, { color: colors.text, marginTop: spacing.xl, marginBottom: spacing.sm }]}>
        Zones sensibles atteintes
      </Text>
      <YesNoToggle value={form.zonesSensiblesAtteintes} onChange={(v) => patch({ zonesSensiblesAtteintes: v })} />
      {form.zonesSensiblesAtteintes ? (
        <TextField
          label="Précisez"
          value={form.zonesSensiblesPrecision ?? ""}
          onChangeText={(v) => patch({ zonesSensiblesPrecision: v })}
          style={{ marginTop: spacing.lg }}
        />
      ) : null}

      <Text style={[typography.h2, { color: colors.text, marginTop: spacing.xxl, marginBottom: spacing.md }]}>Contexte</Text>
      <Text style={[typography.label, { color: colors.text, marginBottom: spacing.sm }]}>Entourage</Text>
      <ChoiceGroup
        options={ENTOURAGE_OPTIONS}
        selected={form.entourageStatus ? [form.entourageStatus] : []}
        onChange={([v]) => patch({ entourageStatus: v as ConsultationDraft["entourageStatus"] })}
      />
      {form.entourageStatus === "oui" ? (
        <TextField
          label="Précisez"
          value={form.entouragePrecision ?? ""}
          onChangeText={(v) => patch({ entouragePrecision: v })}
          style={{ marginTop: spacing.lg }}
        />
      ) : null}

      <Text style={[typography.label, { color: colors.text, marginTop: spacing.xl, marginBottom: spacing.sm }]}>
        Produits utilisés
      </Text>
      <YesNoToggle value={form.produitsUtilises} onChange={(v) => patch({ produitsUtilises: v })} />
      {form.produitsUtilises ? (
        <TextField
          label="Précisez"
          value={form.produitsPrecision ?? ""}
          onChangeText={(v) => patch({ produitsPrecision: v })}
          style={{ marginTop: spacing.lg }}
        />
      ) : null}

      <Text style={[typography.label, { color: colors.text, marginTop: spacing.xl, marginBottom: spacing.sm }]}>
        Antécédents médicaux
      </Text>
      <YesNoToggle value={form.antecedentsMedicaux} onChange={(v) => patch({ antecedentsMedicaux: v })} />
      {form.antecedentsMedicaux ? (
        <TextField
          label="Précisez"
          value={form.antecedentsPrecision ?? ""}
          onChangeText={(v) => patch({ antecedentsPrecision: v })}
          style={{ marginTop: spacing.lg }}
        />
      ) : null}

      <TextField
        label="Notes complémentaires"
        value={form.notesComplementaires ?? ""}
        onChangeText={(v) => patch({ notesComplementaires: v })}
        multiline
        numberOfLines={3}
        style={{ minHeight: 80, textAlignVertical: "top", marginTop: spacing.lg }}
      />

      {error ? (
        <Text style={[typography.bodyMuted, { color: colors.danger, marginTop: spacing.lg }]}>{error}</Text>
      ) : null}

      <View style={{ marginTop: spacing.xl, marginBottom: spacing.xxl }}>
        <Button label="Enregistrer les modifications" onPress={handleSave} loading={mutation.isPending} />
      </View>
    </ScreenContainer>
  );
}
