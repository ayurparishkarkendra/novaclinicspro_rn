/**
 * Appointment List Item Component
 * 
 * CLEAN CARD LAYOUT (User Requirement A1):
 * - ONE right arrow for navigation, vertically centered
 * - NO expand/collapse arrow
 * - Quick actions visible directly on card
 * 
 * QUICK ACTIONS (User Requirement A2):
 * - Reschedule, No-Show, Cancel, Complete (per FRONTEND_QUICK_ACTIONS_GUIDE.md)
 * - Complete: Tick icon that changes color on touch with confirmation
 * 
 * NO IDs displayed in UI. RBAC respected. All text uses i18n.
 */

import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { colors } from '../../../../core/theme/colors';
import { spacing } from '../../../../core/theme/spacing';
import { typography } from '../../../../core/theme/typography';
import { useTranslation } from '../../../../core/localization/useTranslation';
import {
  AppointmentResponse,
  getStatusLabel,
  getStatusColor,
  formatTime,
  formatDate,
  getTherapistNames,
} from '../../data/models/appointments.dtos';

// ============================================
// TYPES
// ============================================

interface AppointmentListItemProps {
  appointment: AppointmentResponse;
  onPress?: (appointment: AppointmentResponse) => void;
  /** User role for RBAC - determines which actions are visible */
  userRole?: string;
  /** Whether quick actions are enabled */
  showActions?: boolean;
  /** Callback for status updates (e.g., confirm, start, complete, no-show) */
  onStatusUpdate?: (appointmentId: string, newStatus: string) => void;
  /** Callback for cancellation */
  onCancel?: (appointmentId: string) => void;
  /** Callback for reschedule - navigates to reschedule flow */
  onReschedule?: (appointmentId: string) => void;
}

// ============================================
// STATUS BADGE COMPONENT
// ============================================

interface StatusBadgeProps {
  status: string;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const statusColor = getStatusColor(status);
  const statusLabel = getStatusLabel(status);

  return (
    <View 
      style={[styles.statusBadge, { backgroundColor: statusColor + '15' }]}
      accessibilityLabel={`Status: ${statusLabel}`}
    >
      <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
      <Text style={[styles.statusText, { color: statusColor }]}>
        {statusLabel}
      </Text>
    </View>
  );
};

// ============================================
// QUICK ACTION ICON BUTTON COMPONENT (BUG FIX #3 - Icon-based with tooltip)
// ============================================

interface QuickActionIconButtonProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  color: string;
  backgroundColor?: string;
  onPress: () => void;
  testId: string;
}

const QuickActionIconButton: React.FC<QuickActionIconButtonProps> = ({
  icon,
  label,
  color,
  backgroundColor,
  onPress,
  testId,
}) => (
  <TouchableOpacity
    style={[
      styles.quickActionIconBtn,
      { 
        backgroundColor: backgroundColor || color + '12',
        borderColor: color + '30',
      }
    ]}
    onPress={onPress}
    accessibilityLabel={label}
    accessibilityHint={`Tap to ${label.toLowerCase()}`}
    accessibilityRole="button"
    data-testid={testId}
  >
    <Ionicons name={icon} size={20} color={color} />
    <Text style={[styles.quickActionTooltip, { color }]} numberOfLines={1}>
      {label}
    </Text>
  </TouchableOpacity>
);

// ============================================
// COMPLETE TICK ICON COMPONENT (User Requirement - Tick icon with color change)
// ============================================

interface CompleteTickIconProps {
  onPress: () => void;
  disabled?: boolean;
}

