/**
 * Appointment Detail Screen
 * 
 * STRUCTURE:
 * - Client Section (name, phone, quick call action)
 * - Visit History Section (previous appointments for this client)
 * - Appointment Info Section
 * - Quick Actions Section (RBAC-based)
 * 
 * WHATSAPP TRIGGERS on status changes:
 * - Created (on creation)
 * - Rescheduled
 * - Cancelled
 * - No-Show
 * - Completed
 * 
 * NO IDs displayed in UI.
 * All text uses i18n.
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Linking,
  Platform,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { colors } from '../../../../core/theme/colors';
import { spacing } from '../../../../core/theme/spacing';
import { typography } from '../../../../core/theme/typography';
import { useTranslation } from '../../../../core/localization/useTranslation';
import { useAuth } from '../../../auth/presentation/hooks/useAuth';
import {
  useAppointmentDetailQuery,
  useUpdateAppointmentMutation,
  useCancelAppointmentMutation,
  useRescheduleAppointmentMutation,
  useAppointmentsListQuery,
} from '../../data/repositories/appointments.repository.impl';
import {
  getStatusLabel,
  getStatusColor,
  formatDate,
  formatTime,
  calculateDuration,
  formatDuration,
  openWhatsApp,
  generateWhatsAppConfirmationMessage,
  generateWhatsAppCancellationMessage,
  generateWhatsAppRescheduleMessage,
  generateWhatsAppNoShowMessage,
  generateWhatsAppCompletedMessage,
  getTherapistNames,
  getTherapistCount,
  hasMultipleTherapists,
} from '../../data/models/appointments.dtos';

// ============================================
// SECTION HEADER COMPONENT
// ============================================

interface SectionHeaderProps {
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
}

const SectionHeader: React.FC<SectionHeaderProps> = ({ title, icon }) => (
  <View style={styles.sectionHeader}>
    <Ionicons name={icon} size={18} color={colors.primary.main} />
    <Text style={styles.sectionTitle}>{title}</Text>
  </View>
);

// ============================================
// INFO ROW COMPONENT
// ============================================

interface InfoRowProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string | null;
  valueColor?: string;
  onPress?: () => void;
  showChevron?: boolean;
  testId?: string;
}

const InfoRow: React.FC<InfoRowProps> = ({ 
  icon, 
  label, 
  value, 
  valueColor, 
  onPress, 
  showChevron = false,
  testId,
}) => (
  <TouchableOpacity
    style={styles.infoRow}
    onPress={onPress}
    disabled={!onPress}
    activeOpacity={onPress ? 0.7 : 1}
    data-testid={testId}
  >
    <View style={styles.infoIcon}>
      <Ionicons name={icon} size={18} color={colors.primary.main} />
    </View>
    <View style={styles.infoContent}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={[styles.infoValue, valueColor && { color: valueColor }]}>
        {value || '—'}
      </Text>
    </View>
    {(onPress || showChevron) && (
      <Ionicons name="chevron-forward" size={18} color={colors.text.tertiary} />
    )}
  </TouchableOpacity>
);

// ============================================
// ACTION BUTTON COMPONENT
// ============================================

interface ActionButtonProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  color: string;
  onPress: () => void;
  disabled?: boolean;
  variant?: 'filled' | 'outlined';
  testId?: string;
}

const ActionButton: React.FC<ActionButtonProps> = ({ 
  icon, 
  label, 
  color, 
  onPress, 
  disabled,
  variant = 'outlined',
  testId,
}) => (
  <TouchableOpacity
    style={[
      styles.actionButton,
      variant === 'filled' 
        ? { backgroundColor: color } 
        : { backgroundColor: color + '15', borderWidth: 1, borderColor: color + '30' },
      disabled && styles.actionButtonDisabled,
    ]}
    onPress={onPress}
    disabled={disabled}
    accessibilityRole="button"
    accessibilityState={{ disabled }}
    data-testid={testId}
  >
    <Ionicons 
      name={icon} 
      size={18} 
      color={disabled ? colors.text.tertiary : (variant === 'filled' ? colors.background.default : color)} 
    />
    <Text style={[
      styles.actionButtonText, 
      { color: disabled ? colors.text.tertiary : (variant === 'filled' ? colors.background.default : color) }
    ]}>
      {label}
    </Text>
  </TouchableOpacity>
);

// ============================================
// VISIT HISTORY ITEM COMPONENT
// ============================================

interface VisitHistoryItemProps {
  appointment: any;
  onPress: () => void;
}

const VisitHistoryItem: React.FC<VisitHistoryItemProps> = ({ appointment, onPress }) => {
  const statusColor = getStatusColor(appointment.status);
  
  // Extract prescription and payment info from appointment if available
  const hasPrescription = appointment.prescription_id || appointment.has_prescription;
  const hasPayment = appointment.payment_id || appointment.payment_status || appointment.has_payment;
  const paymentAmount = appointment.payment_amount;
  const paymentStatus = appointment.payment_status;
  
  return (
    <TouchableOpacity 
      style={styles.visitHistoryItem} 
      onPress={onPress}
      data-testid={`visit-history-item-${appointment.id}`}
    >
      <View style={[styles.visitHistoryDot, { backgroundColor: statusColor }]} />
      <View style={styles.visitHistoryContent}>
        <Text style={styles.visitHistoryDate}>
          {formatDate(appointment.appointment_start)}
        </Text>
        <Text style={styles.visitHistoryTime}>
          {formatTime(appointment.appointment_start)}
        </Text>
        {appointment.treatment_name && (
          <Text style={styles.visitHistoryTreatment} numberOfLines={1}>
            {appointment.treatment_name}
          </Text>
        )}
        {/* Prescription Info (User Requirement #2) */}
        <View style={styles.visitHistoryMeta}>
          <Text style={[
            styles.visitHistoryMetaText,
            hasPrescription ? styles.visitHistoryMetaPresent : styles.visitHistoryMetaAbsent
          ]}>
            {hasPrescription ? '💊 Prescription given' : 'No prescription'}
          </Text>
        </View>
        {/* Payment Info (User Requirement #2) */}
        <View style={styles.visitHistoryMeta}>
          <Text style={[
            styles.visitHistoryMetaText,
            hasPayment ? styles.visitHistoryMetaPresent : styles.visitHistoryMetaAbsent
          ]}>
            {hasPayment 
              ? `💰 ${paymentStatus || 'Paid'}${paymentAmount ? ` - ₹${paymentAmount}` : ''}`
              : 'No payment recorded'}
          </Text>
        </View>
      </View>
      <View style={[styles.visitHistoryStatus, { backgroundColor: statusColor + '15' }]}>
        <Text style={[styles.visitHistoryStatusText, { color: statusColor }]}>
          {getStatusLabel(appointment.status)}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

