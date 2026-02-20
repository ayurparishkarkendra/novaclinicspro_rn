/**
 * WizardStepper
 * Visual stepper component showing all steps with progress
 */

import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useClinicTheme } from '../../../../core/theme/useClinicTheme';

interface Step {
  code: string;
  name: string;
  status: 'completed' | 'in_progress' | 'not_started' | 'blocked';
  order: number;
}

interface WizardStepperProps {
  steps: Step[];
  currentStepIndex: number;
}

export function WizardStepper({ steps, currentStepIndex }: WizardStepperProps) {
  const theme = useClinicTheme();

  const getStepIcon = (index: number, status: string) => {
    if (status === 'completed') return 'checkmark-circle';
    if (index === currentStepIndex) return 'radio-button-on';
    if (status === 'blocked') return 'lock-closed';
    return 'ellipse-outline';
  };

  const getStepColor = (index: number, status: string) => {
    if (status === 'completed') return theme.colors.feedback.success;
    if (index === currentStepIndex) return theme.colors.primary.default;
    if (status === 'blocked') return theme.colors.text.disabled;
    return theme.colors.text.secondary;
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.surface.default, padding: theme.spacing.lg }]}>
      {/* Progress Bar */}
      <View style={[styles.progressBarContainer, { backgroundColor: theme.colors.border.default, height: 4, borderRadius: 2, marginBottom: theme.spacing.lg }]}>
        <View
          style={[
            styles.progressBar,
            {
              backgroundColor: theme.colors.primary.default,
              width: `${((currentStepIndex + 1) / steps.length) * 100}%`,
              height: 4,
              borderRadius: 2,
            },
          ]}
        />
      </View>

      {/* Step Counter - Show before scrollable steps */}
      <Text
        style={[
          theme.typography.body2,
          {
            color: theme.colors.text.secondary,
            textAlign: 'center',
            marginBottom: theme.spacing.md,
          },
        ]}
      >
        Step {currentStepIndex + 1} of {steps.length}
      </Text>

      {/* Step Indicators - Horizontal Scroll */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: theme.spacing.sm }}
      >
        <View style={[styles.stepsContainer, { flexDirection: 'row', alignItems: 'flex-start' }]}>
          {steps.map((step, index) => {
            const isCurrent = index === currentStepIndex;
            const isPast = index < currentStepIndex;
            const stepColor = getStepColor(index, step.status);

            return (
              <View key={step.code} style={[styles.stepItem, { alignItems: 'center', marginHorizontal: theme.spacing.xs }]}>
                {/* Step Number/Icon */}
                <View
                  style={[
                    styles.stepCircle,
                    {
                      width: 36,
                      height: 36,
                      borderRadius: 18,
                      backgroundColor: isCurrent ? theme.colors.primary.default : isPast ? theme.colors.feedback.success : theme.colors.surface.elevated,
                      borderWidth: 2,
                      borderColor: stepColor,
                      justifyContent: 'center',
                      alignItems: 'center',
                      marginBottom: theme.spacing.xs,
                    },
                  ]}
                >
                  {step.status === 'completed' || isPast ? (
                    <Ionicons name="checkmark" size={20} color={theme.colors.text.onPrimary} />
                  ) : (
                    <Text
                      style={[
                        theme.typography.caption,
                        {
                          color: isCurrent ? theme.colors.text.onPrimary : stepColor,
                          fontWeight: '600',
                        },
                      ]}
                    >
                      {index + 1}
                    </Text>
                  )}
                </View>

                {/* Step Name */}
                <Text
                  style={[
                    theme.typography.caption,
                    {
                      color: isCurrent ? theme.colors.text.primary : theme.colors.text.secondary,
                      fontWeight: isCurrent ? '600' : '400',
                      textAlign: 'center',
                      width: 70,
                      fontSize: 10,
                    },
                  ]}
                  numberOfLines={2}
                >
                  {step.name}
                </Text>

                {/* Connector Line */}
                {index < steps.length - 1 && (
                  <View
                    style={[
                      styles.connector,
                      {
                        position: 'absolute',
                        top: 18,
                        left: 36,
                        width: 20,
                        height: 2,
                        backgroundColor: isPast ? theme.colors.feedback.success : theme.colors.border.default,
                        zIndex: -1,
                      },
                    ]}
                  />
                )}
              </View>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    // Styles set inline with theme
  },
  progressBarContainer: {
    // Styles set inline with theme
  },
  progressBar: {
    // Styles set inline with theme
  },
  stepsContainer: {
    // Styles set inline with theme
  },
  stepItem: {
    position: 'relative',
  },
  stepCircle: {
    // Styles set inline with theme
  },
  connector: {
    // Styles set inline with theme
  },
});
