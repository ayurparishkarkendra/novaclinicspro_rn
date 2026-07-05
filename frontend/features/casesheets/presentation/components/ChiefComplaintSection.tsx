/**
 * R3B (T-B.1, ADR-R3B-05) — canonical Case Sheet field-editing core.
 * Moved, unchanged in behavior, from
 * `features/episodes/presentation/components/ConsultationSections/ChiefComplaintSection.tsx`
 * (its Phase 3A origin) into this shared, context-agnostic location so both
 * `CaseSheetModule` (workspace) and the future standalone wrapper (T-B.2)
 * can host the same component. Takes only value/onChange/progress/
 * saveStatus as props — no context hook calls (ADR-R3B-01).
 */
import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useClinicTheme } from '../../../../core/theme/useClinicTheme';
import { CaseSheetSectionProgressStatus, CaseSheetSectionSaveStatus } from './caseSheetSectionTypes';

interface ChiefComplaintSectionProps {
  value: string;
  onChange: (v: string) => void;
  saveStatus: CaseSheetSectionSaveStatus;
  progress: CaseSheetSectionProgressStatus;
}

const progressIcon = (status: CaseSheetSectionProgressStatus) =>
  status === 'complete' ? 'checkmark-circle' : status === 'in_progress' ? 'ellipse' : 'ellipse-outline';

const saveLabel = (status: CaseSheetSectionSaveStatus) => {
  if (status === 'saving') return 'Saving...';
  if (status === 'saved') return '✓ Saved';
  if (status === 'error') return '⚠ Save failed';
  return '';
};

export const ChiefComplaintSection: React.FC<ChiefComplaintSectionProps> = ({
  value,
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
          <Text style={[typography.h6, { color: colors.text.primary }]}>Chief Complaint</Text>
        </View>
        {!!saveLabel(saveStatus) && (
          <Text style={[typography.caption, { color: statusColor }]}>{saveLabel(saveStatus)}</Text>
        )}
      </View>
      <TextInput
        value={value}
        onChangeText={onChange}
        multiline
        textAlignVertical="top"
        placeholder="Primary reason for today's visit"
        placeholderTextColor={colors.text.tertiary}
        style={[
          typography.body1,
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
    minHeight: 120,
  },
});
