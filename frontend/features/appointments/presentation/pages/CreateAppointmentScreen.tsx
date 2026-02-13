/**
 * Create Appointment Screen
 * Simplified single-screen flow for both single and multi-day appointments
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Platform,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import { colors } from '../../../../core/theme/colors';
import { spacing } from '../../../../core/theme/spacing';
import { typography } from '../../../../core/theme/typography';
import { useAuth } from '../../../auth/presentation/hooks/useAuth';
import { useClientsListQuery, useSearchClientsQuery } from '../../../clients/data/repositories/clients.repository.impl';
import { useTreatmentsListQuery } from '../../../treatments/data/repositories/treatments.repository.impl';
import { useStaffListQuery } from '../../../staff/data/repositories/staff.repository.impl';
import { useRoomsListQuery } from '../../../rooms/data/repositories/rooms.repository.impl';
import {
  useCreateAppointmentMutation,
  useGenerateTherapyPlanMutation,
  useValidateAppointmentMutation,
} from '../../data/repositories/appointments.repository.impl';
import {
  AppointmentCreate,
  AppointmentType,
  TherapyPlanRequest,
  TherapyPlanResponse,
  formatTime,
  formatDate,
  openWhatsApp,
  generateWhatsAppConfirmationMessage,
  generateWhatsAppSeriesMessage,
  toISODateString,
} from '../../data/models/appointments.dtos';
import { useDebounce } from '../../../../core/hooks/useDebounce';

// ============================================
// TYPE SELECTOR COMPONENT
// ============================================

interface TypeSelectorProps {
  value: AppointmentType;
  onChange: (type: AppointmentType) => void;
}

const TypeSelector: React.FC<TypeSelectorProps> = ({ value, onChange }) => (
  <View style={styles.typeSelector}>
    <TouchableOpacity
      style={[styles.typeOption, value === 'SINGLE' && styles.typeOptionSelected]}
      onPress={() => onChange('SINGLE')}
    >
      <Ionicons
        name="calendar-outline"
        size={24}
        color={value === 'SINGLE' ? colors.primary.main : colors.text.secondary}
      />
      <Text style={[styles.typeOptionTitle, value === 'SINGLE' && styles.typeOptionTitleSelected]}>
        Single Day
      </Text>
      <Text style={styles.typeOptionSubtitle}>One-time appointment</Text>
    </TouchableOpacity>
    <TouchableOpacity
      style={[styles.typeOption, value === 'MULTI' && styles.typeOptionSelected]}
      onPress={() => onChange('MULTI')}
    >
      <Ionicons
        name="calendar"
        size={24}
        color={value === 'MULTI' ? colors.primary.main : colors.text.secondary}
      />
      <Text style={[styles.typeOptionTitle, value === 'MULTI' && styles.typeOptionTitleSelected]}>
        Multi Day
      </Text>
      <Text style={styles.typeOptionSubtitle}>Therapy series</Text>
    </TouchableOpacity>
  </View>
);

// ============================================
// PICKER MODAL COMPONENT
// ============================================

interface PickerOption {
  id: string;
  label: string;
  subtitle?: string;
}

interface PickerSectionProps {
  title: string;
  options: PickerOption[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  searchable?: boolean;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  isLoading?: boolean;
  emptyText?: string;
  multiple?: boolean;
  selectedIds?: string[];
  maxSelect?: number;
}

const PickerSection: React.FC<PickerSectionProps> = ({
  title,
  options,
  selectedId,
  onSelect,
  searchable,
  searchQuery,
  onSearchChange,
  isLoading,
  emptyText = 'No options available',
  multiple,
  selectedIds = [],
  maxSelect = 2,
}) => {
  const [expanded, setExpanded] = useState(false);

  const selectedOption = options.find(o => o.id === selectedId);
  const selectedCount = selectedIds.length;

  return (
    <View style={styles.pickerSection}>
      <TouchableOpacity
        style={styles.pickerHeader}
        onPress={() => setExpanded(!expanded)}
      >
        <View style={styles.pickerHeaderContent}>
          <Text style={styles.pickerTitle}>{title}</Text>
          {multiple ? (
            <Text style={styles.pickerValue}>
              {selectedCount > 0 ? `${selectedCount} selected` : 'Select...'}
            </Text>
          ) : (
            <Text style={styles.pickerValue}>
              {selectedOption?.label || 'Select...'}
            </Text>
          )}
        </View>
        <Ionicons
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={20}
          color={colors.text.secondary}
        />
      </TouchableOpacity>

      {expanded && (
        <View style={styles.pickerContent}>
          {searchable && onSearchChange && (
            <View style={styles.pickerSearch}>
              <Ionicons name="search" size={18} color={colors.text.tertiary} />
              <TextInput
                style={styles.pickerSearchInput}
                placeholder="Search..."
                placeholderTextColor={colors.text.tertiary}
                value={searchQuery}
                onChangeText={onSearchChange}
              />
            </View>
          )}

          {isLoading ? (
            <ActivityIndicator size="small" color={colors.primary.main} style={{ padding: spacing.md }} />
          ) : options.length === 0 ? (
            <Text style={styles.pickerEmpty}>{emptyText}</Text>
          ) : (
            <ScrollView style={styles.pickerOptions} nestedScrollEnabled>
              {options.map((option) => {
                const isSelected = multiple
                  ? selectedIds.includes(option.id)
                  : selectedId === option.id;
                const canSelect = !multiple || selectedIds.length < maxSelect || isSelected;

                return (
                  <TouchableOpacity
                    key={option.id}
                    style={[
                      styles.pickerOption,
                      isSelected && styles.pickerOptionSelected,
                      !canSelect && styles.pickerOptionDisabled,
                    ]}
                    onPress={() => canSelect && onSelect(option.id)}
                    disabled={!canSelect}
                  >
                    <View style={styles.pickerOptionContent}>
                      <Text style={[
                        styles.pickerOptionLabel,
                        isSelected && styles.pickerOptionLabelSelected,
                      ]}>
                        {option.label}
                      </Text>
                      {option.subtitle && (
                        <Text style={styles.pickerOptionSubtitle}>{option.subtitle}</Text>
                      )}
                    </View>
                    {isSelected && (
                      <Ionicons name="checkmark-circle" size={20} color={colors.primary.main} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}
        </View>
      )}
    </View>
  );
};

// ============================================
// MAIN SCREEN
// ============================================

export const CreateAppointmentScreen: React.FC = () => {
  const router = useRouter();
  const { currentUser } = useAuth();
  const tenantId = currentUser?.tenantId || '';

  // Form state
  const [appointmentType, setAppointmentType] = useState<AppointmentType>('SINGLE');
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [selectedTreatmentId, setSelectedTreatmentId] = useState<string | null>(null);
  const [selectedStaffId, setSelectedStaffId] = useState<string | null>(null);
  const [selectedStaffIds, setSelectedStaffIds] = useState<string[]>([]);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [appointmentDate, setAppointmentDate] = useState<Date>(new Date());
  const [appointmentTime, setAppointmentTime] = useState<Date>(new Date());
  const [durationMinutes, setDurationMinutes] = useState<number>(60);
  const [numberOfSessions, setNumberOfSessions] = useState<number>(7);
  const [notes, setNotes] = useState('');
  const [clientSearchQuery, setClientSearchQuery] = useState('');
  const debouncedClientSearch = useDebounce(clientSearchQuery, 300);

  // Date/Time picker state
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  // Queries
  const { data: clientsData, isLoading: isLoadingClients } = useClientsListQuery(tenantId, { limit: 100 });
  const { data: searchedClients, isLoading: isSearchingClients } = useSearchClientsQuery(
    tenantId,
    debouncedClientSearch,
    { enabled: debouncedClientSearch.length >= 3 }
  );
  const { data: treatmentsData, isLoading: isLoadingTreatments } = useTreatmentsListQuery(tenantId);
  const { data: staffData, isLoading: isLoadingStaff } = useStaffListQuery(tenantId, { limit: 100 });
  const { data: roomsData, isLoading: isLoadingRooms } = useRoomsListQuery(tenantId);

  // Mutations
  const createMutation = useCreateAppointmentMutation(tenantId);
  const validateMutation = useValidateAppointmentMutation();
  const generatePlanMutation = useGenerateTherapyPlanMutation();

  // Prepare options
  const clientOptions: PickerOption[] = (
    debouncedClientSearch.length >= 3 && searchedClients?.items
      ? searchedClients.items
      : clientsData?.items || []
  ).map((c: any) => ({
    id: c.id,
    label: c.full_name || c.name || 'Unknown',
    subtitle: c.phone || c.email,
  }));

  const treatmentOptions: PickerOption[] = (treatmentsData?.items || []).map((t: any) => ({
    id: t.id,
    label: t.name,
    subtitle: t.duration_minutes ? `${t.duration_minutes} min` : undefined,
  }));

  const staffOptions: PickerOption[] = (staffData?.items || []).map((s: any) => ({
    id: s.id,
    label: s.full_name || s.name || 'Unknown',
    subtitle: s.role || s.designation,
  }));

  const roomOptions: PickerOption[] = (roomsData?.items || []).map((r: any) => ({
    id: r.id,
    label: r.name,
    subtitle: r.capacity ? `Capacity: ${r.capacity}` : undefined,
  }));

  // Get selected client info for WhatsApp
  const selectedClient = clientOptions.find(c => c.id === selectedClientId);
  const selectedTreatment = treatmentOptions.find(t => t.id === selectedTreatmentId);
  const selectedStaff = staffOptions.find(s => s.id === selectedStaffId);

  // Handle staff selection for multi-day
  const handleStaffSelect = (staffId: string) => {
    if (appointmentType === 'MULTI') {
      setSelectedStaffIds(prev => {
        if (prev.includes(staffId)) {
          return prev.filter(id => id !== staffId);
        }
        if (prev.length < 2) {
          return [...prev, staffId];
        }
        return prev;
      });
    } else {
      setSelectedStaffId(staffId);
    }
  };

  // Create single appointment
  const handleCreateSingle = async () => {
    if (!selectedClientId) {
      Alert.alert('Error', 'Please select a client');
      return;
    }

    const startDateTime = new Date(appointmentDate);
    startDateTime.setHours(appointmentTime.getHours(), appointmentTime.getMinutes(), 0, 0);
    const endDateTime = new Date(startDateTime);
    endDateTime.setMinutes(endDateTime.getMinutes() + durationMinutes);

    const payload: AppointmentCreate = {
      client_id: selectedClientId,
      staff_id: selectedStaffId,
      room_id: selectedRoomId,
      treatment_id: selectedTreatmentId,
      appointment_start: startDateTime.toISOString(),
      appointment_end: endDateTime.toISOString(),
      status: 'scheduled',
      notes: notes || null,
      appointment_type: 'SINGLE',
    };

    try {
      const result = await createMutation.mutateAsync(payload);

      // Open WhatsApp
      if (selectedClient?.subtitle) {
        const message = generateWhatsAppConfirmationMessage(
          selectedClient.label,
          'Your Clinic', // TODO: Get from clinic settings
          formatDate(startDateTime.toISOString()),
          formatTime(startDateTime.toISOString()),
          selectedStaff?.label || 'Staff',
          selectedTreatment?.label || 'Appointment',
          '+91-XXXXXXXXXX' // TODO: Get from clinic settings
        );
        const whatsappUrl = openWhatsApp(selectedClient.subtitle, message);
        
        Alert.alert(
          'Appointment Created!',
          'Would you like to send a WhatsApp confirmation to the client?',
          [
            { text: 'Skip', style: 'cancel', onPress: () => router.back() },
            { 
              text: 'Send WhatsApp', 
              onPress: () => {
                Linking.openURL(whatsappUrl);
                router.back();
              }
            },
          ]
        );
      } else {
        Alert.alert('Success', 'Appointment created successfully');
        router.back();
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to create appointment');
    }
  };

  // Generate and preview multi-day plan
  const handlePreviewMultiDay = async () => {
    if (!selectedClientId) {
      Alert.alert('Error', 'Please select a client');
      return;
    }
    if (!selectedTreatmentId) {
      Alert.alert('Error', 'Please select a treatment');
      return;
    }
    if (selectedStaffIds.length === 0) {
      Alert.alert('Error', 'Please select at least one therapist');
      return;
    }

    const startDateTime = new Date(appointmentDate);
    startDateTime.setHours(appointmentTime.getHours(), appointmentTime.getMinutes(), 0, 0);

    // Navigate to preview screen with params
    router.push({
      pathname: '/clinic-admin/appointments/preview',
      params: {
        clientId: selectedClientId,
        clientName: selectedClient?.label || '',
        clientPhone: selectedClient?.subtitle || '',
        treatmentId: selectedTreatmentId,
        treatmentName: selectedTreatment?.label || '',
        staffIds: selectedStaffIds.join(','),
        startDate: startDateTime.toISOString(),
        durationDays: numberOfSessions.toString(),
        preferredTimeHour: appointmentTime.getHours().toString(),
        durationMinutes: durationMinutes.toString(),
        notes: notes,
      },
    });
  };

  const isFormValid = () => {
    if (!selectedClientId) return false;
    if (appointmentType === 'MULTI') {
      return selectedTreatmentId && selectedStaffIds.length > 0;
    }
    return true;
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="close" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Appointment</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Appointment Type */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Appointment Type</Text>
          <TypeSelector value={appointmentType} onChange={setAppointmentType} />
        </View>

        {/* Client Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Client *</Text>
          <PickerSection
            title="Select Client"
            options={clientOptions}
            selectedId={selectedClientId}
            onSelect={setSelectedClientId}
            searchable
            searchQuery={clientSearchQuery}
            onSearchChange={setClientSearchQuery}
            isLoading={isLoadingClients || isSearchingClients}
            emptyText="No clients found"
          />
        </View>

        {/* Date & Time */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {appointmentType === 'SINGLE' ? 'Date & Time' : 'Start Date & Preferred Time'}
          </Text>
          <View style={styles.dateTimeRow}>
            <TouchableOpacity
              style={styles.dateTimeButton}
              onPress={() => setShowDatePicker(true)}
            >
              <Ionicons name="calendar-outline" size={20} color={colors.primary.main} />
              <Text style={styles.dateTimeText}>{formatDate(appointmentDate.toISOString())}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.dateTimeButton}
              onPress={() => setShowTimePicker(true)}
            >
              <Ionicons name="time-outline" size={20} color={colors.primary.main} />
              <Text style={styles.dateTimeText}>
                {appointmentTime.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}
              </Text>
            </TouchableOpacity>
          </View>

          {showDatePicker && (
            <DateTimePicker
              value={appointmentDate}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              minimumDate={new Date()}
              onChange={(event, date) => {
                setShowDatePicker(Platform.OS === 'ios');
                if (date) setAppointmentDate(date);
              }}
            />
          )}

          {showTimePicker && (
            <DateTimePicker
              value={appointmentTime}
              mode="time"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={(event, time) => {
                setShowTimePicker(Platform.OS === 'ios');
                if (time) setAppointmentTime(time);
              }}
            />
          )}
        </View>

        {/* Duration */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {appointmentType === 'SINGLE' ? 'Duration' : 'Session Duration'}
          </Text>
          <View style={styles.durationRow}>
            {[30, 45, 60, 90, 120].map((mins) => (
              <TouchableOpacity
                key={mins}
                style={[
                  styles.durationButton,
                  durationMinutes === mins && styles.durationButtonSelected,
                ]}
                onPress={() => setDurationMinutes(mins)}
              >
                <Text
                  style={[
                    styles.durationText,
                    durationMinutes === mins && styles.durationTextSelected,
                  ]}
                >
                  {mins} min
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Number of Sessions (Multi-day only) */}
        {appointmentType === 'MULTI' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Number of Sessions</Text>
            <View style={styles.sessionsRow}>
              <TouchableOpacity
                style={styles.sessionControl}
                onPress={() => setNumberOfSessions(Math.max(1, numberOfSessions - 1))}
              >
                <Ionicons name="remove" size={24} color={colors.text.primary} />
              </TouchableOpacity>
              <Text style={styles.sessionsValue}>{numberOfSessions}</Text>
              <TouchableOpacity
                style={styles.sessionControl}
                onPress={() => setNumberOfSessions(Math.min(30, numberOfSessions + 1))}
              >
                <Ionicons name="add" size={24} color={colors.text.primary} />
              </TouchableOpacity>
            </View>
            <Text style={styles.sessionsHint}>
              Sessions will be scheduled daily starting from the selected date
            </Text>
          </View>
        )}

        {/* Treatment */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Treatment {appointmentType === 'MULTI' ? '*' : '(Optional)'}
          </Text>
          <PickerSection
            title="Select Treatment"
            options={treatmentOptions}
            selectedId={selectedTreatmentId}
            onSelect={setSelectedTreatmentId}
            isLoading={isLoadingTreatments}
            emptyText="No treatments available"
          />
        </View>

        {/* Staff/Therapist */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {appointmentType === 'MULTI' ? 'Therapists * (Max 2)' : 'Staff (Optional)'}
          </Text>
          <PickerSection
            title={appointmentType === 'MULTI' ? 'Select Therapists' : 'Select Staff'}
            options={staffOptions}
            selectedId={appointmentType === 'SINGLE' ? selectedStaffId : null}
            onSelect={handleStaffSelect}
            isLoading={isLoadingStaff}
            emptyText="No staff available"
            multiple={appointmentType === 'MULTI'}
            selectedIds={selectedStaffIds}
            maxSelect={2}
          />
        </View>

        {/* Room (Single day only) */}
        {appointmentType === 'SINGLE' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Room (Optional)</Text>
            <PickerSection
              title="Select Room"
              options={roomOptions}
              selectedId={selectedRoomId}
              onSelect={setSelectedRoomId}
              isLoading={isLoadingRooms}
              emptyText="No rooms available"
            />
          </View>
        )}

        {/* Notes */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notes (Optional)</Text>
          <TextInput
            style={styles.notesInput}
            placeholder="Add any notes about this appointment..."
            placeholderTextColor={colors.text.tertiary}
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </View>

        {/* Spacer for button */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Action Button */}
      <View style={styles.actionBar}>
        <TouchableOpacity
          style={[
            styles.actionButton,
            !isFormValid() && styles.actionButtonDisabled,
          ]}
          onPress={appointmentType === 'SINGLE' ? handleCreateSingle : handlePreviewMultiDay}
          disabled={!isFormValid() || createMutation.isPending}
        >
          {createMutation.isPending ? (
            <ActivityIndicator size="small" color={colors.background.default} />
          ) : (
            <>
              <Ionicons
                name={appointmentType === 'SINGLE' ? 'checkmark' : 'eye-outline'}
                size={20}
                color={colors.background.default}
              />
              <Text style={styles.actionButtonText}>
                {appointmentType === 'SINGLE' ? 'Create Appointment' : 'Preview Plan'}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>
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
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.md,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    ...typography.body2,
    color: colors.text.primary,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },

  // Type Selector
  typeSelector: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  typeOption: {
    flex: 1,
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.background.default,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.border.light,
  },
  typeOptionSelected: {
    borderColor: colors.primary.main,
    backgroundColor: colors.primary.main + '10',
  },
  typeOptionTitle: {
    ...typography.body1,
    color: colors.text.primary,
    fontWeight: '600',
    marginTop: spacing.sm,
  },
  typeOptionTitleSelected: {
    color: colors.primary.main,
  },
  typeOptionSubtitle: {
    ...typography.caption,
    color: colors.text.secondary,
    marginTop: 2,
  },

  // Picker Section
  pickerSection: {
    backgroundColor: colors.background.default,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border.light,
    overflow: 'hidden',
  },
  pickerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
  },
  pickerHeaderContent: {
    flex: 1,
  },
  pickerTitle: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  pickerValue: {
    ...typography.body1,
    color: colors.text.primary,
    marginTop: 2,
  },
  pickerContent: {
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
  },
  pickerSearch: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.sm,
    backgroundColor: colors.background.paper,
    gap: spacing.sm,
  },
  pickerSearchInput: {
    flex: 1,
    ...typography.body2,
    color: colors.text.primary,
  },
  pickerOptions: {
    maxHeight: 200,
  },
  pickerOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  pickerOptionSelected: {
    backgroundColor: colors.primary.main + '10',
  },
  pickerOptionDisabled: {
    opacity: 0.5,
  },
  pickerOptionContent: {
    flex: 1,
  },
  pickerOptionLabel: {
    ...typography.body1,
    color: colors.text.primary,
  },
  pickerOptionLabelSelected: {
    color: colors.primary.main,
    fontWeight: '600',
  },
  pickerOptionSubtitle: {
    ...typography.caption,
    color: colors.text.secondary,
    marginTop: 2,
  },
  pickerEmpty: {
    ...typography.body2,
    color: colors.text.tertiary,
    textAlign: 'center',
    padding: spacing.lg,
  },

  // Date Time
  dateTimeRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  dateTimeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    backgroundColor: colors.background.default,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  dateTimeText: {
    ...typography.body1,
    color: colors.text.primary,
  },

  // Duration
  durationRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  durationButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    backgroundColor: colors.background.default,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border.light,
    alignItems: 'center',
  },
  durationButtonSelected: {
    borderColor: colors.primary.main,
    backgroundColor: colors.primary.main + '10',
  },
  durationText: {
    ...typography.body2,
    color: colors.text.secondary,
  },
  durationTextSelected: {
    color: colors.primary.main,
    fontWeight: '600',
  },

  // Sessions
  sessionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.lg,
    paddingVertical: spacing.md,
  },
  sessionControl: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.background.default,
    borderWidth: 1,
    borderColor: colors.border.light,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sessionsValue: {
    ...typography.h4,
    color: colors.text.primary,
    minWidth: 60,
    textAlign: 'center',
  },
  sessionsHint: {
    ...typography.caption,
    color: colors.text.tertiary,
    textAlign: 'center',
    marginTop: spacing.sm,
  },

  // Notes
  notesInput: {
    backgroundColor: colors.background.default,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border.light,
    padding: spacing.md,
    ...typography.body1,
    color: colors.text.primary,
    minHeight: 100,
  },

  // Action Bar
  actionBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: spacing.md,
    backgroundColor: colors.background.default,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    backgroundColor: colors.primary.main,
    borderRadius: 12,
  },
  actionButtonDisabled: {
    backgroundColor: colors.grey[300],
  },
  actionButtonText: {
    ...typography.button,
    color: colors.background.default,
  },
});

export default CreateAppointmentScreen;