const CompleteTickIcon: React.FC<CompleteTickIconProps> = ({ onPress, disabled }) => {
  const [isPressed, setIsPressed] = useState(false);
  
  return (
    <TouchableOpacity
      style={[
        styles.completeTickButton,
        isPressed && styles.completeTickButtonPressed,
        disabled && styles.completeTickButtonDisabled,
      ]}
      onPress={onPress}
      onPressIn={() => setIsPressed(true)}
      onPressOut={() => setIsPressed(false)}
      disabled={disabled}
      accessibilityLabel="Mark as Complete"
      accessibilityHint="Tap to mark this appointment as completed"
      accessibilityRole="button"
      data-testid="action-complete-tick"
    >
      <Ionicons 
        name="checkmark-circle" 
        size={28} 
        color={isPressed ? colors.success.dark : colors.success.main} 
      />
    </TouchableOpacity>
  );
};

// ============================================
// MAIN COMPONENT - CLEAN CARD LAYOUT (A1, A2, A3)
// ============================================

export const AppointmentListItem: React.FC<AppointmentListItemProps> = ({
  appointment,
  onPress,
  userRole = 'clinic_admin',
  showActions = true,
  onStatusUpdate,
  onCancel,
  onReschedule,
}) => {
  const router = useRouter();
  const { t } = useTranslation();
  const statusColor = getStatusColor(appointment.status);

  // ===== EXTRACT DATA FROM API RESPONSE =====
  const clientName = appointment.client_name || null;
  const clientPhone = appointment.client_phone || null;
  const treatmentName = appointment.treatment_name || null;
  const staffName = getTherapistNames(appointment);

  // ===== ACTION HANDLERS =====
  
  const handlePress = useCallback(() => {
    if (onPress) {
      onPress(appointment);
    } else {
      router.push(`/clinic-admin/appointments/${appointment.id}` as any);
    }
  }, [appointment, onPress, router]);

  // ===== RBAC CHECK =====
  // FIX: Make role check more robust for various role formats
  const normalizedRole = (userRole || '').toLowerCase().replace(/[_\-\s]+/g, '');
  const isClinicAdmin = normalizedRole.includes('clinicadmin') || normalizedRole.includes('admin');
  const isReceptionist = normalizedRole.includes('receptionist');
  const canModify = isClinicAdmin || isReceptionist;

  // ===== STATUS-BASED ACTION VISIBILITY (per FRONTEND_QUICK_ACTIONS_GUIDE.md) =====
  const status = (appointment.status || '').toLowerCase();
  const canReschedule = canModify && ['scheduled', 'confirmed'].includes(status);
  const canMarkNoShow = canModify && ['scheduled', 'confirmed'].includes(status);
  const canCancelAppt = canModify && ['scheduled', 'confirmed'].includes(status);
  // A2/A3: Complete button for confirmed OR in_progress (User Requirement)
  const canComplete = canModify && ['confirmed', 'in_progress'].includes(status);
  
  // Debug: Log to verify values (enable for debugging)
  // console.log('QuickActions Debug:', { userRole, normalizedRole, isClinicAdmin, canModify, status, canReschedule });

  // ===== DISPLAY VALUES =====
  const displayClientName = clientName || t('common.unknownClient') || 'Unknown Client';
  const displayStaffName = staffName;
  const dateDisplay = formatDate(appointment.appointment_start);
  const timeDisplay = formatTime(appointment.appointment_start);
  const endTimeDisplay = appointment.appointment_end ? formatTime(appointment.appointment_end) : null;
  const isSeriesAppointment = appointment.series_id && appointment.session_number;

  return (
    <View
      style={[styles.container, { borderLeftColor: statusColor }]}
      data-testid="appointment-list-item"
    >
      {/* Main Row - Full width clickable */}
      <TouchableOpacity
        style={styles.mainRow}
        onPress={handlePress}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel={`Appointment for ${clientName} at ${timeDisplay}`}
      >
        {/* Main Content */}
        <View style={styles.content}>
          {/* Top Row: Date + Status */}
          <View style={styles.topRow}>
            <View style={styles.dateContainer}>
              <Ionicons name="calendar-outline" size={14} color={colors.primary.main} />
              <Text style={styles.dateText} data-testid="appointment-date">
                {dateDisplay}
              </Text>
            </View>
            <StatusBadge status={appointment.status} />
          </View>

          {/* Time Row */}
          <View style={styles.timeRow}>
            <Ionicons name="time-outline" size={14} color={colors.text.secondary} />
            <Text style={styles.timeText} data-testid="appointment-time">
              {timeDisplay}
              {endTimeDisplay && <Text style={styles.timeEndText}> - {endTimeDisplay}</Text>}
            </Text>
          </View>

          {/* Client Info */}
          <Text style={styles.clientName} numberOfLines={1} data-testid="appointment-client-name">
            {displayClientName}
          </Text>

          {/* Staff & Treatment Info */}
          <View style={styles.detailsRow}>
            <View style={styles.detailItem}>
              <Ionicons name="person-circle-outline" size={14} color={colors.text.secondary} />
              <Text style={styles.detailText} numberOfLines={1} data-testid="appointment-staff-name">
                {displayStaffName}
              </Text>
            </View>
            {treatmentName && (
              <View style={styles.detailItem}>
                <Ionicons name="medical-outline" size={14} color={colors.text.secondary} />
                <Text style={styles.detailText} numberOfLines={1} data-testid="appointment-treatment">
                  {treatmentName}
                </Text>
              </View>
            )}
          </View>

          {/* Series Badge (if applicable) */}
          {isSeriesAppointment && (
            <View style={styles.seriesBadge} data-testid="appointment-series-badge">
              <Ionicons name="repeat" size={12} color={colors.primary.main} />
              <Text style={styles.seriesText}>
                {t('appointments.session') || 'Session'} {appointment.session_number}
                {appointment.total_sessions && `/${appointment.total_sessions}`}
              </Text>
            </View>
          )}
        </View>

        {/* A1: Single navigation arrow, vertically centered */}
        <View style={styles.navigationArrow} data-testid="appointment-nav-arrow">
          <Ionicons name="chevron-forward" size={20} color={colors.primary.main} />
        </View>
      </TouchableOpacity>

      {/* A2: Quick Actions Row - Icon buttons spread horizontally */}
      {/* BUG FIX #3: All quick actions have confirmation dialogs, icon-based with tooltips */}
      {showActions && canModify && ['scheduled', 'confirmed', 'in_progress'].includes(status) && (
        <View style={styles.quickActionsRow} data-testid="appointment-quick-actions">
          {/* Reschedule - scheduled/confirmed */}
          {['scheduled', 'confirmed'].includes(status) && (
            <QuickActionIconButton
              icon="calendar-outline"
              label={t('appointments.reschedule') || 'Reschedule'}
              color={colors.primary.main}
              onPress={() => {
                if (onReschedule) {
                  Alert.alert(
                    t('appointments.reschedule') || 'Reschedule',
                    t('appointments.confirmReschedule') || 'Open reschedule options for this appointment?',
                    [
                      { text: t('common.cancel') || 'Cancel', style: 'cancel' },
                      { text: t('common.yes') || 'Yes', onPress: () => onReschedule(appointment.id) },
                    ]
                  );
                } else {
                  handlePress();
                }
              }}
              testId="action-reschedule"
            />
          )}
          
          {/* No-Show - scheduled/confirmed */}
          {['scheduled', 'confirmed'].includes(status) && onStatusUpdate && (
            <QuickActionIconButton
              icon="person-remove-outline"
              label={t('appointments.noShow') || 'No-Show'}
              color={colors.warning.main}
              onPress={() => {
                Alert.alert(
                  t('appointments.markAsNoShow') || 'Mark as No-Show',
                  t('appointments.confirmNoShow') || 'Are you sure the patient did not show up?',
                  [
                    { text: t('common.cancel') || 'Cancel', style: 'cancel' },
                    { text: t('common.yes') || 'Yes', onPress: () => onStatusUpdate(appointment.id, 'NO_SHOW') },
                  ]
                );
              }}
              testId="action-noshow"
            />
          )}
          
          {/* Cancel - scheduled/confirmed */}
          {['scheduled', 'confirmed'].includes(status) && onCancel && (
            <QuickActionIconButton
              icon="close-circle-outline"
              label={t('common.cancel') || 'Cancel'}
              color={colors.error.main}
              onPress={() => {
                Alert.alert(
                  t('appointments.cancelAppointment') || 'Cancel Appointment',
                  t('appointments.confirmCancel') || 'Are you sure you want to cancel this appointment?',
                  [
                    { text: t('common.no') || 'No', style: 'cancel' },
                    { text: t('common.yesCancel') || 'Yes, Cancel', style: 'destructive', onPress: () => onCancel(appointment.id) },
                  ]
                );
              }}
              testId="action-cancel"
            />
          )}
          
          {/* Complete - confirmed OR in_progress */}
          {['confirmed', 'in_progress'].includes(status) && onStatusUpdate && (
            <QuickActionIconButton
              icon="checkmark-circle-outline"
              label={t('appointments.complete') || 'Complete'}
              color={colors.success.main}
              onPress={() => {
                Alert.alert(
                  t('appointments.markAsCompleted') || 'Mark as Completed',
                  t('appointments.confirmComplete') || 'Mark this appointment as completed?',
                  [
                    { text: t('common.cancel') || 'Cancel', style: 'cancel' },
                    { text: t('common.yes') || 'Yes', onPress: () => onStatusUpdate(appointment.id, 'COMPLETED') },
                  ]
                );
              }}
              testId="action-complete"
            />
          )}
        </View>
      )}
    </View>
  );
};

