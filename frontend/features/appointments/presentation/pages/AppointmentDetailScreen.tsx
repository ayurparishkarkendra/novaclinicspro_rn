/**
 * Appointment Detail Screen
 * Displays detailed info for a single appointment with actions and WhatsApp integration
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { colors } from '../../../../core/theme/colors';
import { spacing } from '../../../../core/theme/spacing';
import { typography } from '../../../../core/theme/typography';
import { useAuth } from '../../../auth/presentation/hooks/useAuth';
import {
  useAppointmentDetailQuery,
  useUpdateAppointmentMutation,
  useCancelAppointmentMutation,
  useRescheduleAppointmentMutation,
} from '../../data/repositories/appointments.repository.impl';
import {
  AppointmentResponse,
  AppointmentUpdate,
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
} from '../../data/models/appointments.dtos';

// ============================================
// INFO ROW COMPONENT
// ============================================

interface InfoRowProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string | null;
  valueColor?: string;
  onPress?: () => void;
}

const InfoRow: React.FC<InfoRowProps> = ({ icon, label, value, valueColor, onPress }) => (
  <TouchableOpacity
    style={styles.infoRow}
    onPress={onPress}
    disabled={!onPress}
    activeOpacity={onPress ? 0.7 : 1}
  >
    <View style={styles.infoIcon}>
      <Ionicons name={icon} size={20} color={colors.primary.main} />
    </View>
    <View style={styles.infoContent}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={[styles.infoValue, valueColor && { color: valueColor }]}>
        {value || '—'}
      </Text>
    </View>
    {onPress && (
      <Ionicons name="chevron-forward" size={20} color={colors.text.tertiary} />
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
}

const ActionButton: React.FC<ActionButtonProps> = ({ icon, label, color, onPress, disabled }) => (
  <TouchableOpacity
    style={[styles.actionButton, { backgroundColor: color + '15' }, disabled && styles.actionButtonDisabled]}
    onPress={onPress}
    disabled={disabled}
  >
    <Ionicons name={icon} size={20} color={disabled ? colors.text.tertiary : color} />
    <Text style={[styles.actionButtonText, { color: disabled ? colors.text.tertiary : color }]}>
      {label}
    </Text>
  </TouchableOpacity>
);

// ============================================
// MAIN SCREEN
// ============================================

export const AppointmentDetailScreen: React.FC = () => {
  const router = useRouter();
  const { appointmentId } = useLocalSearchParams<{ appointmentId: string }>();
  const { currentUser } = useAuth();
  const tenantId = currentUser?.tenantId || '';

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

  // Mutations
  const updateMutation = useUpdateAppointmentMutation(tenantId, appointmentId || '');
  const cancelMutation = useCancelAppointmentMutation(tenantId);
  const rescheduleMutation = useRescheduleAppointmentMutation(tenantId, appointmentId || '');

  // WhatsApp handlers
  const handleWhatsAppConfirmation = useCallback(() => {
    if (!appointment) return;
    const phone = appointment.client_phone || '';
    if (!phone) {
      Alert.alert('No Phone Number', 'Client phone number is not available');
      return;
    }
    const message = generateWhatsAppConfirmationMessage(
      appointment.client_name || 'Client',
      'Your Clinic',
      formatDate(appointment.appointment_start),
      formatTime(appointment.appointment_start),
      appointment.staff_name || 'Staff',
      appointment.treatment_name || 'Appointment',
      '+91-XXXXXXXXXX'
    );
    const url = openWhatsApp(phone, message);
    Linking.openURL(url);
  }, [appointment]);

  // Handle status update
  const handleStatusUpdate = useCallback(async (newStatus: string) => {
    if (!appointment) return;

    const statusMessages: Record<string, string> = {
      confirmed: 'Mark as Confirmed',
      in_progress: 'Start Appointment',
      completed: 'Mark as Completed',
      no_show: 'Mark as No-Show',
    };

    Alert.alert(
      statusMessages[newStatus] || 'Update Status',
      `Are you sure you want to ${statusMessages[newStatus]?.toLowerCase() || 'update this appointment'}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Yes',
          onPress: async () => {
            try {
              await updateMutation.mutateAsync({ status: newStatus });
              Alert.alert('Success', 'Appointment status updated');
              refetch();

              // Offer WhatsApp notification for confirmation
              if (newStatus === 'confirmed' && appointment.client_phone) {
                setTimeout(() => {
                  Alert.alert(
                    'Send Confirmation?',
                    'Would you like to send a WhatsApp confirmation to the client?',
                    [
                      { text: 'Skip', style: 'cancel' },
                      { text: 'Send', onPress: handleWhatsAppConfirmation },
                    ]
                  );
                }, 500);
              }
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Failed to update status');
            }
          },
        },
      ]
    );
  }, [appointment, updateMutation, refetch, handleWhatsAppConfirmation]);

  // Handle cancel
  const handleCancel = useCallback(() => {
    if (!appointment) return;

    Alert.alert(
      'Cancel Appointment',
      'Are you sure you want to cancel this appointment?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              await cancelMutation.mutateAsync(appointmentId || '');
              Alert.alert('Success', 'Appointment cancelled');
              refetch();

              // Offer WhatsApp notification
              if (appointment.client_phone) {
                setTimeout(() => {
                  const message = generateWhatsAppCancellationMessage(
                    appointment.client_name || 'Client',
                    formatDate(appointment.appointment_start),
                    formatTime(appointment.appointment_start),
                    appointment.treatment_name || 'Appointment',
                    '+91-XXXXXXXXXX'
                  );
                  const url = openWhatsApp(appointment.client_phone || '', message);

                  Alert.alert(
                    'Notify Client?',
                    'Would you like to send a WhatsApp cancellation notice?',
                    [
                      { text: 'Skip', style: 'cancel' },
                      { text: 'Send', onPress: () => Linking.openURL(url) },
                    ]
                  );
                }, 500);
              }
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Failed to cancel');
            }
          },
        },
      ]
    );
  }, [appointment, cancelMutation, appointmentId, refetch]);

  // Handle reschedule
  const handleReschedule = useCallback(() => {
    if (!appointment) return;
    setRescheduleDate(new Date(appointment.appointment_start));
    setShowReschedulePicker(true);
  }, [appointment]);

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
      Alert.alert('Success', 'Appointment rescheduled');
      refetch();

      // Offer WhatsApp notification
      if (appointment.client_phone) {
        setTimeout(() => {
          const message = generateWhatsAppRescheduleMessage(
            appointment.client_name || 'Client',
            formatDate(appointment.appointment_start),
            formatTime(appointment.appointment_start),
            formatDate(newDateTime.toISOString()),
            formatTime(newDateTime.toISOString()),
            appointment.staff_name || 'Staff',
            appointment.treatment_name || 'Appointment'
          );
          const url = openWhatsApp(appointment.client_phone || '', message);

          Alert.alert(
            'Notify Client?',
            'Would you like to send a WhatsApp reschedule notice?',
            [
              { text: 'Skip', style: 'cancel' },
              { text: 'Send', onPress: () => Linking.openURL(url) },
            ]
          );
        }, 500);
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to reschedule');
    }
  }, [appointment, rescheduleDate, rescheduleTime, rescheduleMutation, refetch]);

  // Loading state
  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary.main} />
          <Text style={styles.loadingText}>Loading appointment...</Text>
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
          <Text style={styles.errorTitle}>Could not load appointment</Text>
          <Text style={styles.errorText}>
            {error?.message || 'Appointment not found'}
          </Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => refetch()}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const statusColor = getStatusColor(appointment.status);
  const duration = calculateDuration(appointment.appointment_start, appointment.appointment_end);
  const canModify = ['scheduled', 'confirmed'].includes(appointment.status);
  const canStart = appointment.status === 'confirmed';
  const canComplete = appointment.status === 'in_progress';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Appointment Details</Text>
        {/* WhatsApp Button */}
        {appointment.client_phone && (
          <TouchableOpacity style={styles.whatsappButton} onPress={handleWhatsAppConfirmation}>
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
        {/* Status Badge */}
        <View style={styles.statusSection}>
          <View style={[styles.statusBadge, { backgroundColor: statusColor + '15' }]}>
            <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
            <Text style={[styles.statusText, { color: statusColor }]}>
              {getStatusLabel(appointment.status)}
            </Text>
          </View>
          {appointment.session_number && appointment.total_sessions && (
            <Text style={styles.sessionBadge}>
              Session {appointment.session_number}/{appointment.total_sessions}
            </Text>
          )}
        </View>

        {/* Client Info Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Client</Text>
          <InfoRow
            icon="person"
            label="Name"
            value={appointment.client_name || null}
          />
          {appointment.client_phone && (
            <InfoRow
              icon="call"
              label="Phone"
              value={appointment.client_phone}
              valueColor={colors.primary.main}
              onPress={() => Linking.openURL(`tel:${appointment.client_phone}`)}
            />
          )}
        </View>

        {/* Appointment Info Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Appointment</Text>
          <InfoRow
            icon="calendar"
            label="Date"
            value={formatDate(appointment.appointment_start)}
          />
          <InfoRow
            icon="time"
            label="Time"
            value={`${formatTime(appointment.appointment_start)} - ${formatTime(appointment.appointment_end)}`}
          />
          <InfoRow
            icon="hourglass"
            label="Duration"
            value={formatDuration(duration)}
          />
          {appointment.treatment_name && (
            <InfoRow
              icon="medical"
              label="Treatment"
              value={appointment.treatment_name}
            />
          )}
          {appointment.staff_name && (
            <InfoRow
              icon="person-circle"
              label="Staff"
              value={appointment.staff_name}
            />
          )}
          {appointment.room_name && (
            <InfoRow
              icon="business"
              label="Room"
              value={appointment.room_name}
            />
          )}
        </View>

        {/* Notes */}
        {appointment.notes && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Notes</Text>
            <Text style={styles.notesText}>{appointment.notes}</Text>
          </View>
        )}

        {/* Quick Actions */}
        <View style={styles.actionsSection}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsGrid}>
            {appointment.status === 'scheduled' && (
              <ActionButton
                icon="checkmark-circle"
                label="Confirm"
                color={colors.success.main}
                onPress={() => handleStatusUpdate('confirmed')}
              />
            )}
            {canStart && (
              <ActionButton
                icon="play-circle"
                label="Start"
                color={colors.info.main}
                onPress={() => handleStatusUpdate('in_progress')}
              />
            )}
            {canComplete && (
              <ActionButton
                icon="checkmark-done-circle"
                label="Complete"
                color={colors.success.main}
                onPress={() => handleStatusUpdate('completed')}
              />
            )}
            <ActionButton
              icon="calendar-outline"
              label="Reschedule"
              color={colors.primary.main}
              onPress={handleReschedule}
              disabled={!canModify}
            />
            <ActionButton
              icon="close-circle"
              label="Cancel"
              color={colors.error.main}
              onPress={handleCancel}
              disabled={!canModify}
            />
            <ActionButton
              icon="alert-circle"
              label="No-Show"
              color={colors.warning.main}
              onPress={() => handleStatusUpdate('no_show')}
              disabled={!canModify}
            />
          </View>
        </View>

        {/* Created/Updated Info */}
        <View style={styles.metaSection}>
          {appointment.created_at && (
            <Text style={styles.metaText}>
              Created: {formatDate(appointment.created_at)}
            </Text>
          )}
          {appointment.updated_at && (
            <Text style={styles.metaText}>
              Updated: {formatDate(appointment.updated_at)}
            </Text>
          )}
        </View>
      </ScrollView>

      {/* Reschedule Date Picker */}
      {showReschedulePicker && (
        <View style={styles.pickerOverlay}>
          <View style={styles.pickerContainer}>
            <Text style={styles.pickerTitle}>Select New Date</Text>
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
                  <Text style={styles.pickerCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.pickerConfirmButton}
                  onPress={() => {
                    setShowReschedulePicker(false);
                    setRescheduleTime(new Date(appointment.appointment_start));
                    setShowRescheduleTime(true);
                  }}
                >
                  <Text style={styles.pickerConfirmText}>Next</Text>
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
            <Text style={styles.pickerTitle}>Select New Time</Text>
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
                  <Text style={styles.pickerCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.pickerConfirmButton}
                  onPress={confirmReschedule}
                >
                  <Text style={styles.pickerConfirmText}>Confirm</Text>
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
  },
  headerTitle: {
    flex: 1,
    ...typography.h6,
    color: colors.text.primary,
    marginLeft: spacing.sm,
  },
  whatsappButton: {
    padding: spacing.xs,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.md,
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
    ...typography.caption,
    color: colors.primary.main,
    backgroundColor: colors.primary.main + '15',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 12,
  },

  // Card
  card: {
    backgroundColor: colors.background.default,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  cardTitle: {
    ...typography.body2,
    color: colors.text.secondary,
    fontWeight: '600',
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // Info Row
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  infoIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
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

  // Notes
  notesText: {
    ...typography.body1,
    color: colors.text.primary,
    lineHeight: 22,
  },

  // Actions
  actionsSection: {
    marginBottom: spacing.md,
  },
  sectionTitle: {
    ...typography.body2,
    color: colors.text.secondary,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  actionsGrid: {
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
  },
  actionButtonDisabled: {
    opacity: 0.5,
  },
  actionButtonText: {
    ...typography.body2,
    fontWeight: '600',
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
  },
  pickerConfirmText: {
    ...typography.button,
    color: colors.background.default,
  },
});

export default AppointmentDetailScreen;
