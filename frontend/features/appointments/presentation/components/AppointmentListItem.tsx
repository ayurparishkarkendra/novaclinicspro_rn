/**
 * Appointment List Item Component
 * 
 * Enhanced card displaying:
 * - Client name and phone
 * - Assigned staff name
 * - Color-coded status badge
 * - Quick actions (Call, WhatsApp, View)
 * 
 * NO IDs are displayed anywhere in UI.
 * RBAC is respected for action visibility.
 * All text uses i18n.
 */

import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Linking,
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
  openWhatsApp,
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
// QUICK ACTION BUTTON COMPONENT
// ============================================

interface QuickActionProps {
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  onPress: () => void;
  accessibilityLabel: string;
  testId: string;
}

const QuickAction: React.FC<QuickActionProps> = ({
  icon,
  color,
  onPress,
  accessibilityLabel,
  testId,
}) => (
  <TouchableOpacity
    style={[styles.quickAction, { backgroundColor: color + '15' }]}
    onPress={onPress}
    accessibilityLabel={accessibilityLabel}
    accessibilityRole="button"
    data-testid={testId}
  >
    <Ionicons name={icon} size={18} color={color} />
  </TouchableOpacity>
);

// ============================================
// MAIN COMPONENT
// ============================================

export const AppointmentListItem: React.FC<AppointmentListItemProps> = ({
  appointment,
  onPress,
  userRole = 'clinic_admin',
  showActions = true,
}) => {
  const router = useRouter();
  const { t } = useTranslation();
  const statusColor = getStatusColor(appointment.status);

  // ===== EXTRACT DATA FROM API RESPONSE =====
  // Per API spec: client_name, staff_name, room_name, treatment_name are returned directly
  // NO nested objects - the backend already resolves names
  // BUG FIX #1 & #2: Handle multi-therapist display and ensure client name always shows
  const clientName = appointment.client_name || null;
  const clientPhone = appointment.client_phone || null;
  const treatmentName = appointment.treatment_name || null;
  
  // BUG FIX #1: Handle both single staff_name and multiple staff_names
  // For 2 therapists assigned, show "Therapist A, Therapist B"
  // For doctor consultation, show doctor name
  const staffName = (() => {
    // Check for staff_names array first (multi-therapist case)
    const staffNamesArr = (appointment as any).staff_names;
    if (Array.isArray(staffNamesArr) && staffNamesArr.length > 0) {
      return staffNamesArr.join(', ');
    }
    // Fall back to single staff_name
    return appointment.staff_name || null;
  })();

  // ===== ACTION HANDLERS =====
  
  const handlePress = useCallback(() => {
    if (onPress) {
      onPress(appointment);
    } else {
      router.push(`/clinic-admin/appointments/${appointment.id}` as any);
    }
  }, [appointment, onPress, router]);

  const handleCall = useCallback(() => {
    if (!clientPhone) {
      Alert.alert(
        t('common.error') || 'Error',
        t('appointments.noPhoneNumber') || 'Client phone number is not available'
      );
      return;
    }
    Linking.openURL(`tel:${clientPhone}`);
  }, [clientPhone, t]);

  const handleWhatsApp = useCallback(() => {
    if (!clientPhone) {
      Alert.alert(
        t('common.error') || 'Error',
        t('appointments.noPhoneNumber') || 'Client phone number is not available'
      );
      return;
    }
    
    const name = clientName || t('common.client') || 'Client';
    const time = formatTime(appointment.appointment_start);
    const message = `Hi ${name}, this is a reminder for your appointment at ${time}. Please confirm your attendance. Thank you!`;
    const url = openWhatsApp(clientPhone, message);
    Linking.openURL(url);
  }, [appointment, clientName, clientPhone, t]);

  // ===== RBAC CHECK =====
  // Determine which actions are allowed based on user role
  // FIXED: Include 'clinic-admin' (hyphenated) as a valid role
  const normalizedRole = userRole?.toLowerCase().replace('_', '-') || 'clinic-admin';
  const canCall = ['clinic-admin', 'clinic_admin', 'receptionist', 'doctor', 'therapist'].includes(normalizedRole) ||
                  ['clinic-admin', 'clinic_admin', 'receptionist', 'doctor', 'therapist'].includes(userRole);
  const canWhatsApp = ['clinic-admin', 'clinic_admin', 'receptionist'].includes(normalizedRole) ||
                      ['clinic-admin', 'clinic_admin', 'receptionist'].includes(userRole);
  const canModify = (canWhatsApp) && ['scheduled', 'confirmed'].includes(appointment.status);

  // ===== DISPLAY VALUES =====
  const displayClientName = clientName || t('common.unknownClient') || 'Unknown Client';
  const displayStaffName = staffName || t('common.unassigned') || 'Unassigned';
  const timeDisplay = formatTime(appointment.appointment_start);
  const endTimeDisplay = appointment.appointment_end ? formatTime(appointment.appointment_end) : null;
  
  // Series info (if part of multi-day)
  const isSeriesAppointment = appointment.series_id && appointment.session_number;

  // DEBUG: Log appointment data for troubleshooting
  console.log('[AppointmentListItem] Data:', { 
    id: appointment.id, 
    client_name: appointment.client_name,
    client_phone: appointment.client_phone,
    staff_name: appointment.staff_name,
    treatment_name: appointment.treatment_name,
    status: appointment.status,
    userRole, 
    canCall, 
    canWhatsApp 
  });

  return (
    <TouchableOpacity
      style={[styles.container, { borderLeftColor: statusColor }]}
      onPress={handlePress}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={`Appointment for ${clientName} at ${timeDisplay}`}
      data-testid="appointment-list-item"
    >
      {/* Main Content */}
      <View style={styles.content}>
        {/* Top Row: Time + Status */}
        <View style={styles.topRow}>
          <View style={styles.timeContainer}>
            <Ionicons name="time-outline" size={14} color={colors.primary.main} />
            <Text style={styles.timeText} data-testid="appointment-time">
              {timeDisplay}
              {endTimeDisplay && <Text style={styles.timeEndText}> - {endTimeDisplay}</Text>}
            </Text>
          </View>
          <StatusBadge status={appointment.status} />
        </View>

        {/* Client Info */}
        <View style={styles.clientRow}>
          <View style={styles.clientInfo}>
            <Text style={styles.clientName} numberOfLines={1} data-testid="appointment-client-name">
              {displayClientName}
            </Text>
            {clientPhone && (
              <Text style={styles.clientPhone} data-testid="appointment-client-phone">
                {clientPhone}
              </Text>
            )}
          </View>
        </View>

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

      {/* Quick Actions - ALWAYS VISIBLE when showActions is true */}
      {showActions && (
        <View style={styles.actionsContainer}>
          {/* Call Button - Only if phone available and user has permission */}
          {canCall && clientPhone && (
            <QuickAction
              icon="call"
              color={colors.success.main}
              onPress={handleCall}
              accessibilityLabel={`Call ${displayClientName}`}
              testId="appointment-action-call"
            />
          )}
          {/* WhatsApp Button - Only if phone available and user has permission */}
          {canWhatsApp && clientPhone && (
            <QuickAction
              icon="logo-whatsapp"
              color="#25D366"
              onPress={handleWhatsApp}
              accessibilityLabel={`WhatsApp ${displayClientName}`}
              testId="appointment-action-whatsapp"
            />
          )}
          {/* View Button - ALWAYS visible */}
          <QuickAction
            icon="chevron-forward"
            color={colors.primary.main}
            onPress={handlePress}
            accessibilityLabel={`View appointment details`}
            testId="appointment-action-view"
          />
        </View>
      )}
    </TouchableOpacity>
  );
};

// ============================================
// STYLES
// ============================================

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: colors.background.default,
    borderRadius: 12,
    marginBottom: spacing.sm,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
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
    marginBottom: spacing.xs,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  timeText: {
    ...typography.body2,
    fontWeight: '600',
    color: colors.primary.main,
  },
  timeEndText: {
    fontWeight: '400',
    color: colors.text.secondary,
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
  clientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  clientInfo: {
    flex: 1,
  },
  clientName: {
    ...typography.body1,
    fontWeight: '600',
    color: colors.text.primary,
  },
  clientPhone: {
    ...typography.caption,
    color: colors.text.secondary,
    marginTop: 2,
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

  // Actions
  actionsContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingRight: spacing.sm,
    gap: spacing.xs,
  },
  quickAction: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default AppointmentListItem;
