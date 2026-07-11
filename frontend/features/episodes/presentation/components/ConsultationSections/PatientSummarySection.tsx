import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useClinicTheme } from '../../../../../core/theme/useClinicTheme';
import { EpisodeDetailsResponse } from '../../../data/models/episodes.dtos';

interface PatientSummarySectionProps {
  episodeDetails: EpisodeDetailsResponse;
  appointmentDate: string;
  appointmentTime: string;
  appointmentStatus: string;
  clientName: string;
}

const formatDate = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value || '-';
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};

export const PatientSummarySection: React.FC<PatientSummarySectionProps> = ({
  episodeDetails,
  appointmentDate,
  appointmentTime,
  appointmentStatus,
  clientName,
}) => {
  const { colors, spacing, typography } = useClinicTheme();
  const episode = episodeDetails.episode;
  const visitLabel = episode.visits_count > 1 ? `Visit ${episode.visits_count} of this case` : 'First visit';

  const rows = [
    ['Patient', clientName || episode.client_name || '-'],
    ['Appointment', `${formatDate(appointmentDate)} ${appointmentTime || ''}`.trim()],
    ['Status', appointmentStatus || '-'],
    ['Treatment Case', episode.title],
    ['Case Start Date', formatDate(episode.start_date)],
    ['Visit Count', visitLabel],
  ];

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
        <View style={[styles.headerTitle, { gap: spacing.sm }]}>
          <Ionicons name="checkmark-circle" size={20} color={colors.feedback.success} />
          <Text style={[typography.h6, { color: colors.text.primary }]}>Patient Summary</Text>
        </View>
        <Text style={[typography.caption, { color: colors.feedback.success }]}>✓ Saved</Text>
      </View>
      <View style={[styles.grid, { gap: spacing.sm }]}>
        {rows.map(([label, value]) => (
          <View key={label} style={[styles.row, { gap: spacing.xs }]}>
            <Text style={[typography.caption, styles.label, { color: colors.text.secondary }]}>
              {label}
            </Text>
            <Text style={[typography.body2, styles.value, { color: colors.text.primary }]}>
              {value}
            </Text>
          </View>
        ))}
      </View>
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
  headerTitle: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  grid: {},
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  label: { flex: 1 },
  value: { flex: 2, textAlign: 'right' },
});
