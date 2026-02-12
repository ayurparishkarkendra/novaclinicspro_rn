/**
 * Bulk Upload Step Layout Component
 * Reusable layout for the multi-step bulk upload flow
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../../core/theme/colors';
import { spacing } from '../../../../core/theme/spacing';
import { typography } from '../../../../core/theme/typography';

interface Step {
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
}

interface BulkUploadStepLayoutProps {
  steps: Step[];
  currentStep: number;
  children: React.ReactNode;
}

export const BulkUploadStepLayout: React.FC<BulkUploadStepLayoutProps> = ({
  steps,
  currentStep,
  children,
}) => {
  return (
    <View style={styles.container}>
      {/* Progress Steps */}
      <View style={styles.stepsContainer}>
        {steps.map((step, index) => {
          const isCompleted = index < currentStep;
          const isCurrent = index === currentStep;
          const isUpcoming = index > currentStep;

          return (
            <React.Fragment key={index}>
              {/* Step */}
              <View style={styles.stepWrapper}>
                <View
                  style={[
                    styles.stepCircle,
                    isCompleted && styles.stepCircleCompleted,
                    isCurrent && styles.stepCircleCurrent,
                    isUpcoming && styles.stepCircleUpcoming,
                  ]}
                >
                  {isCompleted ? (
                    <Ionicons name="checkmark" size={16} color={colors.text.light} />
                  ) : (
                    <Ionicons
                      name={step.icon}
                      size={16}
                      color={
                        isCurrent
                          ? colors.primary.main
                          : colors.text.tertiary
                      }
                    />
                  )}
                </View>
                <Text
                  style={[
                    styles.stepLabel,
                    isCompleted && styles.stepLabelCompleted,
                    isCurrent && styles.stepLabelCurrent,
                  ]}
                  numberOfLines={1}
                >
                  {step.title}
                </Text>
              </View>

              {/* Connector */}
              {index < steps.length - 1 && (
                <View
                  style={[
                    styles.connector,
                    isCompleted && styles.connectorCompleted,
                  ]}
                />
              )}
            </React.Fragment>
          );
        })}
      </View>

      {/* Content */}
      <View style={styles.content}>{children}</View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  stepsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    backgroundColor: colors.background.default,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  stepWrapper: {
    alignItems: 'center',
    maxWidth: 70,
  },
  stepCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.grey[100],
    borderWidth: 2,
    borderColor: colors.grey[200],
  },
  stepCircleCompleted: {
    backgroundColor: colors.success.main,
    borderColor: colors.success.main,
  },
  stepCircleCurrent: {
    backgroundColor: colors.primary.main + '15',
    borderColor: colors.primary.main,
  },
  stepCircleUpcoming: {
    backgroundColor: colors.grey[100],
    borderColor: colors.grey[200],
  },
  stepLabel: {
    ...typography.caption,
    color: colors.text.tertiary,
    marginTop: 4,
    textAlign: 'center',
  },
  stepLabelCompleted: {
    color: colors.success.main,
  },
  stepLabelCurrent: {
    color: colors.primary.main,
    fontWeight: '600',
  },
  connector: {
    flex: 1,
    height: 2,
    backgroundColor: colors.grey[200],
    marginHorizontal: spacing.xs,
    marginTop: -16,
  },
  connectorCompleted: {
    backgroundColor: colors.success.main,
  },
  content: {
    flex: 1,
  },
});