// ============================================
// STYLES - CLEAN CARD LAYOUT (A1)
// ============================================

const styles = StyleSheet.create({
  container: {
    flexDirection: 'column',
    backgroundColor: colors.background.default,
    borderRadius: 12,
    marginBottom: spacing.sm,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    overflow: 'hidden',
  },
  mainRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    padding: spacing.md,
  },

  // Top Row
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs / 2,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  dateText: {
    ...typography.body2,
    fontWeight: '600',
    color: colors.primary.main,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  timeText: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  timeEndText: {
    color: colors.text.tertiary,
  },

  // Status Badge
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs / 2,
    borderRadius: 12,
    gap: spacing.xs / 2,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    ...typography.caption,
    fontWeight: '600',
    textTransform: 'capitalize',
  },

  // Client Info
  clientName: {
    ...typography.body1,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },

  // Details Row
  detailsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs / 2,
  },
  detailText: {
    ...typography.caption,
    color: colors.text.secondary,
    maxWidth: 120,
  },

  // Series Badge
  seriesBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs / 2,
    marginTop: spacing.xs,
    backgroundColor: colors.primary.main + '10',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs / 2,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  seriesText: {
    ...typography.caption,
    color: colors.primary.main,
    fontWeight: '500',
  },

  // A1: Single navigation arrow - vertically centered
  navigationArrow: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // A2: Quick Actions Row - Icon buttons spread horizontally
  quickActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
    gap: spacing.xs,
  },
  
  // BUG FIX #3: Icon-based button with tooltip, spreads to fill space
  quickActionIconBtn: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    borderRadius: 10,
    borderWidth: 1,
    minHeight: 56,
  },
  quickActionTooltip: {
    ...typography.caption,
    fontWeight: '600',
    fontSize: 10,
    marginTop: 4,
    textAlign: 'center',
  },
  
  // Legacy styles (kept for compatibility)
  quickActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: 8,
    borderWidth: 1,
    backgroundColor: colors.background.paper,
    marginRight: spacing.xs,
    marginBottom: spacing.xs,
  },
  quickActionText: {
    ...typography.caption,
    fontWeight: '600',
  },
});

export default AppointmentListItem;