// ============================================
// MAIN SCREEN
// ============================================

export const AppointmentDetailScreen: React.FC = () => {
  const router = useRouter();
  const { t } = useTranslation();
  const { appointmentId } = useLocalSearchParams<{ appointmentId: string }>();
  const { currentUser } = useAuth();
  const tenantId = currentUser?.tenantId || '';
  const userRole = currentUser?.roles?.[0] || 'clinic_admin';

  // State for reschedule
  const [showReschedulePicker, setShowReschedulePicker] = useState(false);
  const [rescheduleDate, setRescheduleDate] = useState<Date | null>(null);
  const [showRescheduleTime, setShowRescheduleTime] = useState(false);
  const [rescheduleTime, setRescheduleTime] = useState<Date | null>(null);

  // Queries
  const {
    data: appointment,
    isLoading,
    isError,
    error,
    refetch,
    isRefetching,
  } = useAppointmentDetailQuery(tenantId, appointmentId || '');

  // Query for visit history (previous appointments for this client)
  const clientId = appointment?.client_id;
  const { data: clientAppointments } = useAppointmentsListQuery(
    tenantId,
    { client_id: clientId, limit: 10 },
    { enabled: !!clientId }
  );

  // Filter visit history to exclude current appointment
  const visitHistory = (clientAppointments?.items || [])
    .filter((apt: any) => apt.id !== appointmentId)
    .slice(0, 5);

  // Mutations
  const updateMutation = useUpdateAppointmentMutation(tenantId, appointmentId || '');
  const cancelMutation = useCancelAppointmentMutation(tenantId);
  const rescheduleMutation = useRescheduleAppointmentMutation(tenantId, appointmentId || '');

  // ===== EXTRACT DATA FROM API RESPONSE =====
  // Per API spec: client_name, staff_assignments, room_name, treatment_name are returned directly
  const clientName = appointment?.client_name || null;
  const clientPhone = appointment?.client_phone || null;
  const treatmentName = appointment?.treatment_name || null;
  const roomName = appointment?.room_name || null;
  
  // Use the new helper function to get therapist names from staff_assignments
  const staffName = appointment ? getTherapistNames(appointment) : null;
  const therapistCount = appointment ? getTherapistCount(appointment) : 0;

  // ===== RBAC CHECK =====
  // Determine which actions are allowed based on user role
  // FIXED: Include 'clinic-admin' (hyphenated) as a valid role
  const normalizedRole = userRole?.toLowerCase().replace('_', '-') || 'clinic-admin';
  const canModifyAppointment = ['clinic-admin', 'clinic_admin', 'receptionist'].includes(normalizedRole) ||
                               ['clinic-admin', 'clinic_admin', 'receptionist'].includes(userRole);
  const canStartSession = ['clinic-admin', 'clinic_admin', 'doctor', 'therapist'].includes(normalizedRole) ||
                          ['clinic-admin', 'clinic_admin', 'doctor', 'therapist'].includes(userRole);
  const canCompleteSession = canStartSession;
  const canMarkNoShow = canModifyAppointment;
  const canCall = ['clinic-admin', 'clinic_admin', 'receptionist', 'doctor', 'therapist'].includes(normalizedRole) ||
                  ['clinic-admin', 'clinic_admin', 'receptionist', 'doctor', 'therapist'].includes(userRole);
  const canWhatsApp = canModifyAppointment;

  // Call client directly
  const handleCallClient = useCallback(() => {
    if (!clientPhone) {
      Alert.alert(t('common.error') || 'Error', t('appointments.noPhoneNumber') || 'No phone number available');
      return;
    }
    Linking.openURL(`tel:${clientPhone}`);
  }, [clientPhone, t]);

  // ===== WHATSAPP HANDLERS FOR ALL STATUS CHANGES =====
  
  // Generic WhatsApp sender with status-specific message
  const sendWhatsAppForStatus = useCallback((
    status: string,
    newDateTime?: { date: string; time: string }
  ) => {
    if (!clientPhone || !appointment) return;

    const displayClientName = clientName || t('common.client') || 'Client';
    const displayStaffName = staffName || t('common.staff') || 'Staff';
    const displayTreatment = treatmentName || t('common.appointment') || 'Appointment';
    const clinicPhoneNum = '+91-XXXXXXXXXX';
    const clinicName = t('common.yourClinic') || 'Your Clinic';
    const appointmentType = appointment.appointment_type;

    let message = '';

    switch (status) {
      case 'confirmed':
        message = generateWhatsAppConfirmationMessage(
          displayClientName,
          clinicName,
          formatDate(appointment.appointment_start),
          formatTime(appointment.appointment_start),
          displayStaffName,
          displayTreatment,
          clinicPhoneNum,
          appointmentType
        );
        break;
      case 'cancelled':
        message = generateWhatsAppCancellationMessage(
          displayClientName,
          formatDate(appointment.appointment_start),
          formatTime(appointment.appointment_start),
          displayTreatment,
          clinicPhoneNum
        );
        break;
      case 'rescheduled':
        if (newDateTime) {
          message = generateWhatsAppRescheduleMessage(
            displayClientName,
            formatDate(appointment.appointment_start),
            formatTime(appointment.appointment_start),
            newDateTime.date,
            newDateTime.time,
            displayStaffName,
            displayTreatment,
            appointmentType
          );
        }
        break;
      case 'no_show':
        message = generateWhatsAppNoShowMessage(
          displayClientName,
          formatDate(appointment.appointment_start),
          formatTime(appointment.appointment_start),
          displayTreatment,
          clinicPhoneNum
        );
        break;
      case 'completed':
        message = generateWhatsAppCompletedMessage(
          displayClientName,
          formatDate(appointment.appointment_start),
          displayTreatment,
          clinicPhoneNum
        );
        break;
      default:
        return;
    }

    const url = openWhatsApp(clientPhone, message);
    
    Alert.alert(
      t('appointments.notifyClient'),
      t('appointments.sendWhatsAppConfirmation'),
      [
        { text: t('common.skip'), style: 'cancel' },
        { text: t('appointments.sendWhatsApp'), onPress: () => Linking.openURL(url) },
      ]
    );
  }, [appointment, t]);

  // Handle status update with WhatsApp trigger
  const handleStatusUpdate = useCallback(async (newStatus: string) => {
    if (!appointment) return;

    const statusMessages: Record<string, string> = {
      confirmed: t('appointments.markAsConfirmed'),
      in_progress: t('appointments.startAppointment'),
      completed: t('appointments.markAsCompleted'),
      no_show: t('appointments.markAsNoShow'),
    };

    Alert.alert(
      statusMessages[newStatus] || t('appointments.updateStatus'),
      t('appointments.confirmStatusChange'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.yes'),
          onPress: async () => {
            try {
              await updateMutation.mutateAsync({ status: newStatus });
              Alert.alert(t('common.success'), t('appointments.statusUpdated'));
              refetch();

              // Offer WhatsApp notification for status changes
              if (appointment.client_phone && canWhatsApp) {
                setTimeout(() => {
                  sendWhatsAppForStatus(newStatus);
                }, 500);
              }
            } catch (err: any) {
              Alert.alert(t('common.error'), err.message || t('appointments.updateFailed'));
            }
          },
        },
      ]
    );
  }, [appointment, updateMutation, refetch, sendWhatsAppForStatus, t, canWhatsApp]);

  // Handle cancel with WhatsApp trigger
  const handleCancel = useCallback(() => {
    if (!appointment) return;

    Alert.alert(
      t('appointments.cancelAppointment'),
      t('appointments.confirmCancel'),
      [
        { text: t('common.no'), style: 'cancel' },
        {
          text: t('common.yesCancel'),
          style: 'destructive',
          onPress: async () => {
            try {
              await cancelMutation.mutateAsync(appointmentId || '');
              Alert.alert(t('common.success'), t('appointments.appointmentCancelled'));
              refetch();

              // Offer WhatsApp notification for cancellation
              if (appointment.client_phone && canWhatsApp) {
                setTimeout(() => {
                  sendWhatsAppForStatus('cancelled');
                }, 500);
              }
            } catch (err: any) {
              Alert.alert(t('common.error'), err.message || t('appointments.cancelFailed'));
            }
          },
        },
      ]
    );
  }, [appointment, cancelMutation, appointmentId, refetch, sendWhatsAppForStatus, t, canWhatsApp]);

  // Handle reschedule initiation
  const handleReschedule = useCallback(() => {
    if (!appointment) return;
    setRescheduleDate(new Date(appointment.appointment_start));
    setShowReschedulePicker(true);
  }, [appointment]);

  // Confirm reschedule with WhatsApp trigger
  const confirmReschedule = useCallback(async () => {
    if (!appointment || !rescheduleDate || !rescheduleTime) return;

    const newDateTime = new Date(rescheduleDate);
    newDateTime.setHours(rescheduleTime.getHours(), rescheduleTime.getMinutes());

    const duration = calculateDuration(appointment.appointment_start, appointment.appointment_end) || 60;
    const newEndTime = new Date(newDateTime);
    newEndTime.setMinutes(newEndTime.getMinutes() + duration);

    try {
      await rescheduleMutation.mutateAsync({
        new_start: newDateTime.toISOString(),
        new_end: newEndTime.toISOString(),
      });

      setShowReschedulePicker(false);
      setShowRescheduleTime(false);
      Alert.alert(t('common.success'), t('appointments.appointmentRescheduled'));
      refetch();

      // Offer WhatsApp notification for rescheduling
      if (appointment.client_phone && canWhatsApp) {
        setTimeout(() => {
          sendWhatsAppForStatus('rescheduled', {
            date: formatDate(newDateTime.toISOString()),
            time: formatTime(newDateTime.toISOString()),
          });
        }, 500);
      }
    } catch (err: any) {
      Alert.alert(t('common.error'), err.message || t('appointments.rescheduleFailed'));
    }
  }, [appointment, rescheduleDate, rescheduleTime, rescheduleMutation, refetch, sendWhatsAppForStatus, t, canWhatsApp]);

  // Navigate to visit history item
  const handleVisitHistoryPress = useCallback((historyAppointmentId: string) => {
    router.push(`/clinic-admin/appointments/${historyAppointmentId}` as any);
  }, [router]);

  // Loading state
  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary.main} />
          <Text style={styles.loadingText}>{t('common.loading')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Error state
  if (isError || !appointment) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
          </TouchableOpacity>
        </View>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={64} color={colors.error.main} />
          <Text style={styles.errorTitle}>{t('appointments.loadFailed')}</Text>
          <Text style={styles.errorText}>
            {error?.message || t('appointments.notFound')}
          </Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => refetch()}>
            <Text style={styles.retryButtonText}>{t('common.retry')}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const statusColor = getStatusColor(appointment.status);
  const duration = calculateDuration(appointment.appointment_start, appointment.appointment_end);
  const canModify = canModifyAppointment && ['scheduled', 'confirmed'].includes(appointment.status);
  const canStart = canStartSession && appointment.status === 'confirmed';
  const canComplete = canCompleteSession && appointment.status === 'in_progress';
  const isPartOfSeries = appointment.series_id && appointment.session_number;

  // Display values with fallbacks
  const displayClientName = clientName || t('common.unknownClient') || 'Unknown Client';
  const displayClientPhone = clientPhone;
  const displayStaffName = staffName;
  const displayTreatmentName = treatmentName;
  const displayRoomName = roomName;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => router.back()}
          accessibilityLabel={t('common.goBack') || 'Go back'}
          data-testid="detail-back-button"
        >
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('navigation.appointments') || 'Appointments'}</Text>
        {/* WhatsApp Button - Show if user has permission */}
        {canWhatsApp && (
          <TouchableOpacity 
            style={[styles.whatsappButton, !displayClientPhone && { opacity: 0.5 }]} 
            onPress={() => displayClientPhone && sendWhatsAppForStatus('confirmed')}
            disabled={!displayClientPhone}
            accessibilityLabel={t('appointments.sendWhatsApp') || 'Send WhatsApp'}
            data-testid="detail-whatsapp-button"
          >
            <Ionicons name="logo-whatsapp" size={24} color="#25D366" />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} colors={[colors.primary.main]} />
        }
      >
        {/* Status Badge Row */}
        <View style={styles.statusSection}>
          <View style={[styles.statusBadge, { backgroundColor: statusColor + '15' }]}>
            <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
            <Text style={[styles.statusText, { color: statusColor }]}>
              {getStatusLabel(appointment.status)}
            </Text>
          </View>
          {isPartOfSeries && (
            <View style={styles.sessionBadge}>
              <Ionicons name="repeat" size={14} color={colors.primary.main} />
              <Text style={styles.sessionBadgeText}>
                {t('appointments.session') || 'Session'} {appointment.session_number}/{appointment.total_sessions}
              </Text>
            </View>
          )}
        </View>

        {/* CLIENT SECTION */}
        <View style={styles.section} data-testid="detail-client-section">
          <SectionHeader title={t('common.client') || 'Client'} icon="person" />
          <View style={styles.clientCard}>
            <View style={styles.clientMainInfo}>
              <Text style={styles.clientName} data-testid="detail-client-name">
                {displayClientName}
              </Text>
              {displayClientPhone && (
                <Text style={styles.clientPhone} data-testid="detail-client-phone">
                  {displayClientPhone}
                </Text>
              )}
            </View>
            {/* Quick Call Action - Always show if user has permission */}
            {canCall && (
              <TouchableOpacity 
                style={[styles.callButton, !displayClientPhone && { opacity: 0.5, backgroundColor: colors.grey[400] }]}
                onPress={handleCallClient}
                disabled={!displayClientPhone}
                accessibilityLabel={t('appointments.callClient') || 'Call client'}
                data-testid="detail-call-button"
              >
                <Ionicons name="call" size={20} color={colors.background.default} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* VISIT HISTORY SECTION */}
        {visitHistory.length > 0 && (
          <View style={styles.section} data-testid="detail-visit-history-section">
            <SectionHeader title={t('appointments.visitHistory') || 'Visit History'} icon="time" />
            <View style={styles.visitHistoryCard}>
              {visitHistory.map((historyItem: any) => (
                <VisitHistoryItem
                  key={historyItem.id}
                  appointment={historyItem}
                  onPress={() => handleVisitHistoryPress(historyItem.id)}
                />
              ))}
            </View>
          </View>
        )}

        {/* APPOINTMENT INFO SECTION */}
        <View style={styles.section} data-testid="detail-appointment-info-section">
          <SectionHeader title={t('appointments.appointmentDetails') || 'Appointment Details'} icon="calendar" />
          <View style={styles.card}>
            <InfoRow
              icon="calendar-outline"
              label={t('common.date') || 'Date'}
              value={formatDate(appointment.appointment_start)}
              testId="detail-date"
            />
            <InfoRow
              icon="time-outline"
              label={t('common.time') || 'Time'}
              value={`${formatTime(appointment.appointment_start)} - ${formatTime(appointment.appointment_end)}`}
              testId="detail-time"
            />
            <InfoRow
              icon="hourglass-outline"
              label={t('common.duration') || 'Duration'}
              value={formatDuration(duration)}
              testId="detail-duration"
            />
            {displayTreatmentName && (
              <InfoRow
                icon="medical-outline"
                label={t('common.treatment') || 'Treatment'}
                value={displayTreatmentName}
                testId="detail-treatment"
              />
            )}
            {displayStaffName && (
              <InfoRow
                icon="person-circle-outline"
                label={t('common.staff') || 'Staff'}
                value={displayStaffName}
                testId="detail-staff"
              />
            )}
            {displayRoomName && (
              <InfoRow
                icon="business-outline"
                label={t('common.room') || 'Room'}
                value={displayRoomName}
                testId="detail-room"
              />
            )}
          </View>
        </View>

        {/* Notes Section */}
        {appointment.notes && (
          <View style={styles.section}>
            <SectionHeader title={t('common.notes') || 'Notes'} icon="document-text" />
            <View style={styles.notesCard}>
              <Text style={styles.notesText}>{appointment.notes}</Text>
            </View>
          </View>
        )}

        {/* QUICK ACTIONS SECTION - ALWAYS VISIBLE (User Requirement #1) */}
        <View style={styles.section} data-testid="detail-actions-section">
          <SectionHeader title={t('appointments.quickActions') || 'Quick Actions'} icon="flash" />
          <View style={styles.actionsContainer}>
            {/* Status-specific actions for active appointments */}
            {/* User Required: Reschedule, No-Show, Cancel, Complete */}
            {/* FIX: Use case-insensitive status comparison */}
            {['scheduled', 'confirmed', 'in_progress'].includes(appointment.status?.toLowerCase()) ? (
              <>
                {/* Actions Row - User required buttons in order */}
                <View style={styles.actionsRow}>
                  {/* Reschedule - for scheduled/confirmed (User Requirement #1) */}
                  {['scheduled', 'confirmed'].includes(appointment.status?.toLowerCase()) && (
                    <ActionButton
                      icon="calendar-outline"
                      label={t('appointments.reschedule') || 'Reschedule'}
                      color={colors.primary.main}
                      onPress={handleReschedule}
                      disabled={!canModify}
                      testId="action-reschedule"
                    />
                  )}
                  {/* No-Show - for scheduled/confirmed (User Requirement #2) */}
                  {['scheduled', 'confirmed'].includes(appointment.status?.toLowerCase()) && (
                    <ActionButton
                      icon="alert-circle-outline"
                      label={t('appointments.noShow') || 'No-Show'}
                      color={colors.warning.main}
                      onPress={() => handleStatusUpdate('no_show')}
                      disabled={!canMarkNoShow}
                      testId="action-no-show"
                    />
                  )}
                  {/* Cancel - for scheduled/confirmed (User Requirement #3) */}
                  {['scheduled', 'confirmed'].includes(appointment.status?.toLowerCase()) && (
                    <ActionButton
                      icon="close-circle-outline"
                      label={t('common.cancel') || 'Cancel'}
                      color={colors.error.main}
                      onPress={handleCancel}
                      disabled={!canModify}
                      testId="action-cancel"
                    />
                  )}
                  {/* Complete - for in_progress (User Requirement #4) */}
                  {appointment.status?.toLowerCase() === 'in_progress' && (
                    <ActionButton
                      icon="checkmark-done-circle"
                      label={t('appointments.complete') || 'Complete'}
                      color={colors.success.main}
                      onPress={() => handleStatusUpdate('completed')}
                      disabled={!canCompleteSession}
                      variant="filled"
                      testId="action-complete"
                    />
                  )}
                </View>
              </>
            ) : (
              /* Empty/Completed state - Always show section with "No actions available" message */
              <View style={styles.actionsEmptyState} data-testid="actions-empty-state">
                <Ionicons name="information-circle-outline" size={24} color={colors.text.tertiary} />
                <Text style={styles.actionsEmptyText}>
                  {appointment.status === 'completed' 
                    ? t('appointments.appointmentCompleted') || 'This appointment has been completed'
                    : appointment.status === 'cancelled'
                    ? t('appointments.appointmentCancelled') || 'This appointment has been cancelled'
                    : appointment.status === 'no_show'
                    ? t('appointments.clientNoShow') || 'Client did not show up'
                    : t('appointments.noActionsAvailable') || 'No actions available'
                  }
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Timestamps */}
        <View style={styles.metaSection}>
          {appointment.created_at && (
            <Text style={styles.metaText}>
              {t('common.created')}: {formatDate(appointment.created_at)}
            </Text>
          )}
          {appointment.updated_at && (
            <Text style={styles.metaText}>
              {t('common.updated')}: {formatDate(appointment.updated_at)}
            </Text>
          )}
        </View>
      </ScrollView>

      {/* Reschedule Date Picker */}
      {showReschedulePicker && (
        <View style={styles.pickerOverlay}>
          <View style={styles.pickerContainer}>
            <Text style={styles.pickerTitle}>{t('appointments.selectNewDate')}</Text>
            <DateTimePicker
              value={rescheduleDate || new Date()}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              minimumDate={new Date()}
              onChange={(event: DateTimePickerEvent, date?: Date) => {
                if (event.type === 'dismissed') {
                  setShowReschedulePicker(false);
                  return;
                }
                if (date) {
                  setRescheduleDate(date);
                  if (Platform.OS === 'android') {
                    setShowReschedulePicker(false);
                    setRescheduleTime(new Date(appointment.appointment_start));
                    setShowRescheduleTime(true);
                  }
                }
              }}
            />
            {Platform.OS === 'ios' && (
              <View style={styles.pickerButtons}>
                <TouchableOpacity
                  style={styles.pickerCancelButton}
                  onPress={() => setShowReschedulePicker(false)}
                >
                  <Text style={styles.pickerCancelText}>{t('common.cancel')}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.pickerConfirmButton}
                  onPress={() => {
                    setShowReschedulePicker(false);
                    setRescheduleTime(new Date(appointment.appointment_start));
                    setShowRescheduleTime(true);
                  }}
                >
                  <Text style={styles.pickerConfirmText}>{t('common.next')}</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      )}

      {/* Reschedule Time Picker */}
      {showRescheduleTime && (
        <View style={styles.pickerOverlay}>
          <View style={styles.pickerContainer}>
            <Text style={styles.pickerTitle}>{t('appointments.selectNewTime')}</Text>
            <DateTimePicker
              value={rescheduleTime || new Date()}
              mode="time"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={(event: DateTimePickerEvent, time?: Date) => {
                if (event.type === 'dismissed') {
                  setShowRescheduleTime(false);
                  return;
                }
                if (time) {
                  setRescheduleTime(time);
                  if (Platform.OS === 'android') {
                    setShowRescheduleTime(false);
                    confirmReschedule();
                  }
                }
              }}
            />
            {Platform.OS === 'ios' && (
              <View style={styles.pickerButtons}>
                <TouchableOpacity
                  style={styles.pickerCancelButton}
                  onPress={() => setShowRescheduleTime(false)}
                >
                  <Text style={styles.pickerCancelText}>{t('common.cancel')}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.pickerConfirmButton}
                  onPress={confirmReschedule}
                >
                  <Text style={styles.pickerConfirmText}>{t('common.confirm')}</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      )}
    </SafeAreaView>
  );
};

// ============================================
// STYLES
// ============================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.paper,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.background.default,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  backButton: {
    padding: spacing.xs,
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    ...typography.h6,
    color: colors.text.primary,
    marginLeft: spacing.sm,
  },
  whatsappButton: {
    padding: spacing.xs,
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.md,
    paddingBottom: spacing.xl * 2,
  },

  // Status Section
  statusSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 20,
    gap: spacing.xs,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    ...typography.body2,
    fontWeight: '600',
  },
  sessionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.primary.main + '15',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 12,
  },
  sessionBadgeText: {
    ...typography.caption,
    color: colors.primary.main,
    fontWeight: '500',
  },

  // Sections
  section: {
    marginBottom: spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    ...typography.body2,
    color: colors.text.secondary,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // Client Card
  clientCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.default,
    borderRadius: 12,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  clientMainInfo: {
    flex: 1,
  },
  clientName: {
    ...typography.h6,
    color: colors.text.primary,
    marginBottom: spacing.xs / 2,
  },
  clientPhone: {
    ...typography.body2,
    color: colors.primary.main,
  },
  callButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.success.main,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Visit History
  visitHistoryCard: {
    backgroundColor: colors.background.default,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border.light,
    overflow: 'hidden',
  },
  visitHistoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  visitHistoryDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: spacing.md,
  },
  visitHistoryContent: {
    flex: 1,
  },
  visitHistoryDate: {
    ...typography.body2,
    color: colors.text.primary,
    fontWeight: '500',
  },
  visitHistoryTime: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  visitHistoryTreatment: {
    ...typography.caption,
    color: colors.text.tertiary,
    marginTop: 2,
  },
  // Visit History Meta (Prescription/Payment info - User Requirement #2)
  visitHistoryMeta: {
    marginTop: 2,
  },
  visitHistoryMetaText: {
    ...typography.caption,
    fontSize: 11,
  },
  visitHistoryMetaPresent: {
    color: colors.success.main,
  },
  visitHistoryMetaAbsent: {
    color: colors.text.tertiary,
    fontStyle: 'italic',
  },
  visitHistoryStatus: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs / 2,
    borderRadius: 8,
  },
  visitHistoryStatusText: {
    ...typography.caption,
    fontWeight: '500',
  },

  // Card
  card: {
    backgroundColor: colors.background.default,
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.border.light,
  },

  // Info Row
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  infoIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary.main + '10',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  infoValue: {
    ...typography.body1,
    color: colors.text.primary,
    marginTop: 2,
  },

  // Notes Card
  notesCard: {
    backgroundColor: colors.background.default,
    borderRadius: 12,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  notesText: {
    ...typography.body1,
    color: colors.text.primary,
    lineHeight: 22,
  },

  // Actions
  actionsContainer: {
    gap: spacing.sm,
  },
  actionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 8,
    gap: spacing.xs,
    minHeight: 44,
  },
  actionButtonDisabled: {
    opacity: 0.5,
  },
  actionButtonText: {
    ...typography.body2,
    fontWeight: '600',
  },
  // BUG FIX #3: Empty state for actions
  actionsEmptyState: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.grey[100],
    borderRadius: 8,
    padding: spacing.md,
  },
  actionsEmptyText: {
    ...typography.body2,
    color: colors.text.tertiary,
    textAlign: 'center',
  },

  // Meta
  metaSection: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
  },
  metaText: {
    ...typography.caption,
    color: colors.text.tertiary,
    marginBottom: 4,
  },

  // Loading
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    ...typography.body2,
    color: colors.text.secondary,
    marginTop: spacing.md,
  },

  // Error
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  errorTitle: {
    ...typography.h6,
    color: colors.text.primary,
    marginTop: spacing.md,
  },
  errorText: {
    ...typography.body2,
    color: colors.text.secondary,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  retryButton: {
    marginTop: spacing.lg,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.primary.main,
    borderRadius: 8,
  },
  retryButtonText: {
    ...typography.button,
    color: colors.background.default,
  },

  // Picker Overlay
  pickerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  pickerContainer: {
    backgroundColor: colors.background.default,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: spacing.lg,
  },
  pickerTitle: {
    ...typography.h6,
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  pickerButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.md,
  },
  pickerCancelButton: {
    padding: spacing.md,
    minWidth: 80,
    alignItems: 'center',
  },
  pickerCancelText: {
    ...typography.button,
    color: colors.text.secondary,
  },
  pickerConfirmButton: {
    padding: spacing.md,
    backgroundColor: colors.primary.main,
    borderRadius: 8,
    paddingHorizontal: spacing.lg,
    minWidth: 100,
    alignItems: 'center',
  },
  pickerConfirmText: {
    ...typography.button,
    color: colors.background.default,
  },
});

export default AppointmentDetailScreen;
