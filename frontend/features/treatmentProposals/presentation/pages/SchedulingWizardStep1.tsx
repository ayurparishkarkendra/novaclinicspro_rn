/**
 * Scheduling Wizard - Step 1 (Basic Details)
 * First step of the multi-day treatment scheduling wizard
 * 
 * Features:
 * - Date picker for start date
 * - Time picker for default time
 * - Frequency pattern dropdown
 * - Duration input (pre-filled from proposal, editable with warning)
 * - Therapist selector (searchable dropdown)
 * - Room selector (optional)
 * - Agreed package cost input
 * - Form validation
 * - Navigation to Step 2
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useClinicTheme } from '../../../../core/theme/useClinicTheme';
import { useSchedulingWizardStore, FrequencyPattern } from '../stores/schedulingWizard.store';

interface SchedulingWizardStep1Props {
  onNext: () => void;
  onCancel: () => void;
}

export const SchedulingWizardStep1: React.FC<SchedulingWizardStep1Props> = ({
  onNext,
  onCancel,
}) => {
  const theme = useClinicTheme();
  
  // Wizard store
  const {
    proposalName,
    proposalDuration,
    step1Data,
    step1Errors,
    updateStep1Field,
    setStep1Errors,
  } = useSchedulingWizardStore();

  // Local state for date/time pickers
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedTime, setSelectedTime] = useState<Date>(new Date());

  // Initialize date/time from store
  useEffect(() => {
    if (step1Data.start_date) {
      setSelectedDate(new Date(step1Data.start_date));
    }
    if (step1Data.default_time) {
      const [hours, minutes] = step1Data.default_time.split(':');
      const time = new Date();
      time.setHours(parseInt(hours, 10), parseInt(minutes, 10));
      setSelectedTime(time);
    }
  }, []);

  // Frequency options
  const frequencyOptions: Array<{ value: FrequencyPattern; label: string }> = [
    { value: 'DAILY', label: 'Daily' },
    { value: 'SIX_DAYS_WEEK', label: '6 Days/Week (Skip Sundays)' },
    { value: 'ALTERNATE_DAYS', label: 'Alternate Days' },
    { value: 'CUSTOM', label: 'Custom Schedule' },
  ];

  // Handle date change
  const handleDateChange = (event: any, date?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (date) {
      setSelectedDate(date);
      updateStep1Field('start_date', date.toISOString().split('T')[0]);
    }
  };

  // Handle time change
  const handleTimeChange = (event: any, time?: Date) => {
    setShowTimePicker(Platform.OS === 'ios');
    if (time) {
      setSelectedTime(time);
      const hours = time.getHours().toString().padStart(2, '0');
      const minutes = time.getMinutes().toString().padStart(2, '0');
      updateStep1Field('default_time', `${hours}:${minutes}`);
    }
  };

  // Validate form
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!step1Data.start_date) {
      errors.start_date = 'Start date is required';
    } else {
      const startDate = new Date(step1Data.start_date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (startDate < today) {
        errors.start_date = 'Start date cannot be in the past';
      }
    }

    if (!step1Data.default_time) {
      errors.default_time = 'Default time is required';
    }

    if (!step1Data.duration_days || step1Data.duration_days < 1) {
      errors.duration_days = 'Duration must be at least 1 day';
    } else if (step1Data.duration_days > 365) {
      errors.duration_days = 'Duration cannot exceed 365 days';
    }

    if (!step1Data.default_therapist_id) {
      errors.default_therapist_id = 'Default therapist is required';
    }

    if (!step1Data.agreed_package_cost || step1Data.agreed_package_cost <= 0) {
      errors.agreed_package_cost = 'Package cost must be greater than 0';
    }

    setStep1Errors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle next button
  const handleNext = () => {
    if (!validateForm()) {
      Alert.alert('Validation Error', 'Please fix the errors before proceeding');
      return;
    }

    // Warn if duration was changed
    if (step1Data.duration_days !== proposalDuration) {
      Alert.alert(
        'Duration Changed',
        `You changed the duration from ${proposalDuration} to ${step1Data.duration_days} days. This will affect the treatment plan.`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Continue', onPress: onNext },
        ]
      );
    } else {
      onNext();
    }
  };

  // Format date for display
  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  // Format time for display
  const formatTime = (time: Date): string => {
    return time.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.colors.border.default }]}>
        <View>
          <Text style={[styles.headerTitle, { color: theme.colors.text.primary }]}>
            Schedule Treatment Series
          </Text>
          <Text style={[styles.headerSubtitle, { color: theme.colors.text.secondary }]}>
            Step 1 of 3: Basic Details
          </Text>
        </View>
        <TouchableOpacity onPress={onCancel}>
          <Ionicons name="close" size={24} color={theme.colors.text.secondary} />
        </TouchableOpacity>
      </View>

      {/* Treatment Info */}
      <View style={[styles.infoCard, { backgroundColor: theme.colors.primary.light, padding: theme.spacing.md }]}>
        <Text style={[styles.infoTitle, { color: theme.colors.primary.default }]}>
          {proposalName}
        </Text>
        <Text style={[styles.infoSubtitle, { color: theme.colors.text.secondary }]}>
          Proposed Duration: {proposalDuration} days
        </Text>
      </View>

      {/* Form */}
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={[styles.formContainer, { padding: theme.spacing.md }]}>
          {/* Start Date */}
          <View style={{ marginBottom: theme.spacing.md }}>
            <Text style={[styles.label, { color: theme.colors.text.primary }]}>
              Start Date <Text style={{ color: theme.colors.feedback.error }}>*</Text>
            </Text>
            <TouchableOpacity
              style={[
                styles.pickerButton,
                {
                  backgroundColor: theme.colors.background.default,
                  borderColor: step1Errors.start_date ? theme.colors.feedback.error : theme.colors.border.default,
                },
              ]}
              onPress={() => setShowDatePicker(true)}
            >
              <Ionicons name="calendar-outline" size={20} color={theme.colors.text.secondary} />
              <Text style={[styles.pickerText, { color: theme.colors.text.primary }]}>
                {step1Data.start_date ? formatDate(selectedDate) : 'Select start date'}
              </Text>
            </TouchableOpacity>
            {step1Errors.start_date && (
              <Text style={[styles.errorText, { color: theme.colors.feedback.error }]}>
                {step1Errors.start_date}
              </Text>
            )}
          </View>

          {/* Default Time */}
          <View style={{ marginBottom: theme.spacing.md }}>
            <Text style={[styles.label, { color: theme.colors.text.primary }]}>
              Default Time <Text style={{ color: theme.colors.feedback.error }}>*</Text>
            </Text>
            <TouchableOpacity
              style={[
                styles.pickerButton,
                {
                  backgroundColor: theme.colors.background.default,
                  borderColor: step1Errors.default_time ? theme.colors.feedback.error : theme.colors.border.default,
                },
              ]}
              onPress={() => setShowTimePicker(true)}
            >
              <Ionicons name="time-outline" size={20} color={theme.colors.text.secondary} />
              <Text style={[styles.pickerText, { color: theme.colors.text.primary }]}>
                {step1Data.default_time ? formatTime(selectedTime) : 'Select default time'}
              </Text>
            </TouchableOpacity>
            {step1Errors.default_time && (
              <Text style={[styles.errorText, { color: theme.colors.feedback.error }]}>
                {step1Errors.default_time}
              </Text>
            )}
          </View>

          {/* Frequency Pattern */}
          <View style={{ marginBottom: theme.spacing.md }}>
            <Text style={[styles.label, { color: theme.colors.text.primary }]}>
              Frequency Pattern <Text style={{ color: theme.colors.feedback.error }}>*</Text>
            </Text>
            <View style={styles.frequencyContainer}>
              {frequencyOptions.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.frequencyOption,
                    {
                      backgroundColor: step1Data.frequency === option.value
                        ? theme.colors.primary.default
                        : theme.colors.background.default,
                      borderColor: step1Data.frequency === option.value
                        ? theme.colors.primary.default
                        : theme.colors.border.default,
                    },
                  ]}
                  onPress={() => updateStep1Field('frequency', option.value)}
                >
                  <Text
                    style={[
                      styles.frequencyText,
                      {
                        color: step1Data.frequency === option.value
                          ? theme.colors.primary.onPrimary
                          : theme.colors.text.primary,
                      },
                    ]}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Duration */}
          <View style={{ marginBottom: theme.spacing.md }}>
            <Text style={[styles.label, { color: theme.colors.text.primary }]}>
              Duration (days) <Text style={{ color: theme.colors.feedback.error }}>*</Text>
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: theme.colors.background.default,
                  borderColor: step1Errors.duration_days ? theme.colors.feedback.error : theme.colors.border.default,
                  color: theme.colors.text.primary,
                },
              ]}
              placeholder={`${proposalDuration}`}
              placeholderTextColor={theme.colors.text.disabled}
              value={step1Data.duration_days?.toString() || ''}
              onChangeText={(text) => {
                const num = parseInt(text, 10);
                updateStep1Field('duration_days', isNaN(num) ? 0 : num);
              }}
              keyboardType="number-pad"
            />
            {step1Errors.duration_days && (
              <Text style={[styles.errorText, { color: theme.colors.feedback.error }]}>
                {step1Errors.duration_days}
              </Text>
            )}
            {step1Data.duration_days !== proposalDuration && step1Data.duration_days && (
              <View style={[styles.warningBox, { backgroundColor: theme.colors.feedback.warning + '20', borderColor: theme.colors.feedback.warning }]}>
                <Ionicons name="warning-outline" size={16} color={theme.colors.feedback.warning} />
                <Text style={[styles.warningText, { color: theme.colors.feedback.warning }]}>
                  Duration changed from {proposalDuration} to {step1Data.duration_days} days
                </Text>
              </View>
            )}
          </View>

          {/* Default Therapist */}
          <View style={{ marginBottom: theme.spacing.md }}>
            <Text style={[styles.label, { color: theme.colors.text.primary }]}>
              Default Therapist <Text style={{ color: theme.colors.feedback.error }}>*</Text>
            </Text>
            <TouchableOpacity
              style={[
                styles.pickerButton,
                {
                  backgroundColor: theme.colors.background.default,
                  borderColor: step1Errors.default_therapist_id ? theme.colors.feedback.error : theme.colors.border.default,
                },
              ]}
              onPress={() => {
                // TODO: Open therapist selector modal
                Alert.alert('Coming Soon', 'Therapist selector will be implemented');
              }}
            >
              <Ionicons name="person-outline" size={20} color={theme.colors.text.secondary} />
              <Text style={[styles.pickerText, { color: theme.colors.text.primary }]}>
                {step1Data.default_therapist_id ? 'Therapist Selected' : 'Select default therapist'}
              </Text>
            </TouchableOpacity>
            {step1Errors.default_therapist_id && (
              <Text style={[styles.errorText, { color: theme.colors.feedback.error }]}>
                {step1Errors.default_therapist_id}
              </Text>
            )}
          </View>

          {/* Default Room (Optional) */}
          <View style={{ marginBottom: theme.spacing.md }}>
            <Text style={[styles.label, { color: theme.colors.text.primary }]}>
              Default Room (Optional)
            </Text>
            <TouchableOpacity
              style={[
                styles.pickerButton,
                {
                  backgroundColor: theme.colors.background.default,
                  borderColor: theme.colors.border.default,
                },
              ]}
              onPress={() => {
                // TODO: Open room selector modal
                Alert.alert('Coming Soon', 'Room selector will be implemented');
              }}
            >
              <Ionicons name="business-outline" size={20} color={theme.colors.text.secondary} />
              <Text style={[styles.pickerText, { color: theme.colors.text.primary }]}>
                {step1Data.default_room_id ? 'Room Selected' : 'Select default room'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Agreed Package Cost */}
          <View style={{ marginBottom: theme.spacing.md }}>
            <Text style={[styles.label, { color: theme.colors.text.primary }]}>
              Agreed Package Cost (₹) <Text style={{ color: theme.colors.feedback.error }}>*</Text>
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: theme.colors.background.default,
                  borderColor: step1Errors.agreed_package_cost ? theme.colors.feedback.error : theme.colors.border.default,
                  color: theme.colors.text.primary,
                },
              ]}
              placeholder="e.g., 18000"
              placeholderTextColor={theme.colors.text.disabled}
              value={step1Data.agreed_package_cost?.toString() || ''}
              onChangeText={(text) => {
                const num = parseFloat(text);
                updateStep1Field('agreed_package_cost', isNaN(num) ? 0 : num);
              }}
              keyboardType="numeric"
            />
            {step1Errors.agreed_package_cost && (
              <Text style={[styles.errorText, { color: theme.colors.feedback.error }]}>
                {step1Errors.agreed_package_cost}
              </Text>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Footer */}
      <View style={[styles.footer, { borderTopColor: theme.colors.border.default, padding: theme.spacing.md }]}>
        <TouchableOpacity
          style={[
            styles.button,
            styles.cancelButton,
            { borderColor: theme.colors.border.default },
          ]}
          onPress={onCancel}
        >
          <Text style={[styles.buttonText, { color: theme.colors.text.primary }]}>
            Cancel
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.button,
            styles.nextButton,
            { backgroundColor: theme.colors.primary.default },
          ]}
          onPress={handleNext}
        >
          <Text style={[styles.buttonText, { color: theme.colors.primary.onPrimary }]}>
            Next: Review Sessions
          </Text>
          <Ionicons name="arrow-forward" size={20} color={theme.colors.primary.onPrimary} />
        </TouchableOpacity>
      </View>

      {/* Date Picker */}
      {showDatePicker && (
        <DateTimePicker
          value={selectedDate}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleDateChange}
          minimumDate={new Date()}
        />
      )}

      {/* Time Picker */}
      {showTimePicker && (
        <DateTimePicker
          value={selectedTime}
          mode="time"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleTimeChange}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  headerSubtitle: {
    fontSize: 14,
    marginTop: 4,
  },
  infoCard: {
    borderRadius: 8,
    margin: 16,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  infoSubtitle: {
    fontSize: 14,
    marginTop: 4,
  },
  scrollView: {
    flex: 1,
  },
  formContainer: {
    paddingBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  pickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
  },
  pickerText: {
    fontSize: 16,
    marginLeft: 8,
    flex: 1,
  },
  frequencyContainer: {
    gap: 8,
  },
  frequencyOption: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  frequencyText: {
    fontSize: 14,
    fontWeight: '500',
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    padding: 8,
    marginTop: 8,
  },
  warningText: {
    fontSize: 12,
    marginLeft: 8,
    flex: 1,
  },
  errorText: {
    fontSize: 12,
    marginTop: 4,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: 12,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButton: {
    marginRight: 8,
    borderWidth: 1,
  },
  nextButton: {
    marginLeft: 8,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    marginRight: 4,
  },
});
