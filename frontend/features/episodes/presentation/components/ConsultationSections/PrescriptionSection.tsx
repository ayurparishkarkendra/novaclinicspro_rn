import React from 'react';
import {
  ActivityIndicator,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useClinicTheme } from '../../../../../core/theme/useClinicTheme';
import {
  MedicationItem,
  PrescriptionData,
} from '../../../../prescriptions/data/models/prescriptions.dtos';
import { SectionProgressStatus } from '../../hooks/useConsultationWorkspace';

interface PrescriptionSectionProps {
  prescriptionData: PrescriptionData;
  isPrescriptionSaving: boolean;
  prescriptionSaveError: string | null;
  prescriptionNotRequired: boolean;
  onSave: () => void;
  onMarkNotRequired: () => void;
  onChange: (data: PrescriptionData) => void;
  progress: SectionProgressStatus;
}

const EMPTY_MED: MedicationItem = { name: '', dosage: '', frequency: '', duration: '' };
const MED_FIELDS: Array<keyof MedicationItem> = ['name', 'dosage', 'frequency', 'duration', 'instructions'];

const progressIcon = (status: SectionProgressStatus) =>
  status === 'complete' ? 'checkmark-circle' : status === 'in_progress' ? 'ellipse' : 'ellipse-outline';

export const PrescriptionSection: React.FC<PrescriptionSectionProps> = ({
  prescriptionData,
  isPrescriptionSaving,
  prescriptionSaveError,
  prescriptionNotRequired,
  onSave,
  onMarkNotRequired,
  onChange,
  progress,
}) => {
  const { colors, spacing, typography } = useClinicTheme();
  const medications = prescriptionData.medications ?? [];
  const headerStatus = isPrescriptionSaving
    ? 'Saving...'
    : prescriptionSaveError
      ? '⚠ Save failed'
      : prescriptionNotRequired
        ? '✓ Saved'
        : '';
  const headerStatusColor = prescriptionSaveError ? colors.feedback.error : colors.feedback.success;

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
          {MED_FIELDS.map(field => (
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

      {[
        ['dietary_advice', 'Dietary Advice'],
        ['lifestyle_advice', 'Lifestyle Advice'],
        ['follow_up_instructions', 'Follow-up Instructions'],
      ].map(([key, label]) => (
        <View key={key} style={{ gap: spacing.xs }}>
          <Text style={[typography.subtitle2, { color: colors.text.secondary }]}>{label}</Text>
          <TextInput
            value={String(prescriptionData[key as keyof PrescriptionData] ?? '')}
            onChangeText={(value) => updateAdvice(key as keyof PrescriptionData, value)}
            multiline
            textAlignVertical="top"
            placeholder={label}
            placeholderTextColor={colors.text.tertiary}
            style={[
              typography.body2,
              styles.textarea,
              {
                color: colors.text.primary,
                borderColor: colors.border.default,
                borderRadius: spacing.sm,
                padding: spacing.sm,
              },
            ]}
          />
        </View>
      ))}

      {!!prescriptionSaveError && (
        <Text style={[typography.body2, { color: colors.feedback.error }]}>{prescriptionSaveError}</Text>
      )}
      <View style={[styles.actions, { gap: spacing.sm }]}>
        <TouchableOpacity
          onPress={onSave}
          disabled={isPrescriptionSaving}
          accessibilityRole="button"
          style={[styles.primaryButton, { backgroundColor: colors.primary.default, borderRadius: spacing.sm, padding: spacing.sm }]}
        >
          {isPrescriptionSaving && <ActivityIndicator size="small" color={colors.primary.onPrimary} />}
          <Text style={[typography.button, { color: colors.primary.onPrimary }]}>Save Prescription</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={onMarkNotRequired}
          accessibilityRole="button"
          style={[styles.secondaryButton, { borderColor: colors.border.default, borderRadius: spacing.sm, padding: spacing.sm }]}
        >
          <Text style={[typography.button, { color: colors.text.secondary }]}>Mark as Not Required</Text>
        </TouchableOpacity>
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
