/**
 * Proposal Edit Modal
 * Modal form for editing existing treatment proposals
 * 
 * Features:
 * - Pre-fill form with existing proposal data
 * - Include version field for optimistic locking
 * - Handle 409 conflict error
 * - Success toast on update
 * - Close and refresh on success
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  StyleSheet,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useClinicTheme } from '../../../../core/theme/useClinicTheme';
import { useProposalFormStore } from '../stores/proposalForm.store';
import {
  useUpdateProposalMutation,
  useProposalByIdQuery,
} from '../../data/repositories/proposals.repository.impl';
import { useAuth } from '../../../auth/presentation/hooks/useAuth';
import { TreatmentProposal } from '../../data/models/treatmentProposals.dtos';

interface ProposalEditModalProps {
  proposalId: string;
  visible: boolean;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const ProposalEditModal: React.FC<ProposalEditModalProps> = ({
  proposalId,
  visible,
  onSuccess,
  onCancel,
}) => {
  const theme = useClinicTheme();
  const { currentUser } = useAuth();
  const tenantId = currentUser?.tenantId || '';

  // Zustand store
  const {
    formData,
    errors,
    updateField,
    addModality,
    removeModality,
    setErrors,
    resetForm,
    setFormData,
  } = useProposalFormStore();

  // Local state for modality input
  const [modalityInput, setModalityInput] = useState('');
  const [currentVersion, setCurrentVersion] = useState<number>(1);

  // Fetch existing proposal data
  const { data: proposal, isLoading: isLoadingProposal } = useProposalByIdQuery(
    tenantId,
    proposalId,
    { enabled: !!tenantId && !!proposalId && visible }
  );

  // Update proposal mutation
  const updateMutation = useUpdateProposalMutation(tenantId, proposalId, {
    onSuccess: (data) => {
      console.log('✅ Proposal updated successfully:', data.id);
      Alert.alert('Success', 'Treatment proposal updated successfully');
      resetForm();
      onSuccess?.();
    },
    onError: (error: any) => {
      console.error('❌ Failed to update proposal:', error);
      
      // Handle 409 conflict error
      if (error.response?.status === 409) {
        Alert.alert(
          'Conflict',
          'This proposal was modified by another user. Please refresh and try again.',
          [
            {
              text: 'Refresh',
              onPress: () => {
                // Refresh will happen automatically via React Query
                onCancel?.();
              },
            },
          ]
        );
      } else {
        Alert.alert('Error', error.message || 'Failed to update proposal. Please try again.');
      }
    },
  });

  // Pre-fill form when proposal data is loaded
  useEffect(() => {
    if (proposal && visible) {
      setFormData({
        episode_id: proposal.episode_id,
        name: proposal.name,
        duration_days: proposal.duration_days,
        modalities: proposal.modalities || [],
        modalities_notes: proposal.modalities_notes,
        goals: proposal.goals,
        contraindications: proposal.contraindications,
        estimated_cost_min: proposal.estimated_cost_min,
        estimated_cost_max: proposal.estimated_cost_max,
        currency: proposal.currency || 'INR',
      });
      setCurrentVersion(proposal.version);
    }
  }, [proposal, visible]);

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name?.trim()) {
      newErrors.name = 'Treatment name is required';
    }

    if (!formData.duration_days || formData.duration_days < 1) {
      newErrors.duration_days = 'Duration must be at least 1 day';
    } else if (formData.duration_days > 365) {
      newErrors.duration_days = 'Duration cannot exceed 365 days';
    }

    if (!formData.goals?.trim()) {
      newErrors.goals = 'Goals are required';
    }

    if (formData.estimated_cost_min && formData.estimated_cost_max) {
      if (formData.estimated_cost_min > formData.estimated_cost_max) {
        newErrors.estimated_cost_min = 'Minimum cost cannot exceed maximum cost';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = () => {
    if (!validateForm()) {
      Alert.alert('Validation Error', 'Please fix the errors before submitting');
      return;
    }

    // Create update DTO with version for optimistic locking
    const updateData = {
      version: currentVersion,
      name: formData.name,
      duration_days: formData.duration_days,
      goals: formData.goals,
      modalities: formData.modalities,
      modalities_notes: formData.modalities_notes,
      contraindications: formData.contraindications,
      estimated_cost_min: formData.estimated_cost_min,
      estimated_cost_max: formData.estimated_cost_max,
    };

    updateMutation.mutate(updateData);
  };

  // Handle add modality
  const handleAddModality = () => {
    const trimmed = modalityInput.trim();
    if (trimmed) {
      addModality(trimmed);
      setModalityInput('');
    }
  };

  // Handle cancel
  const handleCancel = () => {
    resetForm();
    onCancel?.();
  };

  if (!visible) {
    return null;
  }

  if (isLoadingProposal) {
    return (
      <View style={[styles.overlay, { backgroundColor: 'rgba(0, 0, 0, 0.5)' }]}>
        <View style={[styles.loadingContainer, { backgroundColor: theme.colors.background.default }]}>
          <ActivityIndicator size="large" color={theme.colors.primary.default} />
          <Text style={[styles.loadingText, { color: theme.colors.text.secondary }]}>
            Loading proposal...
          </Text>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.keyboardAvoid}
    >
      <View style={[styles.overlay, { backgroundColor: 'rgba(0, 0, 0, 0.5)' }]}>
        <View style={[styles.modalContainer, { backgroundColor: theme.colors.background.elevated }]}>
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: theme.colors.border.default }]}>
            <Text style={[styles.headerTitle, { color: theme.colors.text.primary }]}>
              Edit Treatment Proposal
            </Text>
            <TouchableOpacity onPress={handleCancel} disabled={updateMutation.isPending}>
              <Ionicons name="close" size={24} color={theme.colors.text.secondary} />
            </TouchableOpacity>
          </View>

          {/* Form */}
          <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
            <View style={[styles.formContainer, { padding: theme.spacing.md }]}>
              {/* Treatment Name */}
              <View style={{ marginBottom: theme.spacing.md }}>
                <Text style={[styles.label, { color: theme.colors.text.primary }]}>
                  Treatment Name <Text style={{ color: theme.colors.feedback.error }}>*</Text>
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: theme.colors.background.default,
                      borderColor: errors.name ? theme.colors.feedback.error : theme.colors.border.default,
                      color: theme.colors.text.primary,
                    },
                  ]}
                  placeholder="e.g., Panchakarma"
                  placeholderTextColor={theme.colors.text.disabled}
                  value={formData.name}
                  onChangeText={(text) => updateField('name', text)}
                  editable={!updateMutation.isPending}
                />
                {errors.name && (
                  <Text style={[styles.errorText, { color: theme.colors.feedback.error }]}>
                    {errors.name}
                  </Text>
                )}
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
                      borderColor: errors.duration_days ? theme.colors.feedback.error : theme.colors.border.default,
                      color: theme.colors.text.primary,
                    },
                  ]}
                  placeholder="e.g., 21"
                  placeholderTextColor={theme.colors.text.disabled}
                  value={formData.duration_days?.toString() || ''}
                  onChangeText={(text) => {
                    const num = parseInt(text, 10);
                    updateField('duration_days', isNaN(num) ? undefined : (num as any));
                  }}
                  keyboardType="number-pad"
                  editable={!updateMutation.isPending}
                />
                {errors.duration_days && (
                  <Text style={[styles.errorText, { color: theme.colors.feedback.error }]}>
                    {errors.duration_days}
                  </Text>
                )}
              </View>

              {/* Modalities */}
              <View style={{ marginBottom: theme.spacing.md }}>
                <Text style={[styles.label, { color: theme.colors.text.primary }]}>
                  Modalities
                </Text>
                <View style={styles.modalityInputContainer}>
                  <TextInput
                    style={[
                      styles.input,
                      styles.modalityInput,
                      {
                        backgroundColor: theme.colors.background.default,
                        borderColor: theme.colors.border.default,
                        color: theme.colors.text.primary,
                      },
                    ]}
                    placeholder="e.g., Abhyanga"
                    placeholderTextColor={theme.colors.text.disabled}
                    value={modalityInput}
                    onChangeText={setModalityInput}
                    onSubmitEditing={handleAddModality}
                    editable={!updateMutation.isPending}
                  />
                  <TouchableOpacity
                    style={[
                      styles.addButton,
                      { backgroundColor: theme.colors.primary.default },
                    ]}
                    onPress={handleAddModality}
                    disabled={!modalityInput.trim() || updateMutation.isPending}
                  >
                    <Ionicons name="add" size={20} color={theme.colors.primary.onPrimary} />
                  </TouchableOpacity>
                </View>

                {/* Modality Chips */}
                {formData.modalities && formData.modalities.length > 0 && (
                  <View style={styles.chipsContainer}>
                    {formData.modalities.map((modality, index) => (
                      <View
                        key={index}
                        style={[
                          styles.chip,
                          {
                            backgroundColor: theme.colors.primary.light,
                            borderColor: theme.colors.primary.default,
                          },
                        ]}
                      >
                        <Text style={[styles.chipText, { color: theme.colors.primary.default }]}>
                          {modality}
                        </Text>
                        <TouchableOpacity
                          onPress={() => removeModality(modality)}
                          disabled={updateMutation.isPending}
                        >
                          <Ionicons name="close-circle" size={16} color={theme.colors.primary.default} />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                )}
              </View>

              {/* Modality Notes */}
              <View style={{ marginBottom: theme.spacing.md }}>
                <Text style={[styles.label, { color: theme.colors.text.primary }]}>
                  Additional Notes on Modalities
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    styles.textArea,
                    {
                      backgroundColor: theme.colors.background.default,
                      borderColor: theme.colors.border.default,
                      color: theme.colors.text.primary,
                    },
                  ]}
                  placeholder="Any specific details about the modalities..."
                  placeholderTextColor={theme.colors.text.disabled}
                  value={formData.modalities_notes}
                  onChangeText={(text) => updateField('modalities_notes', text)}
                  multiline
                  numberOfLines={3}
                  editable={!updateMutation.isPending}
                />
              </View>

              {/* Goals */}
              <View style={{ marginBottom: theme.spacing.md }}>
                <Text style={[styles.label, { color: theme.colors.text.primary }]}>
                  Goals / Expected Outcomes <Text style={{ color: theme.colors.feedback.error }}>*</Text>
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    styles.textArea,
                    {
                      backgroundColor: theme.colors.background.default,
                      borderColor: errors.goals ? theme.colors.feedback.error : theme.colors.border.default,
                      color: theme.colors.text.primary,
                    },
                  ]}
                  placeholder="Describe the expected outcomes of this treatment..."
                  placeholderTextColor={theme.colors.text.disabled}
                  value={formData.goals}
                  onChangeText={(text) => updateField('goals', text)}
                  multiline
                  numberOfLines={4}
                  editable={!updateMutation.isPending}
                />
                {errors.goals && (
                  <Text style={[styles.errorText, { color: theme.colors.feedback.error }]}>
                    {errors.goals}
                  </Text>
                )}
              </View>

              {/* Contraindications */}
              <View style={{ marginBottom: theme.spacing.md }}>
                <Text style={[styles.label, { color: theme.colors.text.primary }]}>
                  Contraindications / Prerequisites
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    styles.textArea,
                    {
                      backgroundColor: theme.colors.background.default,
                      borderColor: theme.colors.border.default,
                      color: theme.colors.text.primary,
                    },
                  ]}
                  placeholder="Any contraindications or prerequisites..."
                  placeholderTextColor={theme.colors.text.disabled}
                  value={formData.contraindications}
                  onChangeText={(text) => updateField('contraindications', text)}
                  multiline
                  numberOfLines={3}
                  editable={!updateMutation.isPending}
                />
              </View>

              {/* Cost Range */}
              <View style={{ marginBottom: theme.spacing.md }}>
                <Text style={[styles.label, { color: theme.colors.text.primary }]}>
                  Estimated Cost Range
                </Text>
                <View style={styles.costRangeContainer}>
                  <View style={styles.costInputContainer}>
                    <Text style={[styles.costLabel, { color: theme.colors.text.secondary }]}>
                      Min (₹)
                    </Text>
                    <TextInput
                      style={[
                        styles.input,
                        styles.costInput,
                        {
                          backgroundColor: theme.colors.background.default,
                          borderColor: errors.estimated_cost_min ? theme.colors.feedback.error : theme.colors.border.default,
                          color: theme.colors.text.primary,
                        },
                      ]}
                      placeholder="15000"
                      placeholderTextColor={theme.colors.text.disabled}
                      value={formData.estimated_cost_min?.toString() || ''}
                      onChangeText={(text) => {
                        const num = parseFloat(text);
                        updateField('estimated_cost_min', isNaN(num) ? undefined : num);
                      }}
                      keyboardType="numeric"
                      editable={!updateMutation.isPending}
                    />
                  </View>
                  <Text style={[styles.costSeparator, { color: theme.colors.text.secondary }]}>
                    to
                  </Text>
                  <View style={styles.costInputContainer}>
                    <Text style={[styles.costLabel, { color: theme.colors.text.secondary }]}>
                      Max (₹)
                    </Text>
                    <TextInput
                      style={[
                        styles.input,
                        styles.costInput,
                        {
                          backgroundColor: theme.colors.background.default,
                          borderColor: theme.colors.border.default,
                          color: theme.colors.text.primary,
                        },
                      ]}
                      placeholder="20000"
                      placeholderTextColor={theme.colors.text.disabled}
                      value={formData.estimated_cost_max?.toString() || ''}
                      onChangeText={(text) => {
                        const num = parseFloat(text);
                        updateField('estimated_cost_max', isNaN(num) ? undefined : num);
                      }}
                      keyboardType="numeric"
                      editable={!updateMutation.isPending}
                    />
                  </View>
                </View>
                {errors.estimated_cost_min && (
                  <Text style={[styles.errorText, { color: theme.colors.feedback.error }]}>
                    {errors.estimated_cost_min}
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
              onPress={handleCancel}
              disabled={updateMutation.isPending}
            >
              <Text style={[styles.buttonText, { color: theme.colors.text.primary }]}>
                Cancel
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.button,
                styles.submitButton,
                {
                  backgroundColor: updateMutation.isPending
                    ? theme.colors.primary.disabled
                    : theme.colors.primary.default,
                },
              ]}
              onPress={handleSubmit}
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending ? (
                <ActivityIndicator size="small" color={theme.colors.primary.onPrimary} />
              ) : (
                <Text style={[styles.buttonText, { color: theme.colors.primary.onPrimary }]}>
                  Update Proposal
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  keyboardAvoid: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '90%',
    maxWidth: 600,
    maxHeight: '90%',
    borderRadius: 12,
    overflow: 'hidden',
  },
  loadingContainer: {
    padding: 40,
    borderRadius: 12,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
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
  scrollView: {
    maxHeight: 500,
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
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  errorText: {
    fontSize: 12,
    marginTop: 4,
  },
  modalityInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalityInput: {
    flex: 1,
    marginRight: 8,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    marginRight: 8,
    marginBottom: 8,
  },
  chipText: {
    fontSize: 14,
    marginRight: 4,
  },
  costRangeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  costInputContainer: {
    flex: 1,
  },
  costLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  costInput: {
    flex: 1,
  },
  costSeparator: {
    marginHorizontal: 8,
    fontSize: 14,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButton: {
    marginRight: 8,
    borderWidth: 1,
  },
  submitButton: {
    marginLeft: 8,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
