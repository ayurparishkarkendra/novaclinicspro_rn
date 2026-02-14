/**
 * Appointment Detail Screen
 * RESTRUCTURED with proper sections:
 * - Client Section (name, phone, quick call action)
 * - Visit/Appointment Info Section
 * - Quick Actions with role-based visibility
 * - WhatsApp integration
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
}

const InfoRow: React.FC<InfoRowProps> = ({ icon, label, value, valueColor, onPress, showChevron = false }) => (
  <TouchableOpacity
    style={styles.infoRow}
    onPress={onPress}
    disabled={!onPress}
    activeOpacity={onPress ? 0.7 : 1}
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
}

const ActionButton: React.FC<ActionButtonProps> = ({ 
  icon, 
  label, 
  color, 
  onPress, 
  disabled,
  variant = 'outlined' 
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

  // Call client directly
  const handleCallClient = useCallback(() => {
    if (!appointment?.client_phone) {
      Alert.alert('No Phone Number', 'Client phone number is not available');
      return;
    }
    Linking.openURL(`tel:${appointment.client_phone}`);
  }, [appointment]);

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
  const isPartOfSeries = appointment.series_id && appointment.session_number;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Appointment</Text>
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
                Session {appointment.session_number}/{appointment.total_sessions}
              </Text>
            </View>
          )}
        </View>

        {/* CLIENT SECTION */}
        <View style={styles.section}>
          <SectionHeader title="Client" icon="person" />
          <View style={styles.clientCard}>
            <View style={styles.clientMainInfo}>
              <Text style={styles.clientName}>{appointment.client_name || 'Unknown Client'}</Text>
              {appointment.client_phone && (
                <Text style={styles.clientPhone}>📞 {appointment.client_phone}</Text>
              )}
            </View>
            {/* Quick Call Action */}
            {appointment.client_phone && (
              <TouchableOpacity 
                style={styles.callButton}
                onPress={handleCallClient}
              >
                <Ionicons name="call" size={20} color={colors.background.default} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* APPOINTMENT INFO SECTION */}
        <View style={styles.section}>
          <SectionHeader title="Appointment Details" icon="calendar" />
          <View style={styles.card}>
            <InfoRow
              icon="calendar-outline"
              label="Date"
              value={formatDate(appointment.appointment_start)}
            />
            <InfoRow
              icon="time-outline"
              label="Time"
              value={`${formatTime(appointment.appointment_start)} - ${formatTime(appointment.appointment_end)}`}
            />
            <InfoRow
              icon="hourglass-outline"
              label="Duration"
              value={formatDuration(duration)}
            />
            {appointment.treatment_name && (
              <InfoRow
                icon="medical-outline"
                label="Treatment"
                value={appointment.treatment_name}
              />
            )}
            {appointment.staff_name && (
              <InfoRow
                icon="person-circle-outline"
                label="Staff"
                value={appointment.staff_name}
              />
            )}
            {appointment.room_name && (
              <InfoRow
                icon="business-outline"
                label="Room"
                value={appointment.room_name}
              />
            )}
          </View>
        </View>

        {/* Notes Section */}
        {appointment.notes && (
          <View style={styles.section}>
            <SectionHeader title="Notes" icon="document-text" />
            <View style={styles.notesCard}>
              <Text style={styles.notesText}>{appointment.notes}</Text>
            </View>
          </View>
        )}

        {/* QUICK ACTIONS SECTION */}
        <View style={styles.section}>
          <SectionHeader title="Quick Actions" icon="flash" />
          <View style={styles.actionsContainer}>
            {/* Primary Actions Row */}
            <View style={styles.actionsRow}>
              {appointment.status === 'scheduled' && (
                <ActionButton
                  icon="checkmark-circle"
                  label="Confirm"
                  color={colors.success.main}
                  onPress={() => handleStatusUpdate('confirmed')}
                  variant="filled"
                />
              )}
              {canStart && (
                <ActionButton
                  icon="play-circle"
                  label="Start Session"
                  color={colors.info.main}
                  onPress={() => handleStatusUpdate('in_progress')}
                  variant="filled"
                />
              )}
              {canComplete && (
                <ActionButton
                  icon="checkmark-done-circle"
                  label="Complete"
                  color={colors.success.main}
                  onPress={() => handleStatusUpdate('completed')}
                  variant="filled"
                />
              )}
            </View>

            {/* Secondary Actions Row */}
            <View style={styles.actionsRow}>
              <ActionButton
                icon="calendar-outline"
                label="Reschedule"
                color={colors.primary.main}
                onPress={handleReschedule}
                disabled={!canModify}
              />
              <ActionButton
                icon="close-circle-outline"
                label="Cancel"
                color={colors.error.main}
                onPress={handleCancel}
                disabled={!canModify}
              />
              <ActionButton
                icon="alert-circle-outline"
                label="No-Show"
                color={colors.warning.main}
                onPress={() => handleStatusUpdate('no_show')}
                disabled={!canModify}
              />
            </View>
          </View>
        </View>

        {/* Timestamps */}
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
