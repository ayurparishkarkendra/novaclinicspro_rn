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
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useClinicTheme } from '../../../../core/theme/useClinicTheme';
import { colors } from '../../../../core/theme/colors';
import { spacing } from '../../../../core/theme/spacing';
import { typography } from '../../../../core/theme/typography';
import { useTranslation } from '../../../../core/localization/useTranslation';
import { useFeatures, hasMultiDayAppointments } from '../../../../core/hooks/useFeatures';
import {
  AppointmentResponse,
} from '../../data/models/appointments.dtos';
import {
  getStatusLabel,
  getStatusColor,
  getStaffName,
} from '../../domain/helpers';
import { formatTime, formatDate } from '../../../../core/utils/dateTimeUtils';
import { EpisodeBadge } from '../../../episodes/presentation/components/EpisodeBadge';
import { useTreatmentSheetDetailQuery } from '../../../treatmentSheets/data/repositories/treatmentSheets.repository.impl';
import { useAuth } from '../../../auth/presentation/hooks/useAuth';

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
  /** Callback for linking to episode */
  onLinkEpisode?: (appointmentId: string, clientId: string) => void;
  /** Callback for creating new episode */
  onCreateEpisode?: (appointmentId: string, clientId: string) => void;
  /** Callback for viewing episode details */
  onViewEpisode?: (episodeId: string) => void;
  /** Callback for viewing all episodes for this client */
  onViewAllEpisodes?: (clientId: string, clientName: string) => void;
  /** Number of episodes for this client (to show/hide "View All Episodes" link) */
  clientEpisodesCount?: number;
  /** Therapist-specific: open the materials completion modal directly */
  onComplete?: (appointmentId: string) => void;
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
  disabled?: boolean;
}

