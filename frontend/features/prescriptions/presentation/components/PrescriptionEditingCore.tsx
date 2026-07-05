/**
 * R3B (T-B.4, ADR-R3B-05) — canonical Prescription field-editing core.
 * Moved, unchanged in behavior, from
 * `features/episodes/presentation/components/ConsultationSections/PrescriptionSection.tsx`
 * (its Phase 3A origin) into this shared, context-agnostic location so both
 * `PrescriptionModule` (workspace) and the future standalone wrapper (T-B.5)
 * can host the same component. Takes identifiers/data/save-callback as
 * props (design §8) — no context hook calls (ADR-R3B-01).
 *
 * Unlike Case Sheet's canonical core (T-B.1), Prescription is explicit-save
 * in BOTH contexts today (`PrescriptionModule` has no autosave — its own
 * header comment confirms this), so the "Save Prescription" button is core-
 * shared behavior and stays inside this component, taking `onSave` as a
 * prop — matching design §8 step 1's own text ("takes its identifiers and
 * save-callback as props").
 *
 * `PrescriptionModule`'s own "Mark as Not Required" button is NOT part of
 * this core — confirmed via `grep` across `features/prescriptions/` that
 * neither `PrescriptionForm.tsx` nor the standalone screens have any
 * equivalent concept; it is a workspace-only, host-level action, rendered
 * by `PrescriptionModule` itself through the `extraActions` slot below,
 * alongside this core's own Save button — mirroring how Case Sheet's own
 * status/role edit-gate stayed a host-level concern (T-B.1/T-0.2).
 *
 * `activeAdviceFields` carries T-0.3's own finding into the canonical core
 * (ADR-R3B-05's correction, applied the same way as Case Sheet's
 * vitals/custom gap): `dietary_advice`/`lifestyle_advice`/
 * `follow_up_instructions` live inside `PrescriptionData` itself;
 * `notes`/`next_visit_days` do NOT — they are request-level fields
 * (`PrescriptionCreateRequest`/`PrescriptionUpdateRequest`, not
 * `PrescriptionData`, confirmed by reading `prescriptions.dtos.ts`), so
 * their values/onChange are separate, optional props, only rendered when a
 * host includes them in `activeAdviceFields`. `PrescriptionModule`'s own
 * host configuration activates exactly the same 3 fields it always has
 * (`dietary_advice`/`lifestyle_advice`/`follow_up_instructions`) — zero
 * observable change for the doctor's live workspace, while the core itself
 * is now a proven superset, ready for the standalone wrapper (T-B.5) to
 * activate `notes`/`next_visit_days` too.
 */
import React from 'react';
import { ActivityIndicator, View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useClinicTheme } from '../../../../core/theme/useClinicTheme';
import { MedicationItem, PrescriptionData } from '../../data/models/prescriptions.dtos';
import { PrescriptionSectionProgressStatus, PrescriptionSectionSaveStatus } from './prescriptionSectionTypes';

export type PrescriptionAdviceFieldId =
  | 'dietary_advice'
  | 'lifestyle_advice'
  | 'follow_up_instructions'
  | 'notes'
  | 'next_visit_days';

const ADVICE_FIELD_LABELS: Record<PrescriptionAdviceFieldId, string> = {
  dietary_advice: 'Dietary Advice',
  lifestyle_advice: 'Lifestyle Advice',
  follow_up_instructions: 'Follow-up Instructions',
  notes: 'Notes',
  next_visit_days: 'Follow-up in (days)',
};

export interface PrescriptionEditingCoreProps {
  prescriptionData: PrescriptionData;
  onChange: (data: PrescriptionData) => void;
  onSave: () => void;
  isSaving: boolean;
  saveError: string | null;
  /** Additional condition (beyond `saveStatus === 'saved'`) under which the header shows "✓ Saved" — e.g. a host's own "resolved without saving" concept. Optional; a host with no such concept simply omits it. */
  resolvedWithoutSave?: boolean;
  progress: PrescriptionSectionProgressStatus;
  saveStatus: PrescriptionSectionSaveStatus;
  activeAdviceFields: PrescriptionAdviceFieldId[];
  notes?: string;
  onNotesChange?: (value: string) => void;
  nextVisitDays?: string;
  onNextVisitDaysChange?: (value: string) => void;
  /** Host-specific action(s) rendered alongside this core's own Save button. */
  extraActions?: React.ReactNode;
}

