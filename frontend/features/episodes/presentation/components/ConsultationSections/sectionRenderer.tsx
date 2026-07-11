/**
 * Shared collapsible-section rendering (R3A · T-B.1)
 *
 * Extracted, unchanged, from ConsultationWorkspaceScreen.tsx so both the
 * screen (for not-yet-migrated sections) and CaseSheetModule (for its own
 * migrated sections) render collapsed/expanded sections identically —
 * Doc 06 §3.4 Composition Before Duplication. No rendering behavior differs
 * from before this extraction.
 */

import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useClinicTheme } from '../../../../../core/theme/useClinicTheme';
import { SectionKey, SectionProgress } from '../../hooks/useConsultationWorkspace';

export const SECTION_LABELS: Record<SectionKey, string> = {
  chiefComplaint: 'Chief Complaint',
  clinicalNotes: 'Clinical Notes',
  ayurvedicAssessment: 'Ayurvedic Assessment',
  prescription: 'Prescription',
  treatmentRecommendation: 'Treatment Recommendation',
  clinicalServices: 'Clinical Services',
};

export function renderSection(
  key: SectionKey,
  expandedSections: Set<SectionKey>,
  toggleSection: (key: SectionKey) => void,
  progress: SectionProgress | undefined,
  content: React.ReactNode,
) {
  if (expandedSections.has(key)) return <View key={key}>{content}</View>;
  return (
    <CollapsedSection
      key={key}
      label={SECTION_LABELS[key]}
      progress={progress}
      onPress={() => toggleSection(key)}
    />
  );
}

export const CollapsedSection: React.FC<{
  label: string;
  progress?: SectionProgress;
  onPress: () => void;
}> = ({ label, progress, onPress }) => {
  const { colors, spacing, typography } = useClinicTheme();
  const icon =
    progress?.status === 'complete'
      ? 'checkmark-circle'
      : progress?.status === 'in_progress'
        ? 'ellipse'
        : 'ellipse-outline';
  const saveText =
    progress?.saveStatus === 'saving'
      ? 'Saving...'
      : progress?.saveStatus === 'saved'
        ? '✓ Saved'
        : progress?.saveStatus === 'error'
          ? '⚠ Save failed'
          : '';
  return (
    <TouchableOpacity
      onPress={onPress}
      accessibilityRole="button"
      style={[
        styles.collapsed,
        {
          backgroundColor: colors.surface.default,
          borderColor: colors.border.default,
          borderRadius: spacing.sm,
          padding: spacing.md,
          gap: spacing.sm,
        },
      ]}
    >
      <Ionicons name={icon} size={20} color={colors.primary.default} />
      <Text style={[typography.h6, styles.collapsedText, { color: colors.text.primary }]}>{label}</Text>
      {!!saveText && <Text style={[typography.caption, { color: colors.text.secondary }]}>{saveText}</Text>}
      <Ionicons name="chevron-down" size={20} color={colors.text.secondary} />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  collapsed: { minHeight: 64, borderWidth: 1, flexDirection: 'row', alignItems: 'center' },
  collapsedText: { flex: 1 },
});
