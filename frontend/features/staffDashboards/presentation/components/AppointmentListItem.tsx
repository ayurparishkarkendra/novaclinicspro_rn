/**
 * Appointment List Item Component
 * Displays a single appointment in a scannable format for doctor dashboard
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../../core/theme/colors';
import { spacing } from '../../../../core/theme/spacing';
import { typography } from '../../../../core/theme/typography';
import {
  DoctorAppointmentItem,
  formatTime,
  getStatusColor,
  getStatusLabel,
} from '../../data/models/staffDashboards.dtos';

interface AppointmentListItemProps {
  appointment: DoctorAppointmentItem;
  onPress?: () => void;
  onStartPress?: () => void;
}

export const AppointmentListItem: React.FC<AppointmentListItemProps> = ({
  appointment,
  onPress,
  onStartPress,
}) => {
  const statusColor = getStatusColor(appointment.status);
  const statusLabel = getStatusLabel(appointment.status);
  const timeDisplay = formatTime(appointment.appointment_start);

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {/* Time on the left */}
      <View style={styles.timeSection}>
        <View style={[styles.timeBadge, { backgroundColor: colors.primary.main + '15' }]}>
          <Text style={styles.timeText}>{timeDisplay}</Text>
        </View>
      </View>

      {/* Main content */}
      <View style={styles.content}>
        <View style={styles.mainRow}>
          <View style={styles.patientInfo}>
            <Text style={styles.patientName} numberOfLines={1}>
              {appointment.client_name || 'Unknown Patient'}
            </Text>
            {/* BUG FIX #2: Show doctor name from staff_name field (API returns staff_name, not doctor_name) */}
            {appointment.staff_name && (
              <Text style={styles.doctorName} numberOfLines={1}>
                {appointment.staff_name}
              </Text>
            )}
            <Text style={styles.visitType} numberOfLines={1}>
              {appointment.treatment_name || 'General Visit'}
            </Text>
          </View>

          {/* Status badge on the right */}
          <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
            <Text style={[styles.statusText, { color: statusColor }]}>
              {statusLabel}
            </Text>
          </View>
        </View>

        {/* Secondary info */}
        {appointment.room_name && (
          <View style={styles.secondaryRow}>
            <Ionicons name="location-outline" size={14} color={colors.text.secondary} />
            <Text style={styles.secondaryText}>{appointment.room_name}</Text>
          </View>
        )}
      </View>

      {/* Start button for scheduled appointments */}
      {['scheduled', 'confirmed'].includes(appointment.status?.toLowerCase()) && onStartPress && (
        <TouchableOpacity
          style={styles.startButton}
          onPress={(e) => {
            e.stopPropagation?.();
            onStartPress();
          }}
        >
          <Ionicons name="play" size={16} color={colors.background.default} />
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.default,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  timeSection: {
    marginRight: spacing.md,
  },
  timeBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 8,
    minWidth: 70,
    alignItems: 'center',
  },
  timeText: {
    ...typography.caption,
    color: colors.primary.main,
    fontWeight: '700',
    fontSize: 12,
  },
  content: {
    flex: 1,
  },
  mainRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  patientInfo: {
    flex: 1,
    marginRight: spacing.sm,
  },
  patientName: {
    ...typography.body1,
    color: colors.text.primary,
    fontWeight: '600',
    marginBottom: 2,
  },
  visitType: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  doctorName: {
    ...typography.caption,
    color: colors.primary.main,
    fontWeight: '600',
    marginBottom: 2,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    ...typography.caption,
    fontWeight: '600',
    fontSize: 11,
  },
  secondaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
    gap: 4,
  },
  secondaryText: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  startButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary.main,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.sm,
  },
});
