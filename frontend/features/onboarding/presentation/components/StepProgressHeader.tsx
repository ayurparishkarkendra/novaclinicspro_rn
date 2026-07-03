/**
 * StepProgressHeader
 * Shows progress through setup steps with navigation
 */

import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useClinicTheme } from '../../../../core/theme/useClinicTheme';

interface Step {
  code: string;
  name: string;
  status: 'completed' | 'in_progress' | 'not_started' | 'blocked';
  order: number;
}

interface StepProgressHeaderProps {
  steps: Step[];
  currentStepCode: string;
  tenantId: string;
}

export function StepProgressHeader({ steps, currentStepCode, tenantId }: StepProgressHeaderProps) {
  const theme = useClinicTheme();
  const router = useRouter();

  const sortedSteps = [...steps].sort((a, b) => a.order - b.order);
  const currentIndex = sortedSteps.findIndex(s => s.code === currentStepCode);

  const handleStepPress = (stepCode: string, status: string) => {
    if (status === 'blocked') return;
    router.push(`/onboarding/step-detail?tenantId=${tenantId}&stepCode=${stepCode}`);
  };

  const handleBack = () => {
    if (currentIndex > 0) {
      const prevStep = sortedSteps[currentIndex - 1];
      router.push(`/onboarding/step-detail?tenantId=${tenantId}&stepCode=${prevStep.code}`);
    } else {
      router.push(`/onboarding/setup-wizard?tenantId=${tenantId}`);
    }
  };

  const handleNext = () => {
    if (currentIndex < sortedSteps.length - 1) {
      const nextStep = sortedSteps[currentIndex + 1];
      if (nextStep.status !== 'blocked') {
        router.push(`/onboarding/step-detail?tenantId=${tenantId}&stepCode=${nextStep.code}`);
      }
    }
  };

  const getStepIcon = (status: string, isCurrent: boolean) => {
    if (status === 'completed') return 'checkmark-circle';
    if (isCurrent) return 'radio-button-on';
    if (status === 'blocked') return 'lock-closed';
    return 'radio-button-off';
  };

  const getStepColor = (status: string, isCurrent: boolean) => {
    if (status === 'completed') return theme.colors.feedback.success;
    if (isCurrent) return theme.colors.primary.default;
    if (status === 'blocked') return theme.colors.text.disabled;
    return theme.colors.text.secondary;
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.surface.default, borderBottomWidth: 1, borderBottomColor: theme.colors.border.default }]}>
      {/* Navigation Buttons */}
      <View style={[styles.navRow, { paddingHorizontal: theme.spacing.md, paddingVertical: theme.spacing.sm }]}>
        <TouchableOpacity
          style={[styles.navButton, { flexDirection: 'row', alignItems: 'center' }]}
          onPress={handleBack}
        >
          <Ionicons name="chevron-back" size={20} color={theme.colors.primary.default} />
          <Text style={[theme.typography.body2, { color: theme.colors.primary.default, marginLeft: 4 }]}>
            {currentIndex > 0 ? 'Previous' : 'Back to Preparation'}
          </Text>
        </TouchableOpacity>

        <Text style={[theme.typography.caption, { color: theme.colors.text.secondary }]}>
          Step {currentIndex + 1} of {sortedSteps.length}
        </Text>

        {currentIndex < sortedSteps.length - 1 && sortedSteps[currentIndex + 1].status !== 'blocked' && (
          <TouchableOpacity
            style={[styles.navButton, { flexDirection: 'row', alignItems: 'center' }]}
            onPress={handleNext}
          >
            <Text style={[theme.typography.body2, { color: theme.colors.primary.default, marginRight: 4 }]}>
              Next
            </Text>
            <Ionicons name="chevron-forward" size={20} color={theme.colors.primary.default} />
          </TouchableOpacity>
        )}
        {(currentIndex >= sortedSteps.length - 1 || sortedSteps[currentIndex + 1].status === 'blocked') && (
          <View style={{ width: 60 }} />
        )}
      </View>

      {/* Step Progress */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: theme.spacing.md, paddingBottom: theme.spacing.sm }}
      >
        {sortedSteps.map((step, index) => {
          const isCurrent = step.code === currentStepCode;
          const isClickable = step.status !== 'blocked';
          const stepColor = getStepColor(step.status, isCurrent);

          return (
            <View key={step.code} style={{ flexDirection: 'row', alignItems: 'center' }}>
              <TouchableOpacity
                style={[
                  styles.stepItem,
                  {
                    alignItems: 'center',
                    paddingHorizontal: theme.spacing.sm,
                    opacity: isClickable ? 1 : 0.5,
                  },
                ]}
                onPress={() => handleStepPress(step.code, step.status)}
                disabled={!isClickable}
              >
                <Ionicons
                  name={getStepIcon(step.status, isCurrent)}
                  size={24}
                  color={stepColor}
                />
                <Text
                  style={[
                    theme.typography.caption,
                    {
                      color: stepColor,
                      marginTop: 4,
                      fontWeight: isCurrent ? '600' : '400',
                      maxWidth: 80,
                      textAlign: 'center',
                    },
                  ]}
                  numberOfLines={2}
                >
                  {step.name}
                </Text>
              </TouchableOpacity>

              {index < sortedSteps.length - 1 && (
                <View
                  style={[
                    styles.connector,
                    {
                      width: 20,
                      height: 2,
                      backgroundColor: step.status === 'completed' ? theme.colors.feedback.success : theme.colors.border.default,
                      marginHorizontal: 4,
                    },
                  ]}
                />
              )}
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    // Styles set inline with theme
  },
  navRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  navButton: {
    minWidth: 60,
  },
  stepItem: {
    // Styles set inline with theme
  },
  connector: {
    // Styles set inline with theme
  },
});
