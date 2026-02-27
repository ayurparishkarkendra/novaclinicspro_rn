/**
 * Proposal Edit Screen
 * Full-screen page for editing treatment proposals
 * 
 * Features:
 * - Pre-fills form with existing proposal data
 * - Includes version field in update request for optimistic locking
 * - Handles 409 conflict error (shows "Proposal was modified" message)
 * - Shows success toast on update
 * - Navigates back on success
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useClinicTheme } from '../../../../core/theme/useClinicTheme';
import { useAuth } from '../../../auth/presentation/hooks/useAuth';
import {
  useProposalDetailQuery,
  useUpdateProposalMutation,
} from '../../data/repositories/proposals.repository.impl';
import { ProposalUpdateDTO } from '../../data/models/treatmentProposals.dtos';

export const ProposalEditScreen: React.FC = () => {
  const { proposalId } = useLocalSearchParams<{ proposalId: string }>();
  const theme = useClinicTheme();
  const router = useRouter();
  const { currentUser } = useAuth();
  const tenantId = currentUser?.tenantId || '';

  // Form state
  const [name, setName] = useState('');
  const [durationDays, setDurationDays] = useState('');
  const [goals, setGoals] = useState('');
  const [contraindications, setContraindications] = useState('');
  const [estimatedCostMin, setEstimatedCostMin] = useState('');
  const [estimatedCostMax, setEstimatedCostMax] = useState('');
  const [version, setVersion] = useState(1);

  // Fetch proposal
  const {
    data: proposal,
    isLoading,
    isError,
    error,
  } = useProposalDetailQuery(tenantId, proposalId as string);

  // Pre-fill form when proposal loads
  useEffect(() => {
    if (proposal) {
      setName(proposal.treatment_type || proposal.name || '');
      setDurationDays(String(proposal.proposed_duration_days || proposal.duration_days || ''));
      setGoals(proposal.goals || '');
      setContraindications(proposal.contraindications || '');
      setEstimatedCostMin(proposal.estimated_cost_min ? String(proposal.estimated_cost_min) : '');
      setEstimatedCostMax(proposal.estimated_cost_max ? String(proposal.estimated_cost_max) : '');
      setVersion(proposal.version || 1);
    }
  }, [proposal]);

  // Update mutation
  const updateMutation = useUpdateProposalMutation(tenantId, proposalId as string, {
    onSuccess: () => {
      Alert.alert('Success', 'Proposal updated successfully', [
        {
          text: 'OK',
          onPress: () => router.back(),
        },
      ]);
    },
    onError: (error: any) => {
      if (error.message?.includes('modified by another user')) {
        Alert.alert(
          'Conflict',
          'This proposal was modified by another user. Please refresh and try again.',
          [
            { text: 'OK', style: 'cancel' },
          ]
        );
      } else {
        Alert.alert('Error', error.message || 'Failed to update proposal');
      }
    },
  });

  // Validation
  const validateForm = (): string | null => {
    if (!name.trim()) {
      return 'Treatment name is required';
    }
    if (!durationDays || parseInt(durationDays) <= 0) {
      return 'Duration must be greater than 0';
    }
    if (estimatedCostMin && estimatedCostMax) {
      const min = parseFloat(estimatedCostMin);
      const max = parseFloat(estimatedCostMax);
      if (min > max) {
        return 'Minimum cost cannot be greater than maximum cost';
      }
    }
    return null;
  };

  // Handlers
  const handleSave = () => {
    const validationError = validateForm();
    if (validationError) {
      Alert.alert('Validation Error', validationError);
      return;
    }

    const payload: ProposalUpdateDTO = {
      version,
      name: name.trim(),
      duration_days: parseInt(durationDays),
    };

    if (goals.trim()) {
      payload.goals = goals.trim();
    }

    if (contraindications.trim()) {
      payload.contraindications = contraindications.trim();
    }

    if (estimatedCostMin) {
      payload.estimated_cost_min = parseFloat(estimatedCostMin);
    }

    if (estimatedCostMax) {
      payload.estimated_cost_max = parseFloat(estimatedCostMax);
    }

    updateMutation.mutate(payload);
  };

  const handleCancel = () => {
    Alert.alert(
      'Discard Changes',
      'Are you sure you want to discard your changes?',
      [
        { text: 'Keep Editing', style: 'cancel' },
        {
          text: 'Discard',
          style: 'destructive',
          onPress: () => router.back(),
        },
      ]
    );
  };

  // Loading state
  if (isLoading) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: theme.colors.background.default }]}>
        <ActivityIndicator size="large" color={theme.colors.primary.default} />
        <Text style={[styles.centerText, { color: theme.colors.text.secondary }]}>
          Loading proposal...
        </Text>
      </View>
    );
  }

  // Error state
  if (isError || !proposal) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: theme.colors.background.default }]}>
        <Ionicons name="alert-circle-outline" size={64} color={theme.colors.feedback.error} />
        <Text style={[styles.centerText, { color: theme.colors.text.secondary }]}>
          {error?.message || 'Failed to load proposal'}
        </Text>
        <TouchableOpacity
          style={[styles.retryButton, { backgroundColor: theme.colors.primary.default }]}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Text style={[styles.retryButtonText, { color: theme.colors.background.default }]}>
            Go Back
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Check if proposal can be edited
  if (proposal.status !== 'PROPOSED') {
    return (
      <View style={[styles.centerContainer, { backgroundColor: theme.colors.background.default }]}>
        <Ionicons name="lock-closed-outline" size={64} color={theme.colors.text.tertiary} />
        <Text style={[styles.centerText, { color: theme.colors.text.secondary }]}>
          This proposal cannot be edited because it is {proposal.status.toLowerCase()}.
        </Text>
        <TouchableOpacity
          style={[styles.retryButton, { backgroundColor: theme.colors.primary.default }]}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Text style={[styles.retryButtonText, { color: theme.colors.background.default }]}>
            Go Back
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <View style={[styles.container, { backgroundColor: theme.colors.background.default }]}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: theme.colors.border.default }]}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={handleCancel}
            activeOpacity={0.7}
          >
            <Ionicons name="close" size={24} color={theme.colors.text.primary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.colors.text.primary }]}>
            Edit Proposal
          </Text>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={handleSave}
            activeOpacity={0.7}
            disabled={updateMutation.isPending}
          >
            {updateMutation.isPending ? (
              <ActivityIndicator size="small" color={theme.colors.primary.default} />
            ) : (
              <Text style={[styles.saveText, { color: theme.colors.primary.default }]}>
                Save
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Form */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.formContainer}
          keyboardShouldPersistTaps="handled"
        >
          {/* Treatment Name */}
          <View style={styles.fieldContainer}>
            <Text style={[styles.label, { color: theme.colors.text.primary }]}>
              Treatment Name <Text style={{ color: theme.colors.feedback.error }}>*</Text>
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: theme.colors.surface.elevated,
                  borderColor: theme.colors.border.default,
                  color: theme.colors.text.primary,
                },
              ]}
              value={name}
              onChangeText={setName}
              placeholder="e.g., Panchakarma"
              placeholderTextColor={theme.colors.text.tertiary}
              autoCapitalize="words"
            />
          </View>

          {/* Duration */}
          <View style={styles.fieldContainer}>
            <Text style={[styles.label, { color: theme.colors.text.primary }]}>
              Duration (days) <Text style={{ color: theme.colors.feedback.error }}>*</Text>
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: theme.colors.surface.elevated,
                  borderColor: theme.colors.border.default,
                  color: theme.colors.text.primary,
                },
              ]}
              value={durationDays}
              onChangeText={setDurationDays}
              placeholder="e.g., 21"
              placeholderTextColor={theme.colors.text.tertiary}
              keyboardType="number-pad"
            />
          </View>

          {/* Goals */}
          <View style={styles.fieldContainer}>
            <Text style={[styles.label, { color: theme.colors.text.primary }]}>
              Expected Outcomes
            </Text>
            <TextInput
              style={[
                styles.input,
                styles.textArea,
                {
                  backgroundColor: theme.colors.surface.elevated,
                  borderColor: theme.colors.border.default,
                  color: theme.colors.text.primary,
                },
              ]}
              value={goals}
              onChangeText={setGoals}
              placeholder="Describe the expected outcomes..."
              placeholderTextColor={theme.colors.text.tertiary}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          {/* Contraindications */}
          <View style={styles.fieldContainer}>
            <Text style={[styles.label, { color: theme.colors.text.primary }]}>
              Clinical Notes
            </Text>
            <TextInput
              style={[
                styles.input,
                styles.textArea,
                {
                  backgroundColor: theme.colors.surface.elevated,
                  borderColor: theme.colors.border.default,
                  color: theme.colors.text.primary,
                },
              ]}
              value={contraindications}
              onChangeText={setContraindications}
              placeholder="Any contraindications or prerequisites..."
              placeholderTextColor={theme.colors.text.tertiary}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          {/* Cost Range */}
          <View style={styles.fieldContainer}>
            <Text style={[styles.label, { color: theme.colors.text.primary }]}>
              Estimated Cost Range
            </Text>
            <View style={styles.costRow}>
              <View style={styles.costField}>
                <Text style={[styles.costLabel, { color: theme.colors.text.secondary }]}>
                  Min
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: theme.colors.surface.elevated,
                      borderColor: theme.colors.border.default,
                      color: theme.colors.text.primary,
                    },
                  ]}
                  value={estimatedCostMin}
                  onChangeText={setEstimatedCostMin}
                  placeholder="0"
                  placeholderTextColor={theme.colors.text.tertiary}
                  keyboardType="decimal-pad"
                />
              </View>
              <Text style={[styles.costSeparator, { color: theme.colors.text.secondary }]}>
                to
              </Text>
              <View style={styles.costField}>
                <Text style={[styles.costLabel, { color: theme.colors.text.secondary }]}>
                  Max
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: theme.colors.surface.elevated,
                      borderColor: theme.colors.border.default,
                      color: theme.colors.text.primary,
                    },
                  ]}
                  value={estimatedCostMax}
                  onChangeText={setEstimatedCostMax}
                  placeholder="0"
                  placeholderTextColor={theme.colors.text.tertiary}
                  keyboardType="decimal-pad"
                />
              </View>
            </View>
          </View>

          {/* Info Note */}
          <View style={[styles.infoBox, { backgroundColor: theme.colors.feedback.info + '10' }]}>
            <Ionicons name="information-circle" size={20} color={theme.colors.feedback.info} />
            <Text style={[styles.infoText, { color: theme.colors.text.secondary }]}>
              Only proposals in PROPOSED status can be edited. Once accepted or declined, they
              become read-only.
            </Text>
          </View>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  centerText: {
    fontSize: 14,
    marginTop: 12,
    textAlign: 'center',
  },
  retryButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginTop: 16,
  },
  retryButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerButton: {
    width: 60,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  saveText: {
    fontSize: 16,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  formContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  fieldContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
  },
  textArea: {
    minHeight: 100,
    paddingTop: 12,
  },
  costRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  costField: {
    flex: 1,
  },
  costLabel: {
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 6,
  },
  costSeparator: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: 20,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
    borderRadius: 10,
    gap: 10,
    marginTop: 8,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
});
