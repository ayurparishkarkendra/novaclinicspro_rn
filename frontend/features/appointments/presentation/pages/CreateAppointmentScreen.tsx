/**
 * Create Appointment Screen
 * Simplified single-screen flow for both single and multi-day appointments
 * 
 * FIXES APPLIED:
 * 4. Client dropdown - "Create client" option when no results
 * 5. Single-day: Doctor vs Therapy toggle, 15-min duration, booked slots
 * 6. Dropdown auto-close on selection (except multi-select staff)
 * 7. Multi-day: Treatment above duration, auto-select duration from treatment
 * 8. All dropdowns searchable
 */

import React, { useState, useCallback, useMemo } from 'react';
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
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { colors } from '../../../../core/theme/colors';
import { spacing } from '../../../../core/theme/spacing';
import { typography } from '../../../../core/theme/typography';
import { useAuth } from '../../../auth/presentation/hooks/useAuth';
import { useClientsListQuery, useSearchClientsQuery, useCreateClientMutation } from '../../../clients/data/repositories/clients.repository.impl';
import { useTreatmentsListQuery } from '../../../treatments/data/repositories/treatments.repository.impl';
import { useStaffListQuery } from '../../../staff/data/repositories/staff.repository.impl';
import { useRoomsListQuery } from '../../../rooms/data/repositories/rooms.repository.impl';
import {
  useCreateAppointmentMutation,
  useAppointmentsByDateQuery,
} from '../../data/repositories/appointments.repository.impl';
import {
  AppointmentCreate,
  AppointmentType,
  formatTime,
  formatDate,
  openWhatsApp,
  generateWhatsAppConfirmationMessage,
  toISODateString,
} from '../../data/models/appointments.dtos';
import { useDebounce } from '../../../../core/hooks/useDebounce';
import { TreatmentResponse } from '../../../treatments/data/models/treatments.dtos';

// ============================================
// TYPES
// ============================================

type SessionType = 'DOCTOR' | 'THERAPY';

interface PickerOption {
  id: string;
  label: string;
  subtitle?: string;
  duration_minutes?: number | null;
  role?: string;
}

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
// SESSION TYPE TOGGLE (DOCTOR vs THERAPY)
// ============================================

interface SessionTypeSelectorProps {
  value: SessionType;
  onChange: (type: SessionType) => void;
}

const SessionTypeSelector: React.FC<SessionTypeSelectorProps> = ({ value, onChange }) => (
  <View style={styles.sessionTypeSelector}>
    <TouchableOpacity
      style={[styles.sessionTypeOption, value === 'DOCTOR' && styles.sessionTypeOptionSelected]}
      onPress={() => onChange('DOCTOR')}
    >
      <Ionicons
        name="medkit"
        size={18}
        color={value === 'DOCTOR' ? colors.background.default : colors.text.secondary}
      />
      <Text style={[styles.sessionTypeText, value === 'DOCTOR' && styles.sessionTypeTextSelected]}>
        Doctor Consultation
      </Text>
    </TouchableOpacity>
    <TouchableOpacity
      style={[styles.sessionTypeOption, value === 'THERAPY' && styles.sessionTypeOptionSelected]}
      onPress={() => onChange('THERAPY')}
    >
      <Ionicons
        name="fitness"
        size={18}
        color={value === 'THERAPY' ? colors.background.default : colors.text.secondary}
      />
      <Text style={[styles.sessionTypeText, value === 'THERAPY' && styles.sessionTypeTextSelected]}>
        Therapy Session
      </Text>
    </TouchableOpacity>
  </View>
);

// ============================================
// SEARCHABLE DROPDOWN COMPONENT
// ============================================

