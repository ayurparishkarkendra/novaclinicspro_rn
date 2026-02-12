/**
 * Staff Form Component
 * Form for creating/editing staff members
 */

import React from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../../core/theme/colors';
import { spacing } from '../../../../core/theme/spacing';
import { typography } from '../../../../core/theme/typography';
import {
  StaffCreate,
  StaffUpdate,
  StaffResponse,
  StaffType,
  getStaffTypeLabel,
} from '../../data/models/staff.dtos';

// ============================================
// VALIDATION SCHEMA
// ============================================

const staffSchema = z.object({
  full_name: z.string().min(1, 'Full name is required').max(255),
  requires_login: z.boolean(),
  phone: z.string().min(1, 'Phone is required').max(20),
  gender: z.string().min(1, 'Gender is required'),
  staff_type: z.enum(['doctor', 'therapist', 'nurse', 'receptionist', 'pharmacist', 'physiotherapist', 'dentist', 'admin']),
  email: z.string().email('Invalid email').optional().nullable().or(z.literal('')),
  staff_code: z.string().max(50).optional().nullable(),
  designation: z.string().max(100).optional().nullable(),
  specialization: z.string().optional().nullable(),
  qualifications: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  emergency_contact: z.string().max(20).optional().nullable(),
});

type StaffFormData = z.infer<typeof staffSchema>;

// ============================================
// COMPONENT
// ============================================

