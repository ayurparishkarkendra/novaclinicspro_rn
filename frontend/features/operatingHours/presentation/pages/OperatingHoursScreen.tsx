/**
 * Operating Hours Screen
 * Weekly calendar view for managing clinic hours
 */

import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Modal,
  TextInput,
  Switch,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { DashboardHeader } from '../../../../core/components/DashboardHeader';
import {
  useOperatingHoursListQuery,
  useCreateOperatingHourMutation,
  useUpdateOperatingHourMutation,
  useDeleteOperatingHourMutation,
} from '../../data/repositories/operatingHours.repository.impl';
import {
  OperatingHourResponse,
  OperatingHourCreate,
  OperatingHourUpdate,
  DAYS_OF_WEEK,
  formatTimeForDisplay,
  parseTimeToMinutes,
} from '../../data/models/operatingHours.dtos';
import { spacing } from '../../../../core/theme/spacing';
import { typography } from '../../../../core/theme/typography';
import { useAuthStore } from '../../../auth/presentation/providers/auth.store';

// ============================================
// DAY CARD COMPONENT
// ============================================

interface DayCardProps {
  dayOfWeek: number;
  dayName: string;
  hours: OperatingHourResponse | null;
  onEdit: () => void;
}

const DayCard: React.FC<DayCardProps> = ({ dayOfWeek, dayName, hours, onEdit }) => {
  const isOpen = hours?.is_open ?? false;
  const openTime = hours?.open_time ? formatTimeForDisplay(hours.open_time) : '--:--';
  const closeTime = hours?.close_time ? formatTimeForDisplay(hours.close_time) : '--:--';
  const hasBreak = hours?.break_start && hours?.break_end;

  return (
    <TouchableOpacity
      style={[styles.dayCard, !isOpen && hours && styles.dayCardClosed]}
      onPress={onEdit}
      activeOpacity={0.7}
      accessibilityLabel={`Edit ${dayName} hours`}
    >
      <View style={styles.dayHeader}>
        <View style={styles.dayInfo}>
          <Text style={styles.dayName}>{dayName}</Text>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: isOpen ? '#10B98115' : hours ? '#EF444415' : '#9CA3AF15' },
            ]}
          >
            <View
              style={[
                styles.statusDot,
                { backgroundColor: isOpen ? '#10B981' : hours ? '#EF4444' : '#9CA3AF' },
              ]}
            />
            <Text
              style={[
                styles.statusText,
                { color: isOpen ? '#10B981' : hours ? '#EF4444' : '#9CA3AF' },
              ]}
            >
              {hours ? (isOpen ? 'Open' : 'Closed') : 'Not Set'}
            </Text>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
      </View>

      {hours && isOpen ? (
        <View style={styles.hoursContainer}>
          <View style={styles.timeRow}>
            <Ionicons name="time-outline" size={16} color="#2F6F4E" />
            <Text style={styles.timeText}>
              {openTime} - {closeTime}
            </Text>
          </View>
          {hasBreak && (
            <View style={styles.timeRow}>
              <Ionicons name="cafe-outline" size={16} color="#C28A4B" />
              <Text style={styles.breakText}>
                Break: {formatTimeForDisplay(hours.break_start!)} -{' '}
                {formatTimeForDisplay(hours.break_end!)}
              </Text>
            </View>
          )}
        </View>
      ) : hours ? (
        <Text style={styles.closedText}>Clinic closed on this day</Text>
      ) : (
        <Text style={styles.closedText}>Tap to configure hours</Text>
      )}
    </TouchableOpacity>
  );
};

// ============================================
// EDIT MODAL COMPONENT
// ============================================

interface EditModalProps {
  visible: boolean;
  dayOfWeek: number | null;
  existingHours: OperatingHourResponse | null;
  onClose: () => void;
  onSave: (data: OperatingHourCreate | OperatingHourUpdate, isUpdate: boolean, hoursId?: string) => Promise<void>;
  onDelete: (hoursId: string) => Promise<void>;
  isSaving: boolean;
}