interface SearchableDropdownProps {
  title: string;
  placeholder?: string;
  options: PickerOption[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  isLoading?: boolean;
  emptyText?: string;
  showCreateOption?: boolean;
  onCreateNew?: () => void;
  multiple?: boolean;
  selectedIds?: string[];
  maxSelect?: number;
  autoCloseOnSelect?: boolean;
}

const SearchableDropdown: React.FC<SearchableDropdownProps> = ({
  title,
  placeholder = 'Select...',
  options,
  selectedId,
  onSelect,
  searchQuery,
  onSearchChange,
  isLoading,
  emptyText = 'No options available',
  showCreateOption,
  onCreateNew,
  multiple,
  selectedIds = [],
  maxSelect = 2,
  autoCloseOnSelect = true,
}) => {
  const [expanded, setExpanded] = useState(false);

  const selectedOption = options.find(o => o.id === selectedId);
  const selectedCount = selectedIds.length;
  const selectedLabels = options.filter(o => selectedIds.includes(o.id)).map(o => o.label).join(', ');

  const handleSelect = (id: string) => {
    onSelect(id);
    // Auto-close on selection for single select
    if (autoCloseOnSelect && !multiple) {
      setExpanded(false);
    }
  };

  const handleClose = () => {
    setExpanded(false);
    onSearchChange(''); // Clear search on close
  };

  return (
    <View style={styles.dropdownContainer}>
      <TouchableOpacity
        style={styles.dropdownHeader}
        onPress={() => setExpanded(!expanded)}
      >
        <View style={styles.dropdownHeaderContent}>
          <Text style={styles.dropdownTitle}>{title}</Text>
          {multiple ? (
            <Text style={styles.dropdownValue} numberOfLines={1}>
              {selectedCount > 0 ? selectedLabels : placeholder}
            </Text>
          ) : (
            <Text style={styles.dropdownValue} numberOfLines={1}>
              {selectedOption?.label || placeholder}
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
        <View style={styles.dropdownContent}>
          {/* Search Input */}
          <View style={styles.dropdownSearch}>
            <Ionicons name="search" size={18} color={colors.text.tertiary} />
            <TextInput
              style={styles.dropdownSearchInput}
              placeholder="Search..."
              placeholderTextColor={colors.text.tertiary}
              value={searchQuery}
              onChangeText={onSearchChange}
              autoFocus
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => onSearchChange('')}>
                <Ionicons name="close-circle" size={18} color={colors.text.tertiary} />
              </TouchableOpacity>
            )}
          </View>

          {/* Options */}
          {isLoading ? (
            <ActivityIndicator size="small" color={colors.primary.main} style={styles.dropdownLoader} />
          ) : (
            <ScrollView style={styles.dropdownOptions} nestedScrollEnabled keyboardShouldPersistTaps="handled">
              {/* Create New Option */}
              {showCreateOption && onCreateNew && (
                <TouchableOpacity
                  style={styles.dropdownCreateOption}
                  onPress={() => {
                    handleClose();
                    onCreateNew();
                  }}
                >
                  <Ionicons name="add-circle" size={20} color={colors.primary.main} />
                  <Text style={styles.dropdownCreateText}>Create new client</Text>
                </TouchableOpacity>
              )}

              {options.length === 0 && !showCreateOption ? (
                <Text style={styles.dropdownEmpty}>{emptyText}</Text>
              ) : (
                options.map((option) => {
                  const isSelected = multiple
                    ? selectedIds.includes(option.id)
                    : selectedId === option.id;
                  const canSelect = !multiple || selectedIds.length < maxSelect || isSelected;

                  return (
                    <TouchableOpacity
                      key={option.id}
                      style={[
                        styles.dropdownOption,
                        isSelected && styles.dropdownOptionSelected,
                        !canSelect && styles.dropdownOptionDisabled,
                      ]}
                      onPress={() => canSelect && handleSelect(option.id)}
                      disabled={!canSelect}
                    >
                      <View style={styles.dropdownOptionContent}>
                        <Text style={[
                          styles.dropdownOptionLabel,
                          isSelected && styles.dropdownOptionLabelSelected,
                        ]}>
                          {option.label}
                        </Text>
                        {option.subtitle && (
                          <Text style={styles.dropdownOptionSubtitle}>{option.subtitle}</Text>
                        )}
                      </View>
                      {isSelected && (
                        <Ionicons name="checkmark-circle" size={20} color={colors.primary.main} />
                      )}
                    </TouchableOpacity>
                  );
                })
              )}
            </ScrollView>
          )}

          {/* Done Button for multi-select */}
          {multiple && (
            <TouchableOpacity style={styles.dropdownDoneButton} onPress={handleClose}>
              <Text style={styles.dropdownDoneText}>Done ({selectedCount} selected)</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
};

// ============================================
// BOOKED SLOTS DISPLAY
// ============================================

interface BookedSlotsProps {
  appointments: any[];
  selectedDate: Date;
}

const BookedSlots: React.FC<BookedSlotsProps> = ({ appointments, selectedDate }) => {
  if (appointments.length === 0) {
    return (
      <View style={styles.bookedSlotsEmpty}>
        <Text style={styles.bookedSlotsEmptyText}>No booked slots for this date</Text>
      </View>
    );
  }

  return (
    <View style={styles.bookedSlotsContainer}>
      <Text style={styles.bookedSlotsTitle}>Already booked slots:</Text>
      <View style={styles.bookedSlotsList}>
        {appointments.slice(0, 5).map((apt) => (
          <View key={apt.id} style={styles.bookedSlot}>
            <Text style={styles.bookedSlotTime}>
              {formatTime(apt.appointment_start)}
              {apt.appointment_end && ` - ${formatTime(apt.appointment_end)}`}
            </Text>
            <Text style={styles.bookedSlotClient} numberOfLines={1}>
              {apt.client_name || 'Client'}
            </Text>
          </View>
        ))}
        {appointments.length > 5 && (
          <Text style={styles.bookedSlotsMore}>+{appointments.length - 5} more</Text>
        )}
      </View>
    </View>
  );
};

// ============================================
// CREATE CLIENT MODAL
// ============================================

interface CreateClientModalProps {
  visible: boolean;
  onClose: () => void;
  onCreated: (clientId: string, clientName: string, clientPhone: string) => void;
  tenantId: string;
}

const CreateClientModal: React.FC<CreateClientModalProps> = ({
  visible,
  onClose,
  onCreated,
  tenantId,
}) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const createMutation = useCreateClientMutation(tenantId);

  const handleCreate = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter client name');
      return;
    }

    try {
      const result = await createMutation.mutateAsync({
        full_name: name.trim(),
        phone: phone.trim() || null,
        email: email.trim() || null,
      });
      
      onCreated(result.id, result.full_name || name, result.phone || phone);
      setName('');
      setPhone('');
      setEmail('');
      onClose();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to create client');
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Create New Client</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={colors.text.primary} />
            </TouchableOpacity>
          </View>

          <View style={styles.modalBody}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Name *</Text>
              <TextInput
                style={styles.textInput}
                value={name}
                onChangeText={setName}
                placeholder="Enter client name"
                placeholderTextColor={colors.text.tertiary}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Phone</Text>
              <TextInput
                style={styles.textInput}
                value={phone}
                onChangeText={setPhone}
                placeholder="Enter phone number"
                placeholderTextColor={colors.text.tertiary}
                keyboardType="phone-pad"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Email</Text>
              <TextInput
                style={styles.textInput}
                value={email}
                onChangeText={setEmail}
                placeholder="Enter email"
                placeholderTextColor={colors.text.tertiary}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
          </View>

          <View style={styles.modalFooter}>
            <TouchableOpacity style={styles.modalCancelButton} onPress={onClose}>
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalConfirmButton, createMutation.isPending && styles.modalButtonDisabled]}
              onPress={handleCreate}
              disabled={createMutation.isPending}
            >
              {createMutation.isPending ? (
                <ActivityIndicator size="small" color={colors.background.default} />
              ) : (
                <Text style={styles.modalConfirmText}>Create Client</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
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
  const [sessionType, setSessionType] = useState<SessionType>('DOCTOR');
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [selectedClientInfo, setSelectedClientInfo] = useState<{ name: string; phone: string } | null>(null);
  const [selectedTreatmentId, setSelectedTreatmentId] = useState<string | null>(null);
  const [selectedStaffId, setSelectedStaffId] = useState<string | null>(null);
  const [selectedStaffIds, setSelectedStaffIds] = useState<string[]>([]);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [appointmentDate, setAppointmentDate] = useState<Date>(new Date());
  const [appointmentTime, setAppointmentTime] = useState<Date>(new Date());
  const [durationMinutes, setDurationMinutes] = useState<number>(60);
  const [numberOfSessions, setNumberOfSessions] = useState<number>(7);
  const [notes, setNotes] = useState('');

  // Search states
  const [clientSearchQuery, setClientSearchQuery] = useState('');
  const [treatmentSearchQuery, setTreatmentSearchQuery] = useState('');
  const [staffSearchQuery, setStaffSearchQuery] = useState('');
  const debouncedClientSearch = useDebounce(clientSearchQuery, 300);

  // Modal state
  const [showCreateClientModal, setShowCreateClientModal] = useState(false);

  // Date/Time picker state
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  // Queries
  const { data: clientsData, isLoading: isLoadingClients } = useClientsListQuery(tenantId, { limit: 100 });
  const { data: searchedClients, isLoading: isSearchingClients } = useSearchClientsQuery(
    tenantId,
    debouncedClientSearch,
    100
  );
  const { data: treatmentsData, isLoading: isLoadingTreatments } = useTreatmentsListQuery(tenantId);
  const { data: staffData, isLoading: isLoadingStaff } = useStaffListQuery(tenantId, { limit: 100 });
  const { data: roomsData, isLoading: isLoadingRooms } = useRoomsListQuery(tenantId);
  
  // Booked appointments for selected date and doctor
  const { data: bookedData } = useAppointmentsByDateQuery(
    tenantId,
    toISODateString(appointmentDate)
  );

  // Mutations
  const createMutation = useCreateAppointmentMutation(tenantId);

  // Filter clients based on search
  const clientOptions: PickerOption[] = useMemo(() => {
    const clients = debouncedClientSearch.length >= 3 && searchedClients?.items
      ? searchedClients.items
      : clientsData?.items || [];
    
    return clients
      .filter((c: any) => {
        if (!clientSearchQuery) return true;
        const query = clientSearchQuery.toLowerCase();
        return (
          (c.full_name || c.name || '').toLowerCase().includes(query) ||
          (c.phone || '').toLowerCase().includes(query) ||
          (c.email || '').toLowerCase().includes(query)
        );
      })
      .map((c: any) => ({
        id: c.id,
        label: c.full_name || c.name || 'Unknown',
        subtitle: c.phone || c.email,
      }));
  }, [clientsData, searchedClients, debouncedClientSearch, clientSearchQuery]);

  // Filter treatments based on search
  const treatmentOptions: PickerOption[] = useMemo(() => {
    return (treatmentsData?.items || [])
      .filter((t: TreatmentResponse) => {
        if (!treatmentSearchQuery) return true;
        const query = treatmentSearchQuery.toLowerCase();
        return t.name.toLowerCase().includes(query);
      })
      .map((t: TreatmentResponse) => ({
        id: t.id,
        label: t.name,
        subtitle: t.duration_minutes ? `${t.duration_minutes} min` : undefined,
        duration_minutes: t.duration_minutes,
      }));
  }, [treatmentsData, treatmentSearchQuery]);

  // Filter staff based on search and role (doctor vs therapist)
  const staffOptions: PickerOption[] = useMemo(() => {
    const allStaff = staffData?.items || [];
    
    return allStaff
      .filter((s: any) => {
        // Filter by role based on session type
        const role = (s.role || s.designation || '').toLowerCase();
        if (appointmentType === 'SINGLE' && sessionType === 'DOCTOR') {
          // Only doctors for doctor consultation
          return role.includes('doctor') || role.includes('physician') || role.includes('consultant');
        }
        // Therapists for therapy sessions
        if (appointmentType === 'SINGLE' && sessionType === 'THERAPY') {
          return role.includes('therapist') || role.includes('therapy') || !role.includes('doctor');
        }
        // Multi-day always shows therapists
        if (appointmentType === 'MULTI') {
          return role.includes('therapist') || role.includes('therapy') || !role.includes('doctor');
        }
        return true;
      })
      .filter((s: any) => {
        if (!staffSearchQuery) return true;
        const query = staffSearchQuery.toLowerCase();
        return (
          (s.full_name || s.name || '').toLowerCase().includes(query) ||
          (s.role || s.designation || '').toLowerCase().includes(query)
        );
      })
      .map((s: any) => ({
        id: s.id,
        label: s.full_name || s.name || 'Unknown',
        subtitle: s.role || s.designation,
        role: s.role || s.designation,
      }));
  }, [staffData, staffSearchQuery, appointmentType, sessionType]);

  const roomOptions: PickerOption[] = (roomsData?.items || []).map((r: any) => ({
    id: r.id,
    label: r.name,
    subtitle: r.capacity ? `Capacity: ${r.capacity}` : undefined,
  }));

  // Get selected entities
  const selectedClient = clientOptions.find(c => c.id === selectedClientId) || selectedClientInfo;
  const selectedTreatment = treatmentOptions.find(t => t.id === selectedTreatmentId);
  const selectedStaff = staffOptions.find(s => s.id === selectedStaffId);

  // Doctor's booked appointments for the selected date
  const doctorBookedAppointments = useMemo(() => {
    if (!selectedStaffId || sessionType !== 'DOCTOR') return [];
    return (bookedData?.appointments || []).filter(
      (apt) => apt.staff_id === selectedStaffId
    );
  }, [bookedData, selectedStaffId, sessionType]);

  // Duration options - include 15 min for doctor consultations
  const durationOptions = useMemo(() => {
    if (appointmentType === 'SINGLE' && sessionType === 'DOCTOR') {
      return [15, 30, 45, 60, 90];
    }
    return [30, 45, 60, 90, 120];
  }, [appointmentType, sessionType]);

  // Auto-set duration when treatment is selected (for multi-day)
  const treatmentHasDuration = selectedTreatment?.duration_minutes;

  // Handle client selection
  const handleClientSelect = (clientId: string) => {
    setSelectedClientId(clientId);
    const client = clientOptions.find(c => c.id === clientId);
    if (client) {
      setSelectedClientInfo({ name: client.label, phone: client.subtitle || '' });
    }
  };

  // Handle treatment selection - auto-set duration if available
  const handleTreatmentSelect = (treatmentId: string) => {
    setSelectedTreatmentId(treatmentId);
    const treatment = treatmentOptions.find(t => t.id === treatmentId);
    if (treatment?.duration_minutes) {
      setDurationMinutes(treatment.duration_minutes);
    }
  };

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

  // Handle new client created
  const handleClientCreated = (clientId: string, clientName: string, clientPhone: string) => {
    setSelectedClientId(clientId);
    setSelectedClientInfo({ name: clientName, phone: clientPhone });
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
      treatment_id: sessionType === 'THERAPY' ? selectedTreatmentId : null,
      appointment_start: startDateTime.toISOString(),
      appointment_end: endDateTime.toISOString(),
      status: 'scheduled',
      notes: notes || null,
      appointment_type: 'SINGLE',
    };

    try {
      await createMutation.mutateAsync(payload);

      // Open WhatsApp
      const clientPhone = (selectedClient as any)?.subtitle || selectedClientInfo?.phone;
      const clientName = (selectedClient as any)?.label || selectedClientInfo?.name || 'Client';
      
      if (clientPhone) {
        const message = generateWhatsAppConfirmationMessage(
          clientName,
          'Your Clinic',
          formatDate(startDateTime.toISOString()),
          formatTime(startDateTime.toISOString()),
          selectedStaff?.label || 'Doctor',
          selectedTreatment?.label || (sessionType === 'DOCTOR' ? 'Consultation' : 'Therapy'),
          '+91-XXXXXXXXXX'
        );
        const whatsappUrl = openWhatsApp(clientPhone, message);
        
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

    // Get selected staff names
    const selectedStaffNames = staffOptions
      .filter(s => selectedStaffIds.includes(s.id))
      .map(s => s.label)
      .join(', ');

    // Navigate to preview screen with params
    router.push({
      pathname: '/clinic-admin/appointments/preview' as any,
      params: {
        clientId: selectedClientId,
        clientName: selectedClientInfo?.name || selectedClient?.name || '',
        clientPhone: selectedClientInfo?.phone || selectedClient?.phone || '',
        treatmentId: selectedTreatmentId,
        treatmentName: selectedTreatment?.label || '',
        staffIds: selectedStaffIds.join(','),
        staffNames: selectedStaffNames,
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

        {/* Session Type Toggle (Single day only) */}
        {appointmentType === 'SINGLE' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Session Type</Text>
            <SessionTypeSelector value={sessionType} onChange={setSessionType} />
          </View>
        )}

        {/* Client Selection with Create option */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Client *</Text>
          <SearchableDropdown
            title="Select Client"
            options={clientOptions}
            selectedId={selectedClientId}
            onSelect={handleClientSelect}
            searchQuery={clientSearchQuery}
            onSearchChange={setClientSearchQuery}
            isLoading={isLoadingClients || isSearchingClients}
            emptyText="No clients found"
            showCreateOption={clientOptions.length === 0 || clientSearchQuery.length >= 2}
            onCreateNew={() => setShowCreateClientModal(true)}
            autoCloseOnSelect={true}
          />
        </View>

        {/* Treatment (Multi-day: ABOVE duration; Single therapy: show) */}
        {(appointmentType === 'MULTI' || (appointmentType === 'SINGLE' && sessionType === 'THERAPY')) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Treatment {appointmentType === 'MULTI' ? '*' : '(Optional)'}
            </Text>
            <SearchableDropdown
              title="Select Treatment"
              options={treatmentOptions}
              selectedId={selectedTreatmentId}
              onSelect={handleTreatmentSelect}
              searchQuery={treatmentSearchQuery}
              onSearchChange={setTreatmentSearchQuery}
              isLoading={isLoadingTreatments}
              emptyText="No treatments available"
              autoCloseOnSelect={true}
            />
          </View>
        )}

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
              onChange={(event: DateTimePickerEvent, date?: Date) => {
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
              onChange={(event: DateTimePickerEvent, time?: Date) => {
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
            {treatmentHasDuration && ' (from treatment)'}
          </Text>
          <View style={styles.durationRow}>
            {durationOptions.map((mins) => (
              <TouchableOpacity
                key={mins}
                style={[
                  styles.durationButton,
                  durationMinutes === mins && styles.durationButtonSelected,
                  treatmentHasDuration && mins !== treatmentHasDuration && styles.durationButtonDisabled,
                ]}
                onPress={() => !treatmentHasDuration && setDurationMinutes(mins)}
                disabled={!!treatmentHasDuration && mins !== treatmentHasDuration}
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

        {/* Staff/Therapist Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {appointmentType === 'SINGLE' && sessionType === 'DOCTOR' 
              ? 'Doctor *' 
              : appointmentType === 'MULTI' 
                ? 'Therapists * (Max 2)' 
                : 'Therapist (Optional)'}
          </Text>
          <SearchableDropdown
            title={appointmentType === 'MULTI' ? 'Select Therapists' : sessionType === 'DOCTOR' ? 'Select Doctor' : 'Select Therapist'}
            options={staffOptions}
            selectedId={appointmentType === 'SINGLE' ? selectedStaffId : null}
            onSelect={handleStaffSelect}
            searchQuery={staffSearchQuery}
            onSearchChange={setStaffSearchQuery}
            isLoading={isLoadingStaff}
            emptyText={sessionType === 'DOCTOR' ? 'No doctors available' : 'No therapists available'}
            multiple={appointmentType === 'MULTI'}
            selectedIds={selectedStaffIds}
            maxSelect={2}
            autoCloseOnSelect={appointmentType !== 'MULTI'}
          />
        </View>

        {/* Booked Slots (Doctor consultation only) */}
        {appointmentType === 'SINGLE' && sessionType === 'DOCTOR' && selectedStaffId && (
          <View style={styles.section}>
            <BookedSlots 
              appointments={doctorBookedAppointments} 
              selectedDate={appointmentDate} 
            />
          </View>
        )}

        {/* Room (Single day therapy only) */}
        {appointmentType === 'SINGLE' && sessionType === 'THERAPY' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Room (Optional)</Text>
            <SearchableDropdown
              title="Select Room"
              options={roomOptions}
              selectedId={selectedRoomId}
              onSelect={setSelectedRoomId}
              searchQuery=""
              onSearchChange={() => {}}
              isLoading={isLoadingRooms}
              emptyText="No rooms available"
              autoCloseOnSelect={true}
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

      {/* Create Client Modal */}
      <CreateClientModal
        visible={showCreateClientModal}
        onClose={() => setShowCreateClientModal(false)}
        onCreated={handleClientCreated}
        tenantId={tenantId}
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
    borderRadius: spacing.sm,
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
    marginTop: spacing.xs / 2,
  },

  // Session Type Selector
  sessionTypeSelector: {
    flexDirection: 'row',
    backgroundColor: colors.background.default,
    borderRadius: spacing.sm,
    padding: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  sessionTypeOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: spacing.xs,
  },
  sessionTypeOptionSelected: {
    backgroundColor: colors.primary.main,
  },
  sessionTypeText: {
    ...typography.body2,
    color: colors.text.secondary,
    fontWeight: '500',
  },
  sessionTypeTextSelected: {
    color: colors.background.default,
  },

  // Dropdown
  dropdownContainer: {
    backgroundColor: colors.background.default,
    borderRadius: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border.light,
    overflow: 'hidden',
  },
  dropdownHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
  },
  dropdownHeaderContent: {
    flex: 1,
  },
  dropdownTitle: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  dropdownValue: {
    ...typography.body1,
    color: colors.text.primary,
    marginTop: spacing.xs / 2,
  },
  dropdownContent: {
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
  },
  dropdownSearch: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.sm,
    backgroundColor: colors.background.paper,
    gap: spacing.sm,
  },
  dropdownSearchInput: {
    flex: 1,
    ...typography.body2,
    color: colors.text.primary,
    paddingVertical: spacing.xs,
  },
  dropdownOptions: {
    maxHeight: 200,
  },
  dropdownOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  dropdownOptionSelected: {
    backgroundColor: colors.primary.main + '10',
  },
  dropdownOptionDisabled: {
    opacity: 0.5,
  },
  dropdownOptionContent: {
    flex: 1,
  },
  dropdownOptionLabel: {
    ...typography.body1,
    color: colors.text.primary,
  },
  dropdownOptionLabelSelected: {
    color: colors.primary.main,
    fontWeight: '600',
  },
  dropdownOptionSubtitle: {
    ...typography.caption,
    color: colors.text.secondary,
    marginTop: spacing.xs / 2,
  },
  dropdownEmpty: {
    ...typography.body2,
    color: colors.text.tertiary,
    textAlign: 'center',
    padding: spacing.lg,
  },
  dropdownLoader: {
    padding: spacing.md,
  },
  dropdownCreateOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
    gap: spacing.sm,
  },
  dropdownCreateText: {
    ...typography.body1,
    color: colors.primary.main,
    fontWeight: '500',
  },
  dropdownDoneButton: {
    padding: spacing.md,
    backgroundColor: colors.primary.main,
    alignItems: 'center',
  },
  dropdownDoneText: {
    ...typography.button,
    color: colors.background.default,
  },

  // Booked Slots
  bookedSlotsContainer: {
    backgroundColor: colors.warning.main + '10',
    borderRadius: spacing.sm,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.warning.main + '30',
  },
  bookedSlotsTitle: {
    ...typography.caption,
    color: colors.text.secondary,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  bookedSlotsList: {
    gap: spacing.xs,
  },
  bookedSlot: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.background.default,
    padding: spacing.sm,
    borderRadius: spacing.xs,
  },
  bookedSlotTime: {
    ...typography.body2,
    color: colors.warning.main,
    fontWeight: '600',
  },
  bookedSlotClient: {
    ...typography.caption,
    color: colors.text.secondary,
    flex: 1,
    textAlign: 'right',
    marginLeft: spacing.sm,
  },
  bookedSlotsMore: {
    ...typography.caption,
    color: colors.text.tertiary,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  bookedSlotsEmpty: {
    backgroundColor: colors.success.main + '10',
    borderRadius: spacing.sm,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.success.main + '30',
  },
  bookedSlotsEmptyText: {
    ...typography.body2,
    color: colors.success.main,
    textAlign: 'center',
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
    borderRadius: spacing.sm,
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
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  durationButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.background.default,
    borderRadius: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border.light,
    alignItems: 'center',
  },
  durationButtonSelected: {
    borderColor: colors.primary.main,
    backgroundColor: colors.primary.main + '10',
  },
  durationButtonDisabled: {
    opacity: 0.4,
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
    borderRadius: spacing.sm,
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
    borderRadius: spacing.sm,
  },
  actionButtonDisabled: {
    backgroundColor: colors.grey[300],
  },
  actionButtonText: {
    ...typography.button,
    color: colors.background.default,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.background.default,
    borderTopLeftRadius: spacing.lg,
    borderTopRightRadius: spacing.lg,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  modalTitle: {
    ...typography.h6,
    color: colors.text.primary,
  },
  modalBody: {
    padding: spacing.md,
  },
  inputGroup: {
    marginBottom: spacing.md,
  },
  inputLabel: {
    ...typography.body2,
    color: colors.text.primary,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  textInput: {
    backgroundColor: colors.background.paper,
    borderRadius: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border.light,
    padding: spacing.md,
    ...typography.body1,
    color: colors.text.primary,
  },
  modalFooter: {
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
  },
  modalCancelButton: {
    flex: 1,
    padding: spacing.md,
    borderRadius: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border.main,
    alignItems: 'center',
  },
  modalCancelText: {
    ...typography.button,
    color: colors.text.primary,
  },
  modalConfirmButton: {
    flex: 2,
    padding: spacing.md,
    backgroundColor: colors.primary.main,
    borderRadius: spacing.sm,
    alignItems: 'center',
  },
  modalButtonDisabled: {
    backgroundColor: colors.grey[300],
  },
  modalConfirmText: {
    ...typography.button,
    color: colors.background.default,
  },
});

export default CreateAppointmentScreen;