interface StaffFormProps {
  initialData?: StaffResponse;
  onSubmit: (data: StaffCreate | StaffUpdate) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

const STAFF_TYPES: StaffType[] = [
  'doctor',
  'therapist',
  'nurse',
  'receptionist',
  'pharmacist',
  'physiotherapist',
  'dentist',
  'admin',
];

const GENDERS = ['Male', 'Female', 'Other'];

export const StaffForm: React.FC<StaffFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
  isLoading = false,
}) => {
  const isEditing = !!initialData;

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<StaffFormData>({
    resolver: zodResolver(staffSchema),
    defaultValues: {
      full_name: initialData?.full_name || '',
      requires_login: initialData?.has_login || false,
      phone: initialData?.phone || '',
      gender: initialData?.gender || '',
      staff_type: initialData?.staff_type || 'therapist',
      email: initialData?.email || '',
      staff_code: initialData?.staff_code || '',
      designation: initialData?.designation || '',
      specialization: initialData?.specialization || '',
      qualifications: initialData?.qualifications || '',
      address: initialData?.address || '',
      emergency_contact: initialData?.emergency_contact || '',
    },
  });

  const requiresLogin = watch('requires_login');

  const onFormSubmit = (data: StaffFormData) => {
    // Clean up empty strings to null
    const cleanData = Object.fromEntries(
      Object.entries(data).map(([key, value]) => [
        key,
        value === '' ? null : value,
      ])
    );
    onSubmit(cleanData as StaffCreate | StaffUpdate);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Basic Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Basic Information</Text>

          {/* Full Name */}
          <View style={styles.field}>
            <Text style={styles.label}>Full Name *</Text>
            <Controller
              control={control}
              name="full_name"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  style={[styles.input, errors.full_name && styles.inputError]}
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  placeholder="Enter full name"
                  placeholderTextColor={colors.text.tertiary}
                />
              )}
            />
            {errors.full_name && (
              <Text style={styles.errorText}>{errors.full_name.message}</Text>
            )}
          </View>

          {/* Phone */}
          <View style={styles.field}>
            <Text style={styles.label}>Phone *</Text>
            <Controller
              control={control}
              name="phone"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  style={[styles.input, errors.phone && styles.inputError]}
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  placeholder="Enter phone number"
                  placeholderTextColor={colors.text.tertiary}
                  keyboardType="phone-pad"
                />
              )}
            />
            {errors.phone && (
              <Text style={styles.errorText}>{errors.phone.message}</Text>
            )}
          </View>

          {/* Gender */}
          <View style={styles.field}>
            <Text style={styles.label}>Gender *</Text>
            <Controller
              control={control}
              name="gender"
              render={({ field: { onChange, value } }) => (
                <View style={styles.optionsRow}>
                  {GENDERS.map((gender) => (
                    <TouchableOpacity
                      key={gender}
                      style={[
                        styles.optionButton,
                        value === gender && styles.optionButtonSelected,
                      ]}
                      onPress={() => onChange(gender)}
                    >
                      <Text
                        style={[
                          styles.optionText,
                          value === gender && styles.optionTextSelected,
                        ]}
                      >
                        {gender}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            />
            {errors.gender && (
              <Text style={styles.errorText}>{errors.gender.message}</Text>
            )}
          </View>

          {/* Staff Type */}
          <View style={styles.field}>
            <Text style={styles.label}>Staff Type *</Text>
            <Controller
              control={control}
              name="staff_type"
              render={({ field: { onChange, value } }) => (
                <View style={styles.typeGrid}>
                  {STAFF_TYPES.map((type) => (
                    <TouchableOpacity
                      key={type}
                      style={[
                        styles.typeButton,
                        value === type && styles.typeButtonSelected,
                      ]}
                      onPress={() => onChange(type)}
                    >
                      <Text
                        style={[
                          styles.typeText,
                          value === type && styles.typeTextSelected,
                        ]}
                      >
                        {getStaffTypeLabel(type)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            />
          </View>
        </View>

        {/* Login & Contact */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account & Contact</Text>

          {/* Requires Login */}
          {!isEditing && (
            <View style={styles.switchField}>
              <View style={styles.switchInfo}>
                <Text style={styles.label}>System Login Access</Text>
                <Text style={styles.hint}>
                  Enable if staff needs app login credentials
                </Text>
              </View>
              <Controller
                control={control}
                name="requires_login"
                render={({ field: { onChange, value } }) => (
                  <Switch
                    value={value}
                    onValueChange={onChange}
                    trackColor={{ false: colors.grey[300], true: colors.primary.light }}
                    thumbColor={value ? colors.primary.main : colors.grey[100]}
                  />
                )}
              />
            </View>
          )}

          {/* Email */}
          <View style={styles.field}>
            <Text style={styles.label}>
              Email {requiresLogin ? '*' : '(Optional)'}
            </Text>
            <Controller
              control={control}
              name="email"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  style={[styles.input, errors.email && styles.inputError]}
                  value={value || ''}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  placeholder="Enter email address"
                  placeholderTextColor={colors.text.tertiary}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              )}
            />
            {errors.email && (
              <Text style={styles.errorText}>{errors.email.message}</Text>
            )}
          </View>

          {/* Emergency Contact */}
          <View style={styles.field}>
            <Text style={styles.label}>Emergency Contact (Optional)</Text>
            <Controller
              control={control}
              name="emergency_contact"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  style={styles.input}
                  value={value || ''}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  placeholder="Enter emergency contact"
                  placeholderTextColor={colors.text.tertiary}
                  keyboardType="phone-pad"
                />
              )}
            />
          </View>
        </View>

        {/* Professional Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Professional Details</Text>

          {/* Staff Code */}
          <View style={styles.field}>
            <Text style={styles.label}>Staff Code (Optional)</Text>
            <Controller
              control={control}
              name="staff_code"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  style={styles.input}
                  value={value || ''}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  placeholder="e.g., EMP001"
                  placeholderTextColor={colors.text.tertiary}
                />
              )}
            />
          </View>

          {/* Designation */}
          <View style={styles.field}>
            <Text style={styles.label}>Designation (Optional)</Text>
            <Controller
              control={control}
              name="designation"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  style={styles.input}
                  value={value || ''}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  placeholder="e.g., Senior Therapist"
                  placeholderTextColor={colors.text.tertiary}
                />
              )}
            />
          </View>

          {/* Specialization */}
          <View style={styles.field}>
            <Text style={styles.label}>Specialization (Optional)</Text>
            <Controller
              control={control}
              name="specialization"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  style={styles.input}
                  value={value || ''}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  placeholder="e.g., Panchakarma, Ayurvedic Medicine"
                  placeholderTextColor={colors.text.tertiary}
                />
              )}
            />
          </View>

          {/* Qualifications */}
          <View style={styles.field}>
            <Text style={styles.label}>Qualifications (Optional)</Text>
            <Controller
              control={control}
              name="qualifications"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  style={[styles.input, styles.multilineInput]}
                  value={value || ''}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  placeholder="e.g., BAMS, MD Ayurveda"
                  placeholderTextColor={colors.text.tertiary}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                />
              )}
            />
          </View>

          {/* Address */}
          <View style={styles.field}>
            <Text style={styles.label}>Address (Optional)</Text>
            <Controller
              control={control}
              name="address"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  style={[styles.input, styles.multilineInput]}
                  value={value || ''}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  placeholder="Enter address"
                  placeholderTextColor={colors.text.tertiary}
                  multiline
                  numberOfLines={2}
                  textAlignVertical="top"
                />
              )}
            />
          </View>
        </View>
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={onCancel}
          disabled={isLoading}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.submitButton, isLoading && styles.buttonDisabled]}
          onPress={handleSubmit(onFormSubmit)}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color={colors.background.default} />
          ) : (
            <>
              <Ionicons
                name={isEditing ? 'checkmark' : 'add'}
                size={20}
                color={colors.background.default}
              />
              <Text style={styles.submitButtonText}>
                {isEditing ? 'Save Changes' : 'Add Staff'}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.paper,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.md,
    paddingBottom: spacing.xl,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    ...typography.h6,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  field: {
    marginBottom: spacing.md,
  },
  label: {
    ...typography.body2,
    color: colors.text.primary,
    fontWeight: '500',
    marginBottom: spacing.xs,
  },
  hint: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  input: {
    backgroundColor: colors.background.default,
    borderWidth: 1,
    borderColor: colors.border.light,
    borderRadius: 8,
    padding: spacing.md,
    ...typography.body1,
    color: colors.text.primary,
  },
  inputError: {
    borderColor: colors.error.main,
  },
  multilineInput: {
    minHeight: 80,
  },
  errorText: {
    ...typography.caption,
    color: colors.error.main,
    marginTop: 4,
  },
  optionsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  optionButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border.light,
    backgroundColor: colors.background.default,
    alignItems: 'center',
  },
  optionButtonSelected: {
    borderColor: colors.primary.main,
    backgroundColor: colors.primary.main + '10',
  },
  optionText: {
    ...typography.body2,
    color: colors.text.secondary,
  },
  optionTextSelected: {
    color: colors.primary.main,
    fontWeight: '600',
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  typeButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border.light,
    backgroundColor: colors.background.default,
  },
  typeButtonSelected: {
    borderColor: colors.primary.main,
    backgroundColor: colors.primary.main + '10',
  },
  typeText: {
    ...typography.body2,
    color: colors.text.secondary,
  },
  typeTextSelected: {
    color: colors.primary.main,
    fontWeight: '600',
  },
  switchField: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
    backgroundColor: colors.background.default,
    padding: spacing.md,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  switchInfo: {
    flex: 1,
    marginRight: spacing.md,
  },
  actions: {
    flexDirection: 'row',
    padding: spacing.md,
    gap: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
    backgroundColor: colors.background.default,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border.main,
    alignItems: 'center',
  },
  cancelButtonText: {
    ...typography.button,
    color: colors.text.primary,
  },
  submitButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderRadius: 8,
    backgroundColor: colors.primary.main,
  },
  submitButtonText: {
    ...typography.button,
    color: colors.background.default,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});
