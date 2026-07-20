/**
 * StepCard Component
 * Displays either a legacy onboarding step or a prepared Journey Card model.
 */

import React, { useMemo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useClinicTheme, ClinicTheme } from '../../../../core/theme/useClinicTheme';
import { useTranslation } from '../../../../core/localization/useTranslation';
import { getPreparationStepDisplayName } from '../../constants/stepAliases';
import { JourneyCardModel, JourneyCardStatus } from '../../domain/entities/journey.entity';
import { StepStatus, StepStatusType } from '../../domain/entities/onboarding-status.entity';

type StepCardProps =
  | {
      step: StepStatus;
      journeyCard?: never;
      onPress: () => void;
    }
  | {
      step?: never;
      journeyCard: JourneyCardModel;
      onPress: () => void;
    };

type DisplayStatus = JourneyCardStatus | StepStatusType;

const STATUS_KEYS: Record<DisplayStatus, string> = {
  complete: 'onboarding.progressiveExperience.journeyCard.status.complete',
  completed: 'onboarding.progressiveExperience.journeyCard.status.complete',
  in_progress: 'onboarding.progressiveExperience.journeyCard.status.inProgress',
  not_started: 'onboarding.progressiveExperience.journeyCard.status.notStarted',
  blocked: 'onboarding.progressiveExperience.journeyCard.status.blocked',
  unavailable: 'onboarding.progressiveExperience.journeyCard.status.unavailable',
};

const getStatusIcon = (status: DisplayStatus): keyof typeof Ionicons.glyphMap => {
  switch (status) {
    case 'complete':
    case 'completed':
      return 'checkmark-circle';
    case 'in_progress':
      return 'time';
    case 'blocked':
      return 'lock-closed';
    case 'unavailable':
      return 'remove-circle-outline';
    case 'not_started':
    default:
      return 'ellipse-outline';
  }
};

const getStatusColor = (status: DisplayStatus, theme: ClinicTheme): string => {
  switch (status) {
    case 'complete':
    case 'completed':
      return theme.colors.feedback.success;
    case 'in_progress':
      return theme.colors.feedback.warning;
    case 'blocked':
      return theme.colors.feedback.error;
    case 'unavailable':
    case 'not_started':
    default:
      return theme.colors.text.disabled;
  }
};

export const StepCard: React.FC<StepCardProps> = ({ step, journeyCard, onPress }) => {
  const theme = useClinicTheme();
  const { t } = useTranslation();
  const status = journeyCard ? journeyCard.status : step!.status;
  const isActionable = journeyCard ? journeyCard.isActionable : step!.isActionable;
  const statusColor = getStatusColor(status, theme);
  const styles = useMemo(
    () => createStyles(theme, statusColor),
    [theme, statusColor]
  );

  const title = journeyCard
    ? t(journeyCard.titleKey)
    : getPreparationStepDisplayName(step!.code, t);
  const description = journeyCard ? t(journeyCard.descriptionKey) : undefined;
  const actionLabel = journeyCard ? t(journeyCard.actionLabelKey) : undefined;
  const statusLabel = t(STATUS_KEYS[status]);
  const accessibilityHint = journeyCard
    ? `${description}. ${actionLabel}`
    : undefined;

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      disabled={!isActionable}
      accessible
      accessibilityRole="button"
      accessibilityLabel={`${title}. ${statusLabel}`}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: !isActionable }}
    >
      <View style={styles.header}>
        <Ionicons
          name={(journeyCard ? journeyCard.iconToken : step!.icon) as keyof typeof Ionicons.glyphMap}
          size={theme.spacing.lg}
          color={theme.colors.primary.default}
        />
        <View style={styles.content}>
          <Text style={styles.title}>{title}</Text>
          {description && <Text style={styles.description}>{description}</Text>}
          <View style={styles.statusRow}>
            <Ionicons
              name={getStatusIcon(status)}
              size={theme.spacing.md}
              color={statusColor}
            />
            <Text style={styles.status}>{statusLabel}</Text>
          </View>
          {actionLabel && <Text style={styles.action}>{actionLabel}</Text>}
        </View>
      </View>

      {step?.issues.length ? (
        <View style={styles.issues}>
          {step.issues.map((issue) => (
            <Text key={issue.errorKey} style={styles.issueText}>
              • {issue.message}
            </Text>
          ))}
        </View>
      ) : null}

      {step?.blockedReason ? (
        <View style={styles.blockedBanner}>
          <Text style={styles.blockedText}>{step.blockedReason}</Text>
        </View>
      ) : null}
    </TouchableOpacity>
  );
};

const createStyles = (theme: ClinicTheme, statusColor: string) =>
  StyleSheet.create({
    card: {
      minHeight: theme.spacing.xxl,
      backgroundColor: theme.colors.surface.default,
      borderColor: theme.colors.border.default,
      borderWidth: StyleSheet.hairlineWidth,
      borderRadius: theme.spacing.sm,
      padding: theme.spacing.md,
      marginBottom: theme.spacing.sm,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'flex-start',
    },
    content: {
      flex: 1,
      marginLeft: theme.spacing.md,
    },
    title: {
      ...theme.typography.h6,
      color: theme.colors.text.primary,
    },
    description: {
      ...theme.typography.body2,
      color: theme.colors.text.secondary,
      marginTop: theme.spacing.xs,
    },
    statusRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: theme.spacing.xs,
    },
    status: {
      ...theme.typography.caption,
      color: statusColor,
      marginLeft: theme.spacing.xs,
    },
    action: {
      ...theme.typography.button,
      color: theme.colors.text.link,
      marginTop: theme.spacing.sm,
    },
    issues: {
      marginTop: theme.spacing.sm,
    },
    issueText: {
      ...theme.typography.caption,
      color: theme.colors.feedback.error,
    },
    blockedBanner: {
      backgroundColor: theme.colors.feedback.errorLight,
      padding: theme.spacing.sm,
      marginTop: theme.spacing.sm,
      borderRadius: theme.spacing.xs,
    },
    blockedText: {
      ...theme.typography.caption,
      color: theme.colors.feedback.error,
    },
  });
