/**
 * Appointment List Item Component
 * Displays a single appointment in a list
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../../core/theme/colors';
import { spacing } from '../../../../core/theme/spacing';
import { typography } from '../../../../core/theme/typography';
import {
  AppointmentResponse,
  getStatusLabel,
  getStatusColor,
  formatTime,
  formatDate,
  calculateDuration,
  formatDuration,
} from '../../data/models/appointments.dtos';

interface AppointmentListItemProps {
  appointment: AppointmentResponse;
  onPress: (appointment: AppointmentResponse) => void;
}

export const AppointmentListItem: React.FC<AppointmentListItemProps> = ({
  appointment,
  onPress,
}) => {
  const statusColor = getStatusColor(appointment.status);
  const duration = calculateDuration(appointment.appointment_start, appointment.appointment_end);

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() => onPress(appointment)}
      activeOpacity={0.7}
    >
      <View style={styles.content}>
        {/* Time Column */}
        <View style={styles.timeColumn}>
          <Text style={styles.time}>{formatTime(appointment.appointment_start)}</Text>
          {duration && (
            <Text style={styles.duration}>{formatDuration(duration)}</Text>
          )}
        </View>

        {/* Divider */}
        <View style={[styles.divider, { backgroundColor: statusColor }]} />

        {/* Info Column */}
        <View style={styles.infoColumn}>
          <View style={styles.headerRow}>
            <Text style={styles.clientName} numberOfLines={1}>
              {appointment.client_name || `Client #${appointment.client_id.slice(0, 8)}`}
            </Text>
            <View style={[styles.statusBadge, { backgroundColor: statusColor + '15' }]}>
              <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
              <Text style={[styles.statusText, { color: statusColor }]}>
                {getStatusLabel(appointment.status)}
              </Text>
            </View>
          </View>

          {appointment.treatment_name && (
            <View style={styles.metaRow}>
              <Ionicons name="leaf-outline" size={14} color={colors.text.secondary} />
              <Text style={styles.metaText} numberOfLines={1}>
                {appointment.treatment_name}
              </Text>
            </View>
          )}

          {appointment.staff_name && (
            <View style={styles.metaRow}>
              <Ionicons name="person-outline" size={14} color={colors.text.secondary} />
              <Text style={styles.metaText} numberOfLines={1}>
                {appointment.staff_name}
              </Text>
            </View>
          )}

          {appointment.room_name && (
            <View style={styles.metaRow}>
              <Ionicons name="location-outline" size={14} color={colors.text.secondary} />
              <Text style={styles.metaText} numberOfLines={1}>
                {appointment.room_name}
              </Text>
            </View>
          )}
        </View>

        <Ionicons
          name="chevron-forward"
          size={20}
          color={colors.text.secondary}
        />
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background.default,
    borderRadius: 12,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
  },
  timeColumn: {
    alignItems: 'center',
    minWidth: 60,
    marginRight: spacing.md,
  },
  time: {
    ...typography.body1,
    color: colors.text.primary,
    fontWeight: '600',
  },
  duration: {
    ...typography.caption,
    color: colors.text.tertiary,
    marginTop: 2,
  },
  divider: {
    width: 3,
    height: '100%',
    minHeight: 50,
    borderRadius: 2,
    marginRight: spacing.md,
  },
  infoColumn: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  clientName: {
    ...typography.body1,
    color: colors.text.primary,
    fontWeight: '600',
    flex: 1,
    marginRight: spacing.sm,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: 8,
    gap: 4,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    ...typography.caption,
    fontWeight: '600',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  metaText: {
    ...typography.caption,
    color: colors.text.secondary,
    flex: 1,
  },
});
