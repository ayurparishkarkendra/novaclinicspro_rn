import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useClinicTheme } from '../../../../../core/theme/useClinicTheme';
import { spacing } from '../../../../../core/theme/spacing';
import { formatTreatmentDate } from './helpers';
import { RowFormData } from './types';

interface Props {
  rowsData: RowFormData[];
  onScheduleAppointments: () => void;
  onViewAppointments: () => void;
}

export const TreatmentScheduleSummary: React.FC<Props> = ({
  rowsData,
  onScheduleAppointments,
  onViewAppointments,
}) => {
  const theme = useClinicTheme();
  const scheduledCount = rowsData.filter(row => row.session_id).length;
  const hasScheduledRows = scheduledCount > 0;
  const firstDate = rowsData.find(row => row.session_date)?.session_date || '';
  const lastDate = rowsData[rowsData.length - 1]?.session_date || '';

  if (!hasScheduledRows) {
    return (
      <TouchableOpacity
        style={[styles.scheduleButton, { backgroundColor: theme.colors.primary.default }]}
        onPress={onScheduleAppointments}
        activeOpacity={0.7}
      >
        <Ionicons name="calendar" size={20} color={theme.colors.primary.onPrimary} />
        <Text style={[styles.scheduleButtonText, { color: theme.colors.primary.onPrimary }]}>
          Schedule Appointments
        </Text>
      </TouchableOpacity>
    );
  }

  return (
    <View style={[styles.scheduleSummaryCard, { backgroundColor: theme.colors.background.elevated, borderColor: theme.colors.border.subtle }]}>
      <View style={styles.scheduleSummaryHeader}>
        <Ionicons name="checkmark-circle" size={24} color={theme.colors.feedback.success} />
        <Text style={[styles.scheduleSummaryTitle, { color: theme.colors.text.primary }]}>
          Appointments Scheduled
        </Text>
      </View>
      <Text style={[styles.scheduleSummaryText, { color: theme.colors.text.secondary }]}>
        {scheduledCount} of {rowsData.length} sessions have been scheduled
      </Text>
      {firstDate ? (
        <View style={styles.scheduleSummaryDates}>
          <Ionicons name="calendar-outline" size={16} color={theme.colors.text.secondary} />
          <Text style={[styles.scheduleSummaryDatesText, { color: theme.colors.text.secondary }]}>
            {formatTreatmentDate(firstDate)} - {formatTreatmentDate(lastDate)}
          </Text>
        </View>
      ) : null}
      <TouchableOpacity
        style={[styles.viewAppointmentsButton, { backgroundColor: theme.colors.primary.default }]}
        onPress={onViewAppointments}
        activeOpacity={0.7}
      >
        <Ionicons name="list" size={18} color={theme.colors.primary.onPrimary} />
        <Text style={[styles.viewAppointmentsButtonText, { color: theme.colors.primary.onPrimary }]}>
          View All Appointments
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  scheduleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: 12,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  scheduleButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  scheduleSummaryCard: {
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
  },
  scheduleSummaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  scheduleSummaryTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  scheduleSummaryText: {
    fontSize: 14,
    marginBottom: spacing.sm,
  },
  scheduleSummaryDates: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  scheduleSummaryDatesText: {
    fontSize: 13,
  },
  viewAppointmentsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 8,
  },
  viewAppointmentsButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
