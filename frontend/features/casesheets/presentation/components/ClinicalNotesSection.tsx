/**
 * R3B (T-B.1, ADR-R3B-05) — canonical Case Sheet field-editing core.
 * Moved, unchanged in behavior, from
 * `features/episodes/presentation/components/ConsultationSections/ClinicalNotesSection.tsx`
 * (its Phase 3A origin) into this shared, context-agnostic location. See
 * ChiefComplaintSection.tsx's own header comment for the full rationale.
 */
import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useClinicTheme } from '../../../../core/theme/useClinicTheme';
import { CasesheetFormData } from './CasesheetForm';
import { CaseSheetSectionProgressStatus, CaseSheetSectionSaveStatus } from './caseSheetSectionTypes';

interface ClinicalNotesSectionProps {
  data: CasesheetFormData['basic'];
  onChange: (field: string, value: string) => void;
  saveStatus: CaseSheetSectionSaveStatus;
  progress: CaseSheetSectionProgressStatus;
}

const FIELDS = [
  ['subjective', 'Subjective', "Patient's description of symptoms"],
  ['objective', 'Objective', 'Clinical findings and observations'],
  ['assessment', 'Assessment', 'Clinical assessment and analysis'],
  ['plan', 'Plan', 'Treatment plan and recommendations'],
  ['provisional_diagnosis', 'Provisional Diagnosis', 'Initial diagnosis'],
  ['final_diagnosis', 'Final Diagnosis', 'Confirmed diagnosis'],
];

const progressIcon = (status: CaseSheetSectionProgressStatus) =>
  status === 'complete' ? 'checkmark-circle' : status === 'in_progress' ? 'ellipse' : 'ellipse-outline';

const saveLabel = (status: CaseSheetSectionSaveStatus) => {
  if (status === 'saving') return 'Saving...';
  if (status === 'saved') return '✓ Saved';
  if (status === 'error') return '⚠ Save failed';
  return '';
};

export const ClinicalNotesSection: React.FC<ClinicalNotesSectionProps> = ({
  data,
  onChange,
  saveStatus,
  progress,
}) => {
  const { colors, spacing, typography } = useClinicTheme();
  const statusColor = saveStatus === 'error' ? colors.feedback.error : colors.feedback.success;

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
          <Text style={[typography.h6, { color: colors.text.primary }]}>Clinical Notes</Text>
        </View>
        {!!saveLabel(saveStatus) && (
          <Text style={[typography.caption, { color: statusColor }]}>{saveLabel(saveStatus)}</Text>
        )}
      </View>
      {FIELDS.map(([field, label, placeholder]) => (
        <View key={field} style={{ gap: spacing.xs }}>
          <Text style={[typography.subtitle2, { color: colors.text.secondary }]}>{label}</Text>
          <TextInput
            value={String(data[field] ?? '')}
            onChangeText={(value) => onChange(field, value)}
            multiline
            textAlignVertical="top"
            placeholder={placeholder}
            placeholderTextColor={colors.text.tertiary}
            style={[
              typography.body2,
              styles.input,
              {
                color: colors.text.primary,
                backgroundColor: colors.background.elevated,
                borderColor: colors.border.default,
                borderRadius: spacing.sm,
                padding: spacing.md,
              },
            ]}
          />
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  section: { borderWidth: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  titleRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    borderWidth: 1,
    minHeight: 88,
  },
});
