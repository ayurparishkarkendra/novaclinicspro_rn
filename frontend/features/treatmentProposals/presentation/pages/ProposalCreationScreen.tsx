/**
 * Proposal Creation Screen (Full Page)
 * Full-screen form for creating treatment proposals
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useClinicTheme } from '../../../../core/theme/useClinicTheme';
import { useProposalFormStore } from '../stores/proposalForm.store';
import {
  useCreateProposalMutation,
  useCanCreateProposalQuery,
} from '../../data/repositories/proposals.repository.impl';
import { useAuth } from '../../../auth/presentation/hooks/useAuth';
import { useEpisodeQuery } from '../../../episodes/data/repositories/episodes.repository.impl';

export const ProposalCreationScreen: React.FC = () => {
  const theme = useClinicTheme();
  const router = useRouter();
  const { episodeId } = useLocalSearchParams<{ episodeId: string }>();
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
    openModal,
  } = useProposalFormStore();

  // Local state for modality input
  const [modalityInput, setModalityInput] = useState('');

  // Initialize form with episodeId
  React.useEffect(() => {
    if (episodeId) {
      openModal(episodeId);
    }
  }, [episodeId, openModal]);

  // Fetch episode data to get client_id
  const { data: episode, isLoading: isLoadingEpisode } = useEpisodeQuery(
    tenantId,
    episodeId || '',
    { enabled: !!tenantId && !!episodeId }
  );

  // Check if user can create proposal
  const { data: canCreateResult, isLoading: isCheckingPermission } = useCanCreateProposalQuery(
    tenantId,
    episodeId || '',
    { enabled: !!tenantId && !!episodeId }
  );

  // Create proposal mutation
  const createMutation = useCreateProposalMutation(tenantId, {
    onSuccess: (data) => {
      console.log('✅ Proposal created successfully:', data.id);
      Alert.alert('Success', 'Treatment proposal created successfully');
      resetForm();
      router.back();
    },
    onError: (error) => {
      console.error('❌ Failed to create proposal:', error);
      Alert.alert('Error', error.message || 'Failed to create proposal. Please try again.');
    },
  });

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

    if (!episodeId) {
      Alert.alert('Error', 'Episode ID is missing');
      return;
    }

    if (!episode?.client_id) {
      Alert.alert('Error', 'Unable to determine client ID. Please try again.');
      return;
    }

    // Create proposal DTO - only include fields that have values
    const proposalData: any = {
      episode_id: episodeId,
      client_id: episode.client_id, // Add client_id from episode
      name: formData.name!,
      duration_days: formData.duration_days!,
    };

    // Add optional fields only if they have values
    if (formData.goals?.trim()) {
      proposalData.goals = formData.goals;
    }

    if (formData.modalities && formData.modalities.length > 0) {
      proposalData.modalities = formData.modalities;
    }

    if (formData.modalities_notes?.trim()) {
      proposalData.modalities_notes = formData.modalities_notes;
    }

    if (formData.contraindications?.trim()) {
      proposalData.contraindications = formData.contraindications;
    }

    if (formData.estimated_cost_min) {
      proposalData.estimated_cost_min = formData.estimated_cost_min;
    }

    if (formData.estimated_cost_max) {
      proposalData.estimated_cost_max = formData.estimated_cost_max;
    }

    if (formData.currency) {
      proposalData.currency = formData.currency;
    }

    console.log('📤 Submitting proposal:', proposalData);
    createMutation.mutate(proposalData);
  };

  // Handle add modality
  const handleAddModality = () => {
    const trimmed = modalityInput.trim();
    if (trimmed) {
      addModality(trimmed);
      setModalityInput('');
    }
  };

  if (isCheckingPermission || isLoadingEpisode) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background.default }]} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary.default} />
          <Text style={[styles.loadingText, { color: theme.colors.text.secondary }]}>
            {isLoadingEpisode ? 'Loading episode...' : 'Checking permissions...'}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!canCreateResult?.allowed) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background.default }]} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={theme.colors.text.primary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.colors.text.primary }]}>
            Propose Treatment Plan
          </Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={48} color={theme.colors.feedback.error} />
          <Text style={[styles.errorTitle, { color: theme.colors.text.primary }]}>
            Cannot Create Proposal
          </Text>
          <Text style={[styles.errorMessage, { color: theme.colors.text.secondary }]}>
            {canCreateResult?.reason || 'You do not have permission to create proposals for this episode.'}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background.default }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.colors.border.default }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.text.primary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.text.primary }]}>
          Propose Treatment Plan
        </Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Form */}
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Treatment Name */}
        <View style={{ marginBottom: theme.spacing.md }}>
          <Text style={[styles.label, { color: theme.colors.text.primary }]}>
            Treatment Name <Text style={{ color: theme.colors.feedback.error }}>*</Text>
          </Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: theme.colors.surface.default,
                borderColor: errors.name ? theme.colors.feedback.error : theme.colors.border.default,
                color: theme.colors.text.primary,
              },
            ]}
            placeholder="e.g., Panchakarma"
            placeholderTextColor={theme.colors.text.disabled}
            value={formData.name}
            onChangeText={(text) => updateField('name', text)}
            editable={!createMutation.isPending}
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
                backgroundColor: theme.colors.surface.default,
                borderColor: errors.duration_days ? theme.colors.feedback.error : theme.colors.border.default,
                color: theme.colors.text.primary,
              },
            ]}
            placeholder="e.g., 21"
            placeholderTextColor={theme.colors.text.disabled}
            value={formData.duration_days?.toString() || ''}
            onChangeText={(text) => {
              const num = parseInt(text, 10);
              updateField('duration_days', isNaN(num) ? 0 : num);
            }}
            keyboardType="number-pad"
            editable={!createMutation.isPending}
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
                  backgroundColor: theme.colors.surface.default,
                  borderColor: theme.colors.border.default,
                  color: theme.colors.text.primary,
                },
              ]}
              placeholder="e.g., Abhyanga"
              placeholderTextColor={theme.colors.text.disabled}
              value={modalityInput}
              onChangeText={setModalityInput}
              onSubmitEditing={handleAddModality}
              editable={!createMutation.isPending}
            />
            <TouchableOpacity
              style={[
                styles.addButton,
                { backgroundColor: theme.colors.primary.default },
              ]}
              onPress={handleAddModality}
              disabled={!modalityInput.trim() || createMutation.isPending}
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
                    disabled={createMutation.isPending}
                  >
                    <Ionicons name="close-circle" size={16} color={theme.colors.primary.default} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Goals */}
        <View style={{ marginBottom: theme.spacing.md }}>
          <Text style={[styles.label, { color: theme.colors.text.primary }]}>
            Expected Outcomes
          </Text>
          <TextInput
            style={[
              styles.input,
              styles.textArea,
              {
                backgroundColor: theme.colors.surface.default,
                borderColor: errors.goals ? theme.colors.feedback.error : theme.colors.border.default,
                color: theme.colors.text.primary,
              },
            ]}
            placeholder="Describe the expected outcomes..."
            placeholderTextColor={theme.colors.text.disabled}
            value={formData.goals}
            onChangeText={(text) => updateField('goals', text)}
            multiline
            numberOfLines={4}
            editable={!createMutation.isPending}
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
            Clinical Notes
          </Text>
          <TextInput
            style={[
              styles.input,
              styles.textArea,
              {
                backgroundColor: theme.colors.surface.default,
                borderColor: theme.colors.border.default,
                color: theme.colors.text.primary,
              },
            ]}
            placeholder="Any clinical notes or contraindications..."
            placeholderTextColor={theme.colors.text.disabled}
            value={formData.contraindications}
            onChangeText={(text) => updateField('contraindications', text)}
            multiline
            numberOfLines={3}
            editable={!createMutation.isPending}
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
                    backgroundColor: theme.colors.surface.default,
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
                editable={!createMutation.isPending}
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
                    backgroundColor: theme.colors.surface.default,
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
                editable={!createMutation.isPending}
              />
            </View>
          </View>
          {errors.estimated_cost_min && (
            <Text style={[styles.errorText, { color: theme.colors.feedback.error }]}>
              {errors.estimated_cost_min}
            </Text>
          )}
        </View>
      </ScrollView>

      {/* Footer */}
      <View style={[styles.footer, { borderTopColor: theme.colors.border.default, backgroundColor: theme.colors.surface.default }]}>
        <TouchableOpacity
          style={[
            styles.button,
            styles.cancelButton,
            { borderColor: theme.colors.border.default },
          ]}
          onPress={() => router.back()}
          disabled={createMutation.isPending}
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
              backgroundColor: createMutation.isPending
                ? theme.colors.interactive.disabled
                : theme.colors.primary.default,
            },
          ]}
          onPress={handleSubmit}
          disabled={createMutation.isPending}
        >
          {createMutation.isPending ? (
            <ActivityIndicator size="small" color={theme.colors.primary.onPrimary} />
          ) : (
            <Text style={[styles.buttonText, { color: theme.colors.primary.onPrimary }]}>
              Create Proposal
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorTitle: {
    marginTop: 16,
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
  },
  errorMessage: {
    marginTop: 8,
    fontSize: 14,
    textAlign: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
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
    padding: 16,
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