const EditModal: React.FC<EditModalProps> = ({
  visible,
  dayOfWeek,
  existingHours,
  onClose,
  onSave,
  onDelete,
  isSaving,
}) => {
  const dayName = dayOfWeek !== null ? DAYS_OF_WEEK[dayOfWeek]?.label || '' : '';

  // Form state
  const [isOpen, setIsOpen] = useState(existingHours?.is_open ?? true);
  const [openTime, setOpenTime] = useState(existingHours?.open_time?.slice(0, 5) || '09:00');
  const [closeTime, setCloseTime] = useState(existingHours?.close_time?.slice(0, 5) || '18:00');
  const [hasBreak, setHasBreak] = useState(!!(existingHours?.break_start && existingHours?.break_end));
  const [breakStart, setBreakStart] = useState(existingHours?.break_start?.slice(0, 5) || '13:00');
  const [breakEnd, setBreakEnd] = useState(existingHours?.break_end?.slice(0, 5) || '14:00');

  // Reset form when modal opens with new data
  React.useEffect(() => {
    if (visible) {
      setIsOpen(existingHours?.is_open ?? true);
      setOpenTime(existingHours?.open_time?.slice(0, 5) || '09:00');
      setCloseTime(existingHours?.close_time?.slice(0, 5) || '18:00');
      setHasBreak(!!(existingHours?.break_start && existingHours?.break_end));
      setBreakStart(existingHours?.break_start?.slice(0, 5) || '13:00');
      setBreakEnd(existingHours?.break_end?.slice(0, 5) || '14:00');
    }
  }, [visible, existingHours]);

  // Validation
  const validateTime = (time: string): boolean => {
    return /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(time);
  };

  const handleSave = async () => {
    if (dayOfWeek === null) return;

    // Validate times
    if (isOpen) {
      if (!validateTime(openTime) || !validateTime(closeTime)) {
        Alert.alert('Invalid Time', 'Please enter times in HH:MM format (e.g., 09:00)');
        return;
      }

      const openMinutes = parseTimeToMinutes(openTime);
      const closeMinutes = parseTimeToMinutes(closeTime);

      if (closeMinutes <= openMinutes) {
        Alert.alert('Invalid Times', 'Close time must be after open time');
        return;
      }

      if (hasBreak) {
        if (!validateTime(breakStart) || !validateTime(breakEnd)) {
          Alert.alert('Invalid Time', 'Please enter break times in HH:MM format');
          return;
        }

        const breakStartMinutes = parseTimeToMinutes(breakStart);
        const breakEndMinutes = parseTimeToMinutes(breakEnd);

        if (breakEndMinutes <= breakStartMinutes) {
          Alert.alert('Invalid Break Times', 'Break end must be after break start');
          return;
        }

        if (breakStartMinutes < openMinutes || breakEndMinutes > closeMinutes) {
          Alert.alert('Invalid Break Times', 'Break must be within operating hours');
          return;
        }
      }
    }

    const payload: OperatingHourCreate | OperatingHourUpdate = {
      day_of_week: dayOfWeek,
      is_open: isOpen,
      open_time: isOpen ? `${openTime}:00` : null,
      close_time: isOpen ? `${closeTime}:00` : null,
      break_start: isOpen && hasBreak ? `${breakStart}:00` : null,
      break_end: isOpen && hasBreak ? `${breakEnd}:00` : null,
      status: 'active',
    };

    await onSave(payload, !!existingHours, existingHours?.id);
  };

  const handleDelete = () => {
    if (!existingHours) return;

    Alert.alert(
      'Delete Operating Hours',
      `Are you sure you want to delete the operating hours for ${dayName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => onDelete(existingHours.id),
        },
      ]
    );
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalOverlay}
      >
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{dayName}</Text>
            <TouchableOpacity onPress={onClose} style={styles.modalCloseButton}>
              <Ionicons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
            {/* Open/Closed Toggle */}
            <View style={styles.formRow}>
              <View style={styles.formRowLabel}>
                <Ionicons name="power" size={20} color="#2F6F4E" />
                <Text style={styles.formLabel}>Clinic Open</Text>
              </View>
              <Switch
                value={isOpen}
                onValueChange={setIsOpen}
                trackColor={{ false: '#E5E7EB', true: '#2F6F4E50' }}
                thumbColor={isOpen ? '#2F6F4E' : '#9CA3AF'}
              />
            </View>

            {isOpen && (
              <>
                {/* Operating Hours */}
                <View style={styles.formSection}>
                  <Text style={styles.formSectionTitle}>Operating Hours</Text>

                  <View style={styles.timeInputRow}>
                    <View style={styles.timeInputGroup}>
                      <Text style={styles.timeInputLabel}>Open</Text>
                      <TextInput
                        style={styles.timeInput}
                        value={openTime}
                        onChangeText={setOpenTime}
                        placeholder="09:00"
                        keyboardType="numbers-and-punctuation"
                        maxLength={5}
                      />
                    </View>
                    <Ionicons name="arrow-forward" size={20} color="#9CA3AF" />
                    <View style={styles.timeInputGroup}>
                      <Text style={styles.timeInputLabel}>Close</Text>
                      <TextInput
                        style={styles.timeInput}
                        value={closeTime}
                        onChangeText={setCloseTime}
                        placeholder="18:00"
                        keyboardType="numbers-and-punctuation"
                        maxLength={5}
                      />
                    </View>
                  </View>
                </View>

                {/* Break Toggle */}
                <View style={styles.formRow}>
                  <View style={styles.formRowLabel}>
                    <Ionicons name="cafe-outline" size={20} color="#C28A4B" />
                    <Text style={styles.formLabel}>Include Break</Text>
                  </View>
                  <Switch
                    value={hasBreak}
                    onValueChange={setHasBreak}
                    trackColor={{ false: '#E5E7EB', true: '#C28A4B50' }}
                    thumbColor={hasBreak ? '#C28A4B' : '#9CA3AF'}
                  />
                </View>

                {hasBreak && (
                  <View style={styles.formSection}>
                    <Text style={styles.formSectionTitle}>Break Time</Text>

                    <View style={styles.timeInputRow}>
                      <View style={styles.timeInputGroup}>
                        <Text style={styles.timeInputLabel}>Start</Text>
                        <TextInput
                          style={styles.timeInput}
                          value={breakStart}
                          onChangeText={setBreakStart}
                          placeholder="13:00"
                          keyboardType="numbers-and-punctuation"
                          maxLength={5}
                        />
                      </View>
                      <Ionicons name="arrow-forward" size={20} color="#9CA3AF" />
                      <View style={styles.timeInputGroup}>
                        <Text style={styles.timeInputLabel}>End</Text>
                        <TextInput
                          style={styles.timeInput}
                          value={breakEnd}
                          onChangeText={setBreakEnd}
                          placeholder="14:00"
                          keyboardType="numbers-and-punctuation"
                          maxLength={5}
                        />
                      </View>
                    </View>
                  </View>
                )}
              </>
            )}

            {!isOpen && (
              <View style={styles.closedNotice}>
                <Ionicons name="moon-outline" size={24} color="#6B7280" />
                <Text style={styles.closedNoticeText}>
                  The clinic will be marked as closed on {dayName}. No appointments will be
                  available.
                </Text>
              </View>
            )}
          </ScrollView>

          {/* Footer */}
          <View style={styles.modalFooter}>
            {existingHours && (
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={handleDelete}
                disabled={isSaving}
              >
                <Ionicons name="trash-outline" size={20} color="#EF4444" />
              </TouchableOpacity>
            )}
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelButton} onPress={onClose} disabled={isSaving}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
                onPress={handleSave}
                disabled={isSaving}
              >
                {isSaving ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.saveButtonText}>
                    {existingHours ? 'Update' : 'Save'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

// ============================================
// MAIN SCREEN
// ============================================

export const OperatingHoursScreen: React.FC = () => {
  const router = useRouter();
  const { currentUser } = useAuthStore();

  // Get tenant ID from user context
  const tenantId = currentUser?.tenantId || '';

  const [editingDay, setEditingDay] = useState<number | null>(null);
  const [editingHours, setEditingHours] = useState<OperatingHourResponse | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  // Query operating hours
  const hoursQuery = useOperatingHoursListQuery(
    tenantId,
    { limit: 10 },
    {
      enabled: !!tenantId,
    }
  );

  const createMutation = useCreateOperatingHourMutation(tenantId);
  const deleteMutation = useDeleteOperatingHourMutation(tenantId);

  // Map hours by day of week
  const hoursByDay = useMemo(() => {
    const map = new Map<number, OperatingHourResponse>();
    hoursQuery.data?.items.forEach((hour) => {
      map.set(hour.day_of_week, hour);
    });
    return map;
  }, [hoursQuery.data?.items]);

  const handleRefresh = useCallback(() => {
    hoursQuery.refetch();
  }, [hoursQuery]);

  const handleEditDay = useCallback(
    (dayOfWeek: number) => {
      const existing = hoursByDay.get(dayOfWeek);
      setEditingDay(dayOfWeek);
      setEditingHours(existing || null);
      setModalVisible(true);
    },
    [hoursByDay]
  );

  const handleCloseModal = useCallback(() => {
    setModalVisible(false);
    setEditingDay(null);
    setEditingHours(null);
  }, []);

  const handleSave = useCallback(
    async (
      data: OperatingHourCreate | OperatingHourUpdate,
      isUpdate: boolean,
      hoursId?: string
    ) => {
      try {
        if (isUpdate && hoursId) {
          // For update, we need to use PATCH which requires the hoursId in the URL
          // The current hook pattern creates a new mutation for each hoursId
          // For simplicity, we'll delete and recreate
          await deleteMutation.mutateAsync(hoursId);
          await createMutation.mutateAsync(data as OperatingHourCreate);
        } else {
          await createMutation.mutateAsync(data as OperatingHourCreate);
        }
        Alert.alert('Success', 'Operating hours saved successfully');
        handleCloseModal();
      } catch (error: any) {
        console.error('Save error:', error);
        Alert.alert('Error', error?.message || 'Failed to save operating hours');
      }
    },
    [createMutation, deleteMutation, handleCloseModal]
  );

  const handleDelete = useCallback(
    async (hoursId: string) => {
      try {
        await deleteMutation.mutateAsync(hoursId);
        Alert.alert('Success', 'Operating hours deleted');
        handleCloseModal();
      } catch (error: any) {
        console.error('Delete error:', error);
        Alert.alert('Error', error?.message || 'Failed to delete operating hours');
      }
    },
    [deleteMutation, handleCloseModal]
  );

  // Count configured days
  const configuredDays = hoursQuery.data?.items.filter((h) => h.is_active).length || 0;
  const openDays = hoursQuery.data?.items.filter((h) => h.is_active && h.is_open).length || 0;

  // No tenant context
  if (!tenantId) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <DashboardHeader
          title="Operating Hours"
          subtitle="No clinic selected"
          onBackPress={() => router.back()}
        />
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={48} color="#EF4444" />
          <Text style={styles.errorText}>No clinic context available</Text>
          <Text style={styles.errorSubtext}>Please select a clinic first</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <DashboardHeader
        title="Operating Hours"
        subtitle={`${openDays} days open`}
        onBackPress={() => router.back()}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={hoursQuery.isRefetching}
            onRefresh={handleRefresh}
            colors={['#2F6F4E']}
            tintColor="#2F6F4E"
          />
        }
      >
        {/* Summary Card */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{configuredDays}</Text>
            <Text style={styles.summaryLabel}>Configured</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryValue, { color: '#10B981' }]}>{openDays}</Text>
            <Text style={styles.summaryLabel}>Open Days</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryValue, { color: '#EF4444' }]}>
              {configuredDays > 0 ? configuredDays - openDays : 0}
            </Text>
            <Text style={styles.summaryLabel}>Closed</Text>
          </View>
        </View>

        {/* Weekly Schedule */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Weekly Schedule</Text>
          <Text style={styles.sectionSubtitle}>Tap any day to configure operating hours</Text>

          {hoursQuery.isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#2F6F4E" />
              <Text style={styles.loadingText}>Loading schedule...</Text>
            </View>
          ) : hoursQuery.isError ? (
            <View style={styles.errorBox}>
              <Ionicons name="cloud-offline-outline" size={24} color="#EF4444" />
              <Text style={styles.errorBoxText}>Failed to load schedule</Text>
              <TouchableOpacity style={styles.retryButton} onPress={handleRefresh}>
                <Text style={styles.retryButtonText}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : (
            DAYS_OF_WEEK.map((day) => (
              <DayCard
                key={day.value}
                dayOfWeek={day.value}
                dayName={day.label}
                hours={hoursByDay.get(day.value) || null}
                onEdit={() => handleEditDay(day.value)}
              />
            ))
          )}
        </View>

        {/* Help Text */}
        <View style={styles.helpSection}>
          <Ionicons name="information-circle-outline" size={18} color="#6B7280" />
          <Text style={styles.helpText}>
            Operating hours define when your clinic accepts appointments. Staff schedules may vary.
          </Text>
        </View>
      </ScrollView>

      {/* Edit Modal */}
      <EditModal
        visible={modalVisible}
        dayOfWeek={editingDay}
        existingHours={editingHours}
        onClose={handleCloseModal}
        onSave={handleSave}
        onDelete={handleDelete}
        isSaving={createMutation.isPending || deleteMutation.isPending}
      />
    </SafeAreaView>
  );
};

// ============================================
// STYLES
// ============================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F4EC',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing.xl,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  errorText: {
    ...typography.h6,
    color: '#1F2937',
    marginTop: spacing.md,
  },
  errorSubtext: {
    ...typography.body2,
    color: '#6B7280',
    marginTop: spacing.xs,
  },
  summaryCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
    padding: spacing.lg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryDivider: {
    width: 1,
    backgroundColor: '#E5E7EB',
  },
  summaryValue: {
    ...typography.h4,
    color: '#1F2937',
  },
  summaryLabel: {
    ...typography.caption,
    color: '#6B7280',
    marginTop: 4,
  },
  section: {
    paddingHorizontal: spacing.md,
    marginTop: spacing.lg,
  },
  sectionTitle: {
    ...typography.h6,
    color: '#1F2937',
  },
  sectionSubtitle: {
    ...typography.body2,
    color: '#6B7280',
    marginBottom: spacing.md,
  },
  dayCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  dayCardClosed: {
    opacity: 0.7,
  },
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dayInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  dayName: {
    ...typography.body1,
    fontWeight: '600',
    color: '#1F2937',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 12,
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
  hoursContainer: {
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: 4,
  },
  timeText: {
    ...typography.body2,
    color: '#1F2937',
    fontWeight: '500',
  },
  breakText: {
    ...typography.body2,
    color: '#6B7280',
  },
  closedText: {
    ...typography.body2,
    color: '#9CA3AF',
    fontStyle: 'italic',
    marginTop: spacing.sm,
  },
  loadingContainer: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  loadingText: {
    ...typography.body2,
    color: '#6B7280',
    marginTop: spacing.sm,
  },
  errorBox: {
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    padding: spacing.lg,
    alignItems: 'center',
    gap: spacing.sm,
  },
  errorBoxText: {
    ...typography.body2,
    color: '#991B1B',
  },
  retryButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    backgroundColor: '#EF4444',
    borderRadius: 8,
  },
  retryButtonText: {
    ...typography.body2,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  helpSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: spacing.md,
    marginTop: spacing.lg,
    gap: spacing.xs,
  },
  helpText: {
    flex: 1,
    ...typography.caption,
    color: '#6B7280',
    lineHeight: 18,
  },

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    ...typography.h5,
    color: '#1F2937',
  },
  modalCloseButton: {
    padding: spacing.xs,
  },
  modalBody: {
    padding: spacing.md,
  },
  formRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  formRowLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  formLabel: {
    ...typography.body1,
    color: '#1F2937',
  },
  formSection: {
    marginTop: spacing.md,
    padding: spacing.md,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
  },
  formSectionTitle: {
    ...typography.body2,
    color: '#6B7280',
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  timeInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  timeInputGroup: {
    flex: 1,
  },
  timeInputLabel: {
    ...typography.caption,
    color: '#6B7280',
    marginBottom: 4,
  },
  timeInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    ...typography.body1,
    color: '#1F2937',
    textAlign: 'center',
  },
  closedNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    padding: spacing.md,
    borderRadius: 12,
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  closedNoticeText: {
    flex: 1,
    ...typography.body2,
    color: '#6B7280',
  },
  modalFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    gap: spacing.sm,
  },
  deleteButton: {
    padding: spacing.sm,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FEE2E2',
    backgroundColor: '#FEF2F2',
  },
  modalActions: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
  },
  cancelButton: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  cancelButtonText: {
    ...typography.body1,
    color: '#6B7280',
    fontWeight: '600',
  },
  saveButton: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: '#2F6F4E',
    borderRadius: 8,
    minWidth: 80,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    ...typography.body1,
    color: '#FFFFFF',
    fontWeight: '600',
  },
});

export default OperatingHoursScreen;
