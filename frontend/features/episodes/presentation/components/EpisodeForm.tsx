/**
 * Episode Form Component
 * Form for creating/editing episodes
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Ionicons } from '@expo/vector-icons';
import { useClinicTheme } from '../../../../core/theme/useClinicTheme';
import {
  Episode,
  EpisodeCreateRequest,
  EpisodeUpdateRequest,
  EpisodeCodeSystem,
} from '../../data/models/episodes.dtos';

// ============================================
// VALIDATION SCHEMA
// ============================================

const episodeSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().optional().nullable(),
  episode_code: z.string().optional().nullable(),
  episode_code_system: z.enum(['ICD-10', 'SNOMED', 'INTERNAL', 'NULL']).optional().nullable(),
});

type EpisodeFormData = z.infer<typeof episodeSchema>;

// ============================================
// TYPES
// ============================================

interface EpisodeFormProps {
  initialData?: Episode;
  onSubmit: (data: EpisodeCreateRequest | EpisodeUpdateRequest) => void | Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
  mode?: 'create' | 'edit';
}

// ============================================
// CODE SYSTEM OPTIONS
// ============================================

const CODE_SYSTEMS: Array<{ value: EpisodeCodeSystem; label: string }> = [
  { value: 'ICD-10', label: 'ICD-10' },
  { value: 'SNOMED', label: 'SNOMED' },
  { value: 'INTERNAL', label: 'Internal' },
];

// ============================================
// COMPONENT
// ============================================

export const EpisodeForm: React.FC<EpisodeFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
  isLoading = false,
  mode = 'create',
}) => {
  const theme = useClinicTheme();
  const isEditing = mode === 'edit';

  const {
    control,
    handleSubmit,
    formState: { errors, isDirty },
    watch,
  } = useForm<EpisodeFormData>({
    resolver: zodResolver(episodeSchema),
    defaultValues: {
      title: initialData?.title || '',
      description: initialData?.description || '',
      episode_code: initialData?.episode_code || '',
      episode_code_system: initialData?.episode_code_system || null,
    },
  });

  const [showCodeSystemPicker, setShowCodeSystemPicker] = useState(false);
  const selectedCodeSystem = watch('episode_code_system');

  const onFormSubmit = (data: EpisodeFormData) => {
    const payload: EpisodeCreateRequest | EpisodeUpdateRequest = {
      title: data.title,
      description: data.description || undefined,
      episode_code: data.episode_code || undefined,
      episode_code_system: data.episode_code_system || undefined,
    };

    onSubmit(payload);
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.colors.background.default }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Title Field */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>
            Episode Information
          </Text>

          <View style={styles.field}>
            <Text style={[styles.label, { color: theme.colors.text.primary }]}>
              Title *
            </Text>
            <Controller
              control={control}
              name="title"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: theme.colors.surface.default,
                      borderColor: errors.title
                        ? theme.colors.feedback.error
                        : theme.colors.border.default,
                      color: theme.colors.text.primary,
                    },
                  ]}
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  placeholder="Enter episode title"
                  placeholderTextColor={theme.colors.text.tertiary}
                />
              )}
            />
            {errors.title && (
              <Text style={[styles.errorText, { color: theme.colors.feedback.error }]}>
                {errors.title.message}
              </Text>
            )}
            <Text style={[styles.hint, { color: theme.colors.text.tertiary }]}>
              Brief description of the condition or treatment plan
            </Text>
          </View>

          {/* Description Field */}
          <View style={styles.field}>
            <Text style={[styles.label, { color: theme.colors.text.primary }]}>
              Description (Optional)
            </Text>
            <Controller
              control={control}
              name="description"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  style={[
                    styles.input,
                    styles.multilineInput,
                    {
                      backgroundColor: theme.colors.surface.default,
                      borderColor: theme.colors.border.default,
                      color: theme.colors.text.primary,
                    },
                  ]}
                  value={value || ''}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  placeholder="Add detailed notes about this episode"
                  placeholderTextColor={theme.colors.text.tertiary}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
              )}
            />
          </View>
        </View>

        {/* Diagnosis Codes Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>
            Diagnosis Codes (Optional)
          </Text>

          {/* Episode Code */}
          <View style={styles.field}>
            <Text style={[styles.label, { color: theme.colors.text.primary }]}>
              Episode Code
            </Text>
            <Controller
              control={control}
              name="episode_code"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: theme.colors.surface.default,
                      borderColor: theme.colors.border.default,
                      color: theme.colors.text.primary,
                    },
                  ]}
                  value={value || ''}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  placeholder="e.g., M54.5, J45.0"
                  placeholderTextColor={theme.colors.text.tertiary}
                />
              )}
            />
          </View>

          {/* Code System Picker */}
          <View style={styles.field}>
            <Text style={[styles.label, { color: theme.colors.text.primary }]}>
              Code System
            </Text>
            <Controller
              control={control}
              name="episode_code_system"
              render={({ field: { onChange, value } }) => (
                <View>
                  <TouchableOpacity
                    style={[
                      styles.pickerButton,
                      {
                        backgroundColor: theme.colors.surface.default,
                        borderColor: theme.colors.border.default,
                      },
                    ]}
                    onPress={() => setShowCodeSystemPicker(!showCodeSystemPicker)}
                  >
                    <Text
                      style={[
                        styles.pickerButtonText,
                        {
                          color: value
                            ? theme.colors.text.primary
                            : theme.colors.text.tertiary,
                        },
                      ]}
                    >
                      {value || 'Select code system'}
                    </Text>
                    <Ionicons
                      name={showCodeSystemPicker ? 'chevron-up' : 'chevron-down'}
                      size={20}
                      color={theme.colors.text.secondary}
                    />
                  </TouchableOpacity>

                  {showCodeSystemPicker && (
                    <View
                      style={[
                        styles.pickerOptions,
                        {
                          backgroundColor: theme.colors.surface.default,
                          borderColor: theme.colors.border.default,
                        },
                      ]}
                    >
                      {CODE_SYSTEMS.map((system) => (
                        <TouchableOpacity
                          key={system.value}
                          style={[
                            styles.pickerOption,
                            value === system.value && {
                              backgroundColor: theme.colors.primary.default + '10',
                            },
                          ]}
                          onPress={() => {
                            onChange(system.value);
                            setShowCodeSystemPicker(false);
                          }}
                        >
                          <Text
                            style={[
                              styles.pickerOptionText,
                              {
                                color:
                                  value === system.value
                                    ? theme.colors.primary.default
                                    : theme.colors.text.primary,
                              },
                            ]}
                          >
                            {system.label}
                          </Text>
                          {value === system.value && (
                            <Ionicons
                              name="checkmark"
                              size={20}
                              color={theme.colors.primary.default}
                            />
                          )}
                        </TouchableOpacity>
                      ))}
                      <TouchableOpacity
                        style={styles.pickerOption}
                        onPress={() => {
                          onChange(null);
                          setShowCodeSystemPicker(false);
                        }}
                      >
                        <Text
                          style={[
                            styles.pickerOptionText,
                            { color: theme.colors.text.tertiary },
                          ]}
                        >
                          Clear selection
                        </Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              )}
            />
          </View>
        </View>
      </ScrollView>

      {/* Action Buttons */}
      <View
        style={[
          styles.actions,
          {
            borderTopColor: theme.colors.border.default,
            backgroundColor: theme.colors.surface.default,
          },
        ]}
      >
        <TouchableOpacity
          style={[
            styles.cancelButton,
            { borderColor: theme.colors.border.default },
          ]}
          onPress={onCancel}
          disabled={isLoading}
        >
          <Text style={[styles.cancelButtonText, { color: theme.colors.text.primary }]}>
            Cancel
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.submitButton,
            { backgroundColor: theme.colors.primary.default },
            isLoading && styles.buttonDisabled,
          ]}
          onPress={handleSubmit(onFormSubmit)}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color={theme.colors.background.default} />
          ) : (
            <>
              <Ionicons
                name={isEditing ? 'checkmark' : 'add'}
                size={20}
                color={theme.colors.background.default}
              />
              <Text
                style={[
                  styles.submitButtonText,
                  { color: theme.colors.background.default },
                ]}
              >
                {isEditing ? 'Save Changes' : 'Create Episode'}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

// ============================================
// STYLES
// ============================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 24,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
  },
  field: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  hint: {
    fontSize: 12,
    marginTop: 4,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
  },
  multilineInput: {
    minHeight: 100,
    paddingTop: 12,
  },
  errorText: {
    fontSize: 12,
    marginTop: 4,
  },
  pickerButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
  },
  pickerButtonText: {
    fontSize: 15,
  },
  pickerOptions: {
    marginTop: 8,
    borderWidth: 1,
    borderRadius: 8,
    overflow: 'hidden',
  },
  pickerOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  pickerOptionText: {
    fontSize: 15,
  },
  actions: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    borderTopWidth: 1,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
  submitButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 8,
  },
  submitButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});
