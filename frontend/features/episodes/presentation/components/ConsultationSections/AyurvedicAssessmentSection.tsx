import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useClinicTheme } from '../../../../../core/theme/useClinicTheme';
import { CasesheetFormData } from '../../../../casesheets/presentation/components/CasesheetForm';
import {
  SectionProgressStatus,
  SectionSaveStatus,
} from '../../hooks/useConsultationWorkspace';

interface AyurvedicAssessmentSectionProps {
  extensions: CasesheetFormData['extensions'];
  onChange: (templateId: string, fieldId: string, value: string) => void;
  saveStatus: SectionSaveStatus;
  progress: SectionProgressStatus;
}

const TEMPLATES = [
  {
    id: 'nadi_pariksha',
    name: 'Nadi Pariksha',
    fields: [
      ['nadi_type', 'Nadi Type', 'e.g., Vata, Pitta, Kapha'],
      ['nadi_gati', 'Nadi Gati', 'Speed or rhythm'],
      ['nadi_bala', 'Nadi Bala', 'Strength'],
      ['observations', 'Observations', 'Additional notes'],
    ],
  },
  {
    id: 'prakriti',
    name: 'Prakriti Assessment',
    fields: [
      ['vata', 'Vata', 'Score or description'],
      ['pitta', 'Pitta', 'Score or description'],
      ['kapha', 'Kapha', 'Score or description'],
      ['dominant_dosha', 'Dominant Dosha', 'e.g., Vata-Pitta'],
    ],
  },
];

const progressIcon = (status: SectionProgressStatus) =>
  status === 'complete' ? 'checkmark-circle' : status === 'in_progress' ? 'ellipse' : 'ellipse-outline';

const saveLabel = (status: SectionSaveStatus) => {
  if (status === 'saving') return 'Saving...';
  if (status === 'saved') return '✓ Saved';
  if (status === 'error') return '⚠ Save failed';
  return '';
};

export const AyurvedicAssessmentSection: React.FC<AyurvedicAssessmentSectionProps> = ({
  extensions,
  onChange,
  saveStatus,
  progress,
}) => {
  const { colors, spacing, typography } = useClinicTheme();
  const [expanded, setExpanded] = useState<Set<string>>(new Set(['nadi_pariksha', 'prakriti']));
  const statusColor = saveStatus === 'error' ? colors.feedback.error : colors.feedback.success;
  const getValue = (templateId: string, fieldId: string) =>
    String(extensions?.find(ext => ext.template_id === templateId)?.data?.[fieldId] ?? '');

  const toggle = (id: string) => {
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

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
          <Text style={[typography.h6, { color: colors.text.primary }]}>Ayurvedic Assessment</Text>
        </View>
        {!!saveLabel(saveStatus) && (
          <Text style={[typography.caption, { color: statusColor }]}>{saveLabel(saveStatus)}</Text>
        )}
      </View>
      {TEMPLATES.map(template => {
        const isOpen = expanded.has(template.id);
        return (
          <View
            key={template.id}
            style={[
              styles.card,
              {
                borderColor: colors.border.subtle,
                borderRadius: spacing.sm,
                backgroundColor: colors.background.elevated,
              },
            ]}
          >
            <TouchableOpacity
              onPress={() => toggle(template.id)}
              accessibilityRole="button"
              accessibilityLabel={template.name}
              style={[styles.cardHeader, { padding: spacing.md }]}
            >
              <Text style={[typography.subtitle1, { color: colors.text.primary }]}>{template.name}</Text>
              <Ionicons
                name={isOpen ? 'chevron-up' : 'chevron-down'}
                size={20}
                color={colors.text.secondary}
              />
            </TouchableOpacity>
            {isOpen && (
              <View style={{ gap: spacing.sm, paddingHorizontal: spacing.md, paddingBottom: spacing.md }}>
                {template.fields.map(([field, label, placeholder]) => (
                  <View key={field} style={{ gap: spacing.xs }}>
                    <Text style={[typography.subtitle2, { color: colors.text.secondary }]}>{label}</Text>
                    <TextInput
                      value={getValue(template.id, field)}
                      onChangeText={(value) => onChange(template.id, field, value)}
                      placeholder={placeholder}
                      placeholderTextColor={colors.text.tertiary}
                      multiline={field === 'observations'}
                      textAlignVertical="top"
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
                ))}
              </View>
            )}
          </View>
        );
      })}
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
  card: { borderWidth: 1, overflow: 'hidden' },
  cardHeader: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  input: {
    borderWidth: 1,
    minHeight: 44,
  },
});