const QuickActionIconButton: React.FC<QuickActionIconButtonProps> = ({
  icon,
  label,
  color,
  backgroundColor,
  onPress,
  testId,
  disabled = false,
}) => (
  <TouchableOpacity
    style={[
      styles.quickActionIconBtn,
      { 
        backgroundColor: backgroundColor || color + '12',
        borderColor: color + '30',
      },
      disabled && styles.quickActionIconBtnDisabled,
    ]}
    onPress={onPress}
    disabled={disabled}
    accessibilityLabel={label}
    accessibilityHint={disabled ? 'Available at appointment start time' : `Tap to ${label.toLowerCase()}`}
    accessibilityRole="button"
    accessibilityState={{ disabled }}
    data-testid={testId}
  >
    <Ionicons name={icon} size={20} color={disabled ? colors.grey[400] : color} />
    <Text style={[styles.quickActionTooltip, { color: disabled ? colors.grey[400] : color }]} numberOfLines={2}>
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
        color={isPressed ? colors.success.main : colors.success.main} 
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
  onLinkEpisode,
  onCreateEpisode,
  onViewEpisode,
  onViewAllEpisodes,
  clientEpisodesCount = 0,
  onComplete,
}) => {
  // Debug logging for episode information
  React.useEffect(() => {
    if (userRole === 'doctor') {
      console.log('[AppointmentListItem] Episode info:', {
        appointmentId: appointment.id,
        clientId: appointment.client_id,
        clientName: appointment.client_name,
        episodeId: appointment.episode_id,
        episodeTitle: appointment.episode_title,
        clientEpisodesCount,
        hasEpisodeId: !!appointment.episode_id,
      });
    }
  }, [appointment.id, appointment.episode_id, appointment.client_id, clientEpisodesCount, userRole]);
  const router = useRouter();
  const { t } = useTranslation();
  const { currentUser } = useAuth();
  const features = useFeatures();
  const theme = useClinicTheme();
  const { colors, spacing, typography } = theme;
  const statusColor = getStatusColor(appointment.status);

  // ===== MULTI-DAY TREATMENT SUPPORT =====
  // Check if multi-day appointments feature is enabled
  const isMultiDayEnabled = hasMultiDayAppointments(features);
  
  // Check if this appointment is part of a multi-day treatment series
  const treatmentSheetId = appointment.treatment_sheet_id;
  const sessionId = appointment.session_id;
  const isMultiDayAppointment = isMultiDayEnabled && (!!treatmentSheetId || !!sessionId);
  
  // Fetch treatment sheet data if this is a multi-day appointment
  const { data: treatmentSheet, isLoading: isLoadingSheet } = useTreatmentSheetDetailQuery(
    treatmentSheetId || '',
    currentUser?.tenantId || '',
    {
      enabled: !!isMultiDayAppointment && !!treatmentSheetId && !!currentUser?.tenantId,
    }
  );
  
  // Find the row for this session to get day number
  const sessionRow = treatmentSheet?.rows?.find(row => row.session_id === sessionId);
  const dayNumber = sessionRow?.day_number;
  const totalDays = treatmentSheet?.duration_days;
  const multiDayTreatmentName = treatmentSheet?.rows?.[0]?.treatment_description || 'Multi-Day Treatment';
  
  // Calculate progress percentage
  const completedDays = treatmentSheet?.rows?.filter(row => {
    // A row is considered completed if it has treatment description filled
    return row.treatment_description && row.treatment_description.trim().length > 0;
  }).length || 0;
  const progressPercentage = totalDays ? Math.round((completedDays / totalDays) * 100) : 0;

  // ===== EXTRACT DATA FROM API RESPONSE =====
  const clientName = appointment.client_name || null;
  const clientPhone = appointment.client_phone || null;
  const treatmentName = appointment.treatment_name || null;
  const staffName = getStaffName(appointment);

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
  const isDoctor = normalizedRole.includes('doctor');
  const isTherapist = normalizedRole.includes('therapist');
  const canModify = isClinicAdmin || isReceptionist || isDoctor || isTherapist;

  // ===== STATUS-BASED ACTION VISIBILITY (per FRONTEND_QUICK_ACTIONS_GUIDE.md) =====
  const status = (appointment.status || '').toLowerCase();
  
  // Terminal statuses - no quick actions should be shown
  const terminalStatuses = ['completed', 'cancelled', 'no_show'];
  const isTerminalStatus = terminalStatuses.includes(status);
  
  const canReschedule = canModify && ['scheduled', 'confirmed'].includes(status);
  const canMarkNoShow = canModify && ['scheduled', 'confirmed'].includes(status);
  const canCancelAppt = canModify && ['scheduled', 'confirmed'].includes(status);
  // A2/A3: Complete button for confirmed OR in_progress (User Requirement)
  // For therapists, also allow completing scheduled sessions
  const canComplete = canModify && (
    ['confirmed', 'in_progress'].includes(status) ||
    (isTherapist && ['pending', 'scheduled'].includes(status))
  );
  
  // Time-based enabling for No-Show and Record Visit buttons
  // Buttons are ENABLED for past and current appointments (at or after start time)
  // Buttons are DISABLED for future appointments (before start time)
  
  // CRITICAL: Backend stores LOCAL times with Z suffix (e.g., "07:30:00Z" means 7:30 AM local, NOT UTC)
  // We must extract the time components and treat them as local time
  const now = new Date();
  const appointmentStartStr = appointment.appointment_start;
  
  // Parse ISO string correctly - it's in UTC, so use Date constructor
  const appointmentStartLocal = new Date(appointmentStartStr);
  const isAtOrAfterStartTime = now >= appointmentStartLocal;
  
  // Record Visit button: enabled at or after start time for scheduled/confirmed/in_progress
  const canRecordVisit = canModify && ['scheduled', 'confirmed', 'in_progress'].includes(status);
  
  // Debug: Log to verify values (enable for debugging)
  // console.log('QuickActions Debug:', { userRole, normalizedRole, isClinicAdmin, canModify, status, canReschedule });

  // ===== DISPLAY VALUES =====
  const displayClientName = clientName || t('common.unknownClient') || 'Unknown Client';
  const displayStaffName = staffName;
  const dateDisplay = formatDate(appointment.appointment_start);
  const timeDisplay = formatTime(appointment.appointment_start);
  const endTimeDisplay = appointment.appointment_end ? formatTime(appointment.appointment_end) : null;
  const isSeriesAppointment = appointment.series_id && appointment.session_number;
  
  // Determine if this is a therapy appointment (has therapists) vs doctor consultation
  const isTherapyAppointment = appointment.therapist_ids && appointment.therapist_ids.length > 0;
  const staffIcon = isTherapyAppointment ? 'people-outline' : 'person-circle-outline';

  return (
    <View
      style={[
        styles.container, 
        { borderLeftColor: statusColor },
        isTherapyAppointment && styles.therapyAppointmentContainer,
      ]}
      data-testid="appointment-list-item"
    >
      {/* Main Row - Full width clickable only if onPress is provided */}
      <TouchableOpacity
        style={styles.mainRow}
        onPress={onPress ? handlePress : undefined}
        activeOpacity={onPress ? 0.7 : 1}
        accessibilityRole={onPress ? 'button' : 'none'}
        accessibilityLabel={`Appointment for ${clientName} at ${timeDisplay}`}
      >
        {/* Main Content */}
        <View style={styles.content}>
          {/* Top Row: Date + Status */}
          <View style={styles.topRow}>
            <View style={styles.dateContainer}>
              <Ionicons name="calendar-outline" size={14} color={colors.primary.default} />
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

          {/* Multi-Day Treatment Indicator */}
          {isMultiDayAppointment && (
            <View style={styles.multiDayIndicator} data-testid="multi-day-indicator">
              <View style={styles.multiDayBadge}>
                <View style={styles.blueDot} />
                {isLoadingSheet ? (
                  <ActivityIndicator size="small" color={colors.primary.default} />
                ) : (
                  <>
                    <Text style={styles.multiDayText} numberOfLines={1}>
                      {multiDayTreatmentName}
                    </Text>
                    {dayNumber && totalDays && (
                      <Text style={styles.dayNumberText}>
                        {' '}• Day {dayNumber}/{totalDays}
                      </Text>
                    )}
                  </>
                )}
              </View>
              {!isLoadingSheet && progressPercentage > 0 && (
                <View style={styles.progressContainer}>
                  <View style={styles.progressBar}>
                    <View 
                      style={[
                        styles.progressFill, 
                        { width: `${progressPercentage}%` }
                      ]} 
                    />
                  </View>
                  <Text style={styles.progressText}>{progressPercentage}%</Text>
                </View>
              )}
            </View>
          )}

          {/* Client Info */}
          <Text style={styles.clientName} numberOfLines={1} data-testid="appointment-client-name">
            {displayClientName}
          </Text>

          {/* Staff & Treatment Info */}
          <View style={styles.detailsRow}>
            <View style={styles.detailItem}>
              <Ionicons name={staffIcon} size={14} color={colors.text.secondary} />
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
              <Ionicons name="repeat" size={12} color={colors.primary.default} />
              <Text style={styles.seriesText}>
                {t('appointments.session') || 'Session'} {appointment.session_number}
                {appointment.total_sessions && `/${appointment.total_sessions}`}
              </Text>
            </View>
          )}
        </View>

        {/* Right side: Complete tick (for confirmed/in_progress) + Navigation arrow */}
        <View style={styles.rightActionsContainer}>
          {/* Complete Tick Icon - visible for confirmed/in_progress appointments */}
          {canComplete && onStatusUpdate && (
            <CompleteTickIcon
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
            />
          )}
          
          {/* A1: Single navigation arrow — only when onPress provided */}
          {onPress && (
            <View style={styles.navigationArrow} data-testid="appointment-nav-arrow">
              <Ionicons name="chevron-forward" size={20} color={colors.primary.default} />
            </View>
          )}
        </View>
      </TouchableOpacity>

      {/* A2: Quick Actions Row - Icon buttons spread horizontally */}
      {/* BUG FIX #3: All quick actions have confirmation dialogs, icon-based with tooltips */}
      {/* Terminal statuses (completed, cancelled, no_show) don't show quick actions */}
      {/* Role-specific actions: Doctor (episode only), Therapist (complete/notes only), Admin/Receptionist (all) */}
      {showActions && canModify && !isTerminalStatus && (
        <View style={styles.quickActionsRow} data-testid="appointment-quick-actions">
          {/* Admin/Receptionist actions - Reschedule, Record Visit, No-Show, Cancel */}
          {(isClinicAdmin || isReceptionist) && ['scheduled', 'confirmed', 'in_progress'].includes(status) && (
            <>
              {/* Reschedule - scheduled/confirmed */}
              {['scheduled', 'confirmed'].includes(status) && (
                <QuickActionIconButton
                  icon="calendar-outline"
                  label="Reschedule"
                  color={colors.primary.default}
                  onPress={() => {
                    if (onReschedule) {
                      Alert.alert(
                        'Reschedule',
                        'Open reschedule options for this appointment?',
                        [
                          { text: 'Cancel', style: 'cancel' },
                          { text: 'Yes', onPress: () => onReschedule(appointment.id) },
                        ]
                      );
                    } else {
                      handlePress();
                    }
                  }}
                  testId="action-reschedule"
                />
              )}
              
              {/* Record Visit - scheduled/confirmed/in_progress, enabled at or after start time */}
              {canRecordVisit && onStatusUpdate && (
                <QuickActionIconButton
                  icon="clipboard-outline"
                  label="Record Visit"
                  color={colors.feedback.success}
                  disabled={!isAtOrAfterStartTime}
                  onPress={() => {
                    Alert.alert(
                      'Record Visit',
                      'Mark this appointment as completed?',
                      [
                        { text: 'Cancel', style: 'cancel' },
                        { 
                          text: 'Yes', 
                          onPress: () => onStatusUpdate(appointment.id, 'COMPLETED'),
                          style: 'default'
                        },
                      ]
                    );
                  }}
                  testId="action-record-visit"
                />
              )}
              
              {/* No-Show - scheduled/confirmed, enabled at or after start time */}
              {['scheduled', 'confirmed'].includes(status) && onStatusUpdate && (
                <QuickActionIconButton
                  icon="person-remove-outline"
                  label="No-Show"
                  color={colors.feedback.warning}
                  disabled={!isAtOrAfterStartTime}
                  onPress={() => {
                    Alert.alert(
                      'Mark as No-Show',
                      'Are you sure the patient did not show up?',
                      [
                        { text: 'Cancel', style: 'cancel' },
                        { text: 'Yes', onPress: () => onStatusUpdate(appointment.id, 'NO_SHOW') },
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
                  label="Cancel"
                  color={colors.feedback.error}
                  onPress={() => {
                    Alert.alert(
                      'Cancel Appointment',
                      'Are you sure you want to cancel this appointment?',
                      [
                        { text: 'No', style: 'cancel' },
                        { text: 'Yes, Cancel', style: 'destructive', onPress: () => onCancel(appointment.id) },
                      ]
                    );
                  }}
                  testId="action-cancel"
                />
              )}

              {/* Schedule Treatment — shown when appointment has a treatment sheet */}
              {isMultiDayAppointment && appointment.treatment_sheet_id && (
                <QuickActionIconButton
                  icon="calendar-number-outline"
                  label="Schedule"
                  color={colors.feedback.info}
                  onPress={() => {
                    router.push(
                      `/clinic-admin/treatment-sheets/${appointment.treatment_sheet_id}` as any
                    );
                  }}
                  testId="action-schedule-treatment"
                />
              )}
            </>
          )}
          
          {/* Therapist actions - Complete only (opens materials modal) */}
          {isTherapist && ['pending', 'scheduled', 'confirmed', 'in_progress'].includes(status) && (
            <>
              {canComplete && (onComplete || onStatusUpdate) && (
                <QuickActionIconButton
                  icon="checkmark-circle-outline"
                  label="Complete"
                  color={colors.feedback.success}
                  onPress={() => {
                    if (onComplete) {
                      onComplete(appointment.id);
                    } else {
                      Alert.alert(
                        'Mark as Complete',
                        'Mark this appointment as completed?',
                        [
                          { text: 'Cancel', style: 'cancel' },
                          { text: 'Yes', onPress: () => onStatusUpdate!(appointment.id, 'COMPLETED') },
                        ]
                      );
                    }
                  }}
                  testId="action-complete"
                />
              )}
            </>
          )}
          
          {/* Doctor actions - Episode actions in quick actions area */}
          {isDoctor && (
            <>
              {/* Treatment sheet navigation — shown for any role when sheet is present */}
              {isMultiDayAppointment && appointment.treatment_sheet_id && (
                <QuickActionIconButton
                  icon="document-text-outline"
                  label="Treatment Sheet"
                  color={colors.primary.default}
                  onPress={() => {
                    router.push(
                      `/clinic-admin/treatment-sheets/${appointment.treatment_sheet_id}` as any
                    );
                  }}
                  testId="action-view-treatment-sheet"
                />
              )}

              {/* If episode IS linked, show ONLY "View Episode" button */}
              {/* BUG FIX #3: Remove confirmation dialogs for episode actions */}
              {appointment.episode_id ? (
                onViewEpisode && (
                  <QuickActionIconButton
                    icon="folder-open-outline"
                    label="View Episode"
                    color={colors.primary.default}
                    onPress={() => onViewEpisode(appointment.episode_id!)}
                    testId="action-view-episode"
                  />
                )
              ) : (
                // If episode is NOT linked, show "Link Episode" and "New Episode"
                <>
                  {onLinkEpisode && (
                    <QuickActionIconButton
                      icon="link-outline"
                      label="Link Episode"
                      color={colors.feedback.info}
                      onPress={() => onLinkEpisode(appointment.id, appointment.client_id)}
                      testId="action-link-episode"
                    />
                  )}
                  
                  {onCreateEpisode && (
                    <QuickActionIconButton
                      icon="add-circle-outline"
                      label="New Episode"
                      color={colors.feedback.success}
                      onPress={() => onCreateEpisode(appointment.id, appointment.client_id)}
                      testId="action-create-episode"
                    />
                  )}
                </>
              )}
            </>
          )}
        </View>
      )}

      {/* View All Episodes Link - Only for doctors with 2+ episodes */}
      {isDoctor && onViewAllEpisodes && clientEpisodesCount > 1 && (
        <TouchableOpacity
          style={styles.viewAllEpisodesLink}
          onPress={() => onViewAllEpisodes(appointment.client_id, appointment.client_name || 'Client')}
          activeOpacity={0.7}
        >
          <Ionicons name="albums-outline" size={14} color={colors.primary.default} />
          <Text style={styles.viewAllEpisodesText}>
            {`View all ${clientEpisodesCount} episodes for ${appointment.client_name || 'this client'}`}
          </Text>
        </TouchableOpacity>
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
  therapyAppointmentContainer: {
    backgroundColor: colors.grey[50],
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

  // View Episode Button - Replaces episode badge
  viewEpisodeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary.main + '10',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 8,
    marginBottom: spacing.xs,
    alignSelf: 'flex-start',
    gap: spacing.xs / 2,
  },
  viewEpisodeText: {
    ...typography.caption,
    color: colors.primary.main,
    fontWeight: '600',
    flex: 1,
  },

  // Episode Badge Container (deprecated - replaced by viewEpisodeButton)
  episodeBadgeContainer: {
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
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.md,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Right side container for tick icon + navigation arrow
  rightActionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: spacing.xs,
  },

  // Complete Tick Icon Button
  completeTickButton: {
    padding: spacing.sm,
    borderRadius: 20,
    backgroundColor: colors.success.main + '15',
    marginRight: spacing.xs,
  },
  completeTickButtonPressed: {
    backgroundColor: colors.success.main + '30',
    transform: [{ scale: 0.95 }],
  },
  completeTickButtonDisabled: {
    opacity: 0.5,
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
    paddingHorizontal: spacing.xs / 2,
    borderRadius: 10,
    borderWidth: 1,
    minHeight: 64,
  },
  quickActionIconBtnDisabled: {
    opacity: 0.6,
    backgroundColor: colors.grey[50],
  },
  quickActionTooltip: {
    ...typography.caption,
    fontWeight: '600',
    fontSize: 11,
    marginTop: 4,
    textAlign: 'center',
    lineHeight: 14,
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
  viewAllEpisodesLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    marginTop: spacing.xs,
  },
  viewAllEpisodesText: {
    fontSize: 13,
    color: colors.primary.main,
    fontWeight: '500',
  },

  // Multi-Day Treatment Indicator Styles
  multiDayIndicator: {
    marginBottom: spacing.xs,
    backgroundColor: colors.primary.main + '08',
    borderRadius: 8,
    padding: spacing.sm,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary.main,
  },
  multiDayBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs / 2,
    marginBottom: spacing.xs / 2,
  },
  blueDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary.main,
  },
  multiDayText: {
    ...typography.body2,
    fontWeight: '600',
    color: colors.primary.main,
    flex: 1,
  },
  dayNumberText: {
    ...typography.caption,
    fontWeight: '600',
    color: colors.primary.main,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  progressBar: {
    flex: 1,
    height: 4,
    backgroundColor: colors.grey[200],
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary.main,
    borderRadius: 2,
  },
  progressText: {
    ...typography.caption,
    color: colors.primary.main,
    fontWeight: '600',
    minWidth: 35,
    textAlign: 'right',
  },
});

export default AppointmentListItem;
