/**
 * StepCard Component
 * Displays a single onboarding step with status and validation
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useClinicTheme } from '../../../../core/theme/useClinicTheme';
import { StepStatus } from '../../domain/entities/onboarding-status.entity';

interface StepCardProps {
  step: StepStatus;
  onPress: () => void;
}

export const StepCard: React.FC<StepCardProps> = ({ step, onPress }) => {
  const theme = useClinicTheme();

  const getStatusColor = () => {
    switch (step.status) {
      case 'completed':
        return theme.colors.feedback.success;
      case 'in_progress':
        return theme.colors.feedback.warning;
      case 'blocked':
        return theme.colors.feedback.error;
      default:
        return theme.colors.text.disabled;
    }
  };

  const getStatusIcon = () => {
    switch (step.status) {
      case 'completed':
        return 'checkmark-circle';
      case 'in_progress':
        return 'time';
      case 'blocked':
        return 'lock-closed';
      default:
        return 'ellipse-outline';
    }
  };

  const getStepTitle = () => {
    return step.code
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (l) => l.toUpperCase());
  };

  return (
    <TouchableOpacity
      style={[
        styles.card,
        {
          backgroundColor: theme.colors.surface.default,
          borderColor: theme.colors.border.default,
          padding: theme.spacing.md,
          marginBottom: theme.spacing.sm,
          borderRadius: 8,
          borderWidth: 1,
          opacity: step.isActionable ? 1 : 0.6,
        },
      ]}
      onPress={onPress}
      disabled={!step.isActionable}
    >
      <View style={styles.header}>
        <Ionicons
          name={step.icon as any}
          size={24}
          color={theme.colors.primary.default}
        />
        <View style={[styles.content, { marginLeft: theme.spacing.md }]}>
          <Text
            style={[
              theme.typography.h6,
              { color: theme.colors.text.primary },
            ]}
          >
            {getStepTitle()}
          </Text>
          <View style={[styles.statusRow, { marginTop: theme.spacing.xs }]}>
            <Ionicons
              name={getStatusIcon()}
              size={16}
              color={getStatusColor()}
            />
            <Text
              style={[
                theme.typography.caption,
                {
                  color: getStatusColor(),
                  marginLeft: 4,
                },
              ]}
            >
              {step.status.replace('_', ' ').toUpperCase()}
            </Text>
          </View>
        </View>
      </View>

      {step.issues.length > 0 && (
        <View style={[styles.issues, { marginTop: theme.spacing.sm }]}>
          {step.issues.map((issue, index) => (
            <Text
              key={index}
              style={[
                theme.typography.caption,
                { color: theme.colors.feedback.error },
              ]}
            >
              • {issue.message}
            </Text>
          ))}
        </View>
      )}

      {step.blockedReason && (
        <View
          style={[
            styles.blockedBanner,
            {
              backgroundColor: theme.colors.feedback.errorLight,
              padding: theme.spacing.sm,
              marginTop: theme.spacing.sm,
              borderRadius: 4,
            },
          ]}
        >
          <Text
            style={[
              theme.typography.caption,
              { color: theme.colors.feedback.error },
            ]}
          >
            {step.blockedReason}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    // Styles set inline with theme
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  issues: {
    // Styles set inline with theme
  },
  blockedBanner: {
    // Styles set inline with theme
  },
});
