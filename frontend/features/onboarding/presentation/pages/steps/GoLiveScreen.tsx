/**
 * GoLiveScreen
 * Final step - Review setup and mark clinic as ready to go live
 */

import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { useClinicTheme } from '../../../../../core/theme/useClinicTheme';
import { useAuth } from '../../../../auth/presentation/hooks/useAuth';
import { useSubmitStepMutation, onboardingKeys, useCompleteSetupMutation } from '../../../data/repositories/onboarding.repository.impl';

interface GoLiveScreenProps {
  tenantId: string;
  onComplete: () => void;
  completedSteps: number;
  totalSteps: number;
  allSteps?: Array<{ code: string; name: string; status: string }>; // Add all steps for dynamic checklist
  isWizardMode?: boolean; // Hide internal button when in wizard mode
}

export function GoLiveScreen({ tenantId, onComplete, completedSteps, totalSteps, allSteps = [], isWizardMode = false }: GoLiveScreenProps) {
  const theme = useClinicTheme();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { refreshSession } = useAuth();
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const submitStepMutation = useSubmitStepMutation(tenantId, 'go_live_checklist');
  const completeSetupMutation = useCompleteSetupMutation(tenantId);

  // Generate checklist dynamically from all steps (excluding go_live_checklist itself)
  const checklistItems = allSteps
    .filter(step => step.code !== 'go_live_checklist')
    .map((step, index) => ({
      id: index + 1,
      label: step.name,
      completed: step.status === 'completed',
    }));

  const allComplete = checklistItems.every(item => item.completed);

  const handleGoLive = async () => {
    if (!agreedToTerms) {
      Alert.alert('Agreement Required', 'Please agree to the terms and conditions to proceed.');
      return;
    }

    if (!allComplete) {
      Alert.alert('Setup Incomplete', 'Please complete all previous steps before going live.');
      return;
    }

    try {
      console.log('[GoLiveScreen] Starting go-live process...');
      
      // First, mark the go_live_checklist step as complete
      console.log('[GoLiveScreen] Marking go_live_checklist step as complete...');
      await submitStepMutation.mutateAsync({
        data: { ready_to_go_live: true },
        mark_complete: true,
      });

      // Then, call the complete setup endpoint to finalize everything
      console.log('[GoLiveScreen] Calling complete setup endpoint...');
      await completeSetupMutation.mutateAsync();

      // Refresh auth session to get updated application_status
      console.log('[GoLiveScreen] Refreshing auth session to get updated status...');
      await refreshSession();

      // Invalidate all onboarding queries to refresh status
      await queryClient.invalidateQueries({ queryKey: onboardingKeys.all });
      await queryClient.invalidateQueries({ queryKey: onboardingKeys.status(tenantId) });

      console.log('[GoLiveScreen] Go-live process completed successfully!');
      
      // Navigate to clinic admin (router.replace prevents going back to wizard)
      Alert.alert(
        'Congratulations! 🎉',
        'Your clinic is now live and ready to accept patients!',
        [
          {
            text: 'Go to Dashboard',
            onPress: () => {
              router.replace('/clinic-admin');
            },
          },
        ]
      );
    } catch (error: any) {
      console.error('[GoLiveScreen] Error during go-live:', error);
      Alert.alert('Error', error.message || 'Failed to mark clinic as live. Please try again.');
    }
  };

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: theme.spacing.lg }}>
      {/* Header */}
      <View style={{ alignItems: 'center', marginBottom: theme.spacing.xl }}>
        <View
          style={{
            width: 80,
            height: 80,
            borderRadius: 40,
            backgroundColor: theme.colors.feedback.successLight,
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: theme.spacing.md,
          }}
        >
          <Ionicons name="rocket" size={40} color={theme.colors.feedback.success} />
        </View>
        <Text style={[theme.typography.h4, { color: theme.colors.text.primary, textAlign: 'center' }]}>
          Ready to Go Live!
        </Text>
        <Text style={[theme.typography.body1, { color: theme.colors.text.secondary, textAlign: 'center', marginTop: theme.spacing.sm }]}>
          You've completed {completedSteps} of {totalSteps} setup steps
        </Text>
      </View>

      {/* Setup Summary */}
      <View
        style={{
          backgroundColor: theme.colors.surface.default,
          borderRadius: 12,
          padding: theme.spacing.lg,
          marginBottom: theme.spacing.lg,
        }}
      >
        <Text style={[theme.typography.h6, { color: theme.colors.text.primary, marginBottom: theme.spacing.md }]}>
          Setup Checklist
        </Text>

        {checklistItems.map((item) => (
          <View
            key={item.id}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingVertical: theme.spacing.sm,
              borderBottomWidth: 1,
              borderBottomColor: theme.colors.border.default,
            }}
          >
            <Ionicons
              name={item.completed ? 'checkmark-circle' : 'ellipse-outline'}
              size={24}
              color={item.completed ? theme.colors.feedback.success : theme.colors.text.disabled}
            />
            <Text
              style={[
                theme.typography.body2,
                {
                  color: item.completed ? theme.colors.text.primary : theme.colors.text.disabled,
                  marginLeft: theme.spacing.sm,
                  flex: 1,
                },
              ]}
            >
              {item.label}
            </Text>
          </View>
        ))}
      </View>

      {/* Terms Agreement */}
      <TouchableOpacity
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          padding: theme.spacing.md,
          backgroundColor: theme.colors.surface.default,
          borderRadius: 8,
          marginBottom: theme.spacing.lg,
        }}
        onPress={() => setAgreedToTerms(!agreedToTerms)}
      >
        <Ionicons
          name={agreedToTerms ? 'checkbox' : 'square-outline'}
          size={24}
          color={agreedToTerms ? theme.colors.primary.default : theme.colors.text.secondary}
        />
        <Text style={[theme.typography.body2, { color: theme.colors.text.primary, marginLeft: theme.spacing.sm, flex: 1 }]}>
          I confirm that all information is accurate and I'm ready to start accepting patients
        </Text>
      </TouchableOpacity>

      {/* Info Box */}
      <View
        style={{
          backgroundColor: theme.colors.feedback.infoLight,
          padding: theme.spacing.md,
          borderRadius: 8,
          flexDirection: 'row',
          marginBottom: theme.spacing.xl,
        }}
      >
        <Ionicons name="information-circle" size={20} color={theme.colors.feedback.info} />
        <Text style={[theme.typography.body2, { color: theme.colors.text.primary, marginLeft: theme.spacing.sm, flex: 1 }]}>
          Once you go live, your clinic will be visible to patients and you can start scheduling appointments.
        </Text>
      </View>

      {/* Go Live Button - Only show in standalone mode, not in wizard */}
      {!isWizardMode && (
        <TouchableOpacity
          style={{
            backgroundColor: allComplete && agreedToTerms ? theme.colors.feedback.success : theme.colors.surface.elevated,
            padding: theme.spacing.md,
            borderRadius: 8,
            alignItems: 'center',
            opacity: allComplete && agreedToTerms ? 1 : 0.5,
          }}
          onPress={handleGoLive}
          disabled={!allComplete || !agreedToTerms || submitStepMutation.isPending || completeSetupMutation.isPending}
        >
          <Text style={[theme.typography.button, { color: theme.colors.text.onPrimary }]}>
            {submitStepMutation.isPending || completeSetupMutation.isPending ? 'Processing...' : 'Go Live Now! 🚀'}
          </Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  // Styles set inline with theme
});
