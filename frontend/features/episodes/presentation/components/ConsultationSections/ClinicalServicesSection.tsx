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
import { ClinicalServiceResponse } from '../../../../clinicalServices/data/models/clinicalServices.dtos';
import { SectionProgressStatus, SectionSaveStatus } from '../../hooks/useConsultationWorkspace';

export interface ClinicalServiceDraft {
  service_type: string;
  description: string;
}

interface ClinicalServicesSectionProps {
  draft: ClinicalServiceDraft;
  recordedThisSession: ClinicalServiceResponse[];
  isRecording: boolean;
  recordError: string | null;
  onChange: (draft: ClinicalServiceDraft) => void;
  onRecord: () => void;
  progress: SectionProgressStatus;
  saveStatus: SectionSaveStatus;
}

const progressIcon = (status: SectionProgressStatus) =>
  status === 'complete' ? 'checkmark-circle' : status === 'in_progress' ? 'ellipse' : 'ellipse-outline';

export const ClinicalServicesSection: React.FC<ClinicalServicesSectionProps> = ({
  draft,
  recordedThisSession,
  isRecording,
  recordError,
  onChange,
  onRecord,
  progress,
  saveStatus,
}) => {
  const { colors, spacing, typography } = useClinicTheme();
  const headerStatus = isRecording
    ? 'Recording...'
    : recordError
      ? '⚠ Save failed'
      : saveStatus === 'saved'
        ? '✓ Recorded'
        : '';
  const headerStatusColor = recordError ? colors.feedback.error : colors.feedback.success;
  const canRecord = draft.service_type.trim().length > 0 && !isRecording;

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
          <Text style={[typography.h6, { color: colors.text.primary }]}>Clinical Services</Text>
        </View>
        {!!headerStatus && (
          <Text style={[typography.caption, { color: headerStatusColor }]}>{headerStatus}</Text>
        )}
      </View>

      {recordedThisSession.map((service) => (
        <View
          key={service.id}
          style={[
            styles.recordedCard,
            { borderColor: colors.border.subtle, borderRadius: spacing.sm, padding: spacing.md, gap: spacing.xs },
          ]}
        >
          <Text style={[typography.subtitle2, { color: colors.text.primary }]}>{service.service_type}</Text>
          {!!service.description && (
            <Text style={[typography.body2, { color: colors.text.secondary }]}>{service.description}</Text>
          )}
        </View>
      ))}

      <View style={{ gap: spacing.xs }}>
        <Text style={[typography.subtitle2, { color: colors.text.secondary }]}>Service Type</Text>
        <TextInput
          value={draft.service_type}
          onChangeText={(value) => onChange({ ...draft, service_type: value })}
          placeholder="e.g. Abhyanga, Wound Dressing"
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
      </View>

      <View style={{ gap: spacing.xs }}>
        <Text style={[typography.subtitle2, { color: colors.text.secondary }]}>Description (optional)</Text>
        <TextInput
          value={draft.description}
          onChangeText={(value) => onChange({ ...draft, description: value })}
          multiline
          textAlignVertical="top"
          placeholder="Additional detail about the service delivered"
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

      {!!recordError && (
        <Text style={[typography.body2, { color: colors.feedback.error }]}>{recordError}</Text>
      )}
      <TouchableOpacity
        onPress={onRecord}
        disabled={!canRecord}
        accessibilityRole="button"
        style={[
          styles.primaryButton,
          { backgroundColor: colors.primary.default, borderRadius: spacing.sm, padding: spacing.sm, opacity: canRecord ? 1 : 0.5 },
        ]}
      >
        {isRecording && <ActivityIndicator size="small" color={colors.primary.onPrimary} />}
        <Text style={[typography.button, { color: colors.primary.onPrimary }]}>Record Service</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  section: { borderWidth: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  titleRow: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  recordedCard: { borderWidth: 1 },
  input: { borderWidth: 1, minHeight: 44 },
  textarea: { borderWidth: 1, minHeight: 80 },
  primaryButton: { minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
});