const EMPTY_MED: MedicationItem = { name: '', dosage: '', frequency: '', duration: '' };
const MED_FIELDS: Array<keyof MedicationItem> = ['name', 'dosage', 'frequency', 'duration', 'instructions'];

const progressIcon = (status: PrescriptionSectionProgressStatus) =>
  status === 'complete' ? 'checkmark-circle' : status === 'in_progress' ? 'ellipse' : 'ellipse-outline';

export const PrescriptionEditingCore: React.FC<PrescriptionEditingCoreProps> = ({
  prescriptionData,
  onChange,
  onSave,
  isSaving,
  saveError,
  resolvedWithoutSave,
  progress,
  saveStatus,
  activeAdviceFields,
  notes,
  onNotesChange,
  nextVisitDays,
  onNextVisitDaysChange,
  extraActions,
}) => {
  const { colors, spacing, typography } = useClinicTheme();
  const medications = prescriptionData.medications ?? [];
  const headerStatus = isSaving
    ? 'Saving...'
    : saveError
      ? '⚠ Save failed'
      : saveStatus === 'saved' || resolvedWithoutSave
        ? '✓ Saved'
        : '';
  const headerStatusColor = saveError ? colors.feedback.error : colors.feedback.success;

  const updateMedication = (index: number, key: keyof MedicationItem, value: string) => {
    const next = medications.map((item, i) => (i === index ? { ...item, [key]: value } : item));
    onChange({ ...prescriptionData, medications: next });
  };

  const addMedication = () => onChange({ ...prescriptionData, medications: [...medications, { ...EMPTY_MED }] });
  const removeMedication = (index: number) =>
    onChange({ ...prescriptionData, medications: medications.filter((_, i) => i !== index) });
  const updateAdvice = (key: keyof PrescriptionData, value: string) =>
    onChange({ ...prescriptionData, [key]: value });

  return (
    <View
      style={[
        styles.section,
        {
          backgroundColor: colors.surface.default,
          borderColor: colors.border.default,
          borderRadius: spacing.sm,
          padding: spacing.md,
          gap: spacing.md,
        },
      ]}
    >
      <View style={styles.header}>
        <View style={[styles.titleRow, { gap: spacing.sm }]}>
          <Ionicons name={progressIcon(progress)} size={20} color={colors.primary.default} />
          <Text style={[typography.h6, { color: colors.text.primary }]}>Prescription</Text>
        </View>
        {!!headerStatus && (
          <Text style={[typography.caption, { color: headerStatusColor }]}>{headerStatus}</Text>
        )}
      </View>

      {medications.map((item, index) => (
        <View
          key={index}
          style={[
            styles.medCard,
            { borderColor: colors.border.subtle, borderRadius: spacing.sm, padding: spacing.md, gap: spacing.sm },
          ]}
        >
          <View style={styles.medHeader}>
            <Text style={[typography.subtitle2, { color: colors.text.primary }]}>Medication {index + 1}</Text>
            <TouchableOpacity onPress={() => removeMedication(index)} accessibilityRole="button">
              <Ionicons name="trash-outline" size={20} color={colors.feedback.error} />
            </TouchableOpacity>
          </View>
          {MED_FIELDS.map((field) => (
            <TextInput
              key={field}
              value={String(item[field] ?? '')}
              onChangeText={(value) => updateMedication(index, field, value)}
              placeholder={field.replace('_', ' ')}
              placeholderTextColor={colors.text.tertiary}
              style={[
                typography.body2,
                styles.input,
                {
                  color: colors.text.primary,
                  borderColor: colors.border.default,
                  borderRadius: spacing.sm,
                  padding: spacing.sm,
                },
              ]}
            />
          ))}
        </View>
      ))}

      <TouchableOpacity
        onPress={addMedication}
        accessibilityRole="button"
        style={[styles.secondaryButton, { borderColor: colors.border.focus, borderRadius: spacing.sm, padding: spacing.sm }]}
      >
        <Ionicons name="add" size={18} color={colors.primary.default} />
        <Text style={[typography.button, { color: colors.text.link }]}>Add Medication</Text>
      </TouchableOpacity>

      {activeAdviceFields.map((key) => {
        if (key === 'notes') {
          return (
            <View key={key} style={{ gap: spacing.xs }}>
              <Text style={[typography.subtitle2, { color: colors.text.secondary }]}>{ADVICE_FIELD_LABELS[key]}</Text>
              <TextInput
                value={notes ?? ''}
                onChangeText={onNotesChange}
                multiline
                textAlignVertical="top"
                placeholder={ADVICE_FIELD_LABELS[key]}
                placeholderTextColor={colors.text.tertiary}
                style={[
                  typography.body2,
                  styles.textarea,
                  { color: colors.text.primary, borderColor: colors.border.default, borderRadius: spacing.sm, padding: spacing.sm },
                ]}
              />
            </View>
          );
        }
        if (key === 'next_visit_days') {
          return (
            <View key={key} style={{ gap: spacing.xs }}>
              <Text style={[typography.subtitle2, { color: colors.text.secondary }]}>{ADVICE_FIELD_LABELS[key]}</Text>
              <TextInput
                value={nextVisitDays ?? ''}
                onChangeText={onNextVisitDaysChange}
                keyboardType="numeric"
                placeholder={ADVICE_FIELD_LABELS[key]}
                placeholderTextColor={colors.text.tertiary}
                style={[
                  typography.body2,
                  styles.input,
                  { color: colors.text.primary, borderColor: colors.border.default, borderRadius: spacing.sm, padding: spacing.sm },
                ]}
              />
            </View>
          );
        }
        return (
          <View key={key} style={{ gap: spacing.xs }}>
            <Text style={[typography.subtitle2, { color: colors.text.secondary }]}>{ADVICE_FIELD_LABELS[key]}</Text>
            <TextInput
              value={String(prescriptionData[key as keyof PrescriptionData] ?? '')}
              onChangeText={(value) => updateAdvice(key as keyof PrescriptionData, value)}
              multiline
              textAlignVertical="top"
              placeholder={ADVICE_FIELD_LABELS[key]}
              placeholderTextColor={colors.text.tertiary}
              style={[
                typography.body2,
                styles.textarea,
                { color: colors.text.primary, borderColor: colors.border.default, borderRadius: spacing.sm, padding: spacing.sm },
              ]}
            />
          </View>
        );
      })}

      {!!saveError && <Text style={[typography.body2, { color: colors.feedback.error }]}>{saveError}</Text>}
      <View style={[styles.actions, { gap: spacing.sm }]}>
        <TouchableOpacity
          onPress={onSave}
          disabled={isSaving}
          accessibilityRole="button"
          style={[styles.primaryButton, { backgroundColor: colors.primary.default, borderRadius: spacing.sm, padding: spacing.sm }]}
        >
          {isSaving && <ActivityIndicator size="small" color={colors.primary.onPrimary} />}
          <Text style={[typography.button, { color: colors.primary.onPrimary }]}>Save Prescription</Text>
        </TouchableOpacity>
        {extraActions}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  section: { borderWidth: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  titleRow: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  medCard: { borderWidth: 1 },
  medHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  input: { borderWidth: 1, minHeight: 44 },
  textarea: { borderWidth: 1, minHeight: 80 },
  actions: { flexDirection: 'row', flexWrap: 'wrap' },
  primaryButton: { minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  secondaryButton: { minHeight: 44, borderWidth: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
});
