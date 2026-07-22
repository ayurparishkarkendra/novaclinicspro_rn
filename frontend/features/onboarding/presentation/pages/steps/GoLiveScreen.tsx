import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  ActivityIndicator,
  findNodeHandle,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { hasTranslation } from '../../../../../core/localization/i18n';
import { useTranslation } from '../../../../../core/localization/useTranslation';
import { ClinicTheme, useClinicTheme } from '../../../../../core/theme/useClinicTheme';
import {
  ChecklistItem,
  NextAction,
  ReadinessState,
  ReadyToStartError,
} from '../../../domain/entities/ready-to-start.entity';
import { ErrorScreen } from '../../components/ErrorScreen';
import { LoadingScreen } from '../../components/LoadingScreen';
import { useReadyToStart } from '../../hooks/useReadyToStart';

interface GoLiveScreenProps {
  tenantId: string;
  onComplete: () => void;
  onNavigateToSetupStep?: (stepCode: string) => void | Promise<void>;
  onOpenWorkspacePreparation?: () => void | Promise<void>;
}

const stateIcon: Record<ReadinessState, React.ComponentProps<typeof Ionicons>['name']> = {
  READY: 'checkmark-circle',
  NOT_READY: 'alert-circle',
  EVALUATING: 'time',
  UNKNOWN: 'help-circle',
  UNAVAILABLE: 'cloud-offline',
  STALE: 'refresh-circle',
};

const statusIcon: Record<ChecklistItem['status'], React.ComponentProps<typeof Ionicons>['name']> = {
  COMPLETE: 'checkmark-circle',
  BLOCKED: 'alert-circle',
  ADVISORY: 'information-circle',
  EVALUATING: 'time',
  UNKNOWN: 'help-circle',
  UNAVAILABLE: 'cloud-offline',
  STALE: 'refresh-circle',
};

const errorKey = (error: unknown): string => {
  if (!(error instanceof ReadyToStartError)) {
    return 'onboarding.progressiveExperience.readyToStart.presentation.errors.generic';
  }
  return {
    UNAUTHORIZED: 'onboarding.progressiveExperience.readyToStart.presentation.errors.unauthorized',
    FORBIDDEN: 'onboarding.progressiveExperience.readyToStart.presentation.errors.forbidden',
    TENANT_MISMATCH: 'onboarding.progressiveExperience.readyToStart.presentation.errors.tenantMismatch',
    ORGANIZATION_MISMATCH: 'onboarding.progressiveExperience.readyToStart.presentation.errors.organizationMismatch',
    UNSUPPORTED_CONTRACT: 'onboarding.progressiveExperience.readyToStart.presentation.errors.unsupportedContract',
    STALE_PROJECTION: 'onboarding.progressiveExperience.readyToStart.presentation.errors.stale',
    READINESS_UNAVAILABLE: 'onboarding.progressiveExperience.readyToStart.presentation.errors.unavailable',
    INVALID_AGGREGATE: 'onboarding.progressiveExperience.readyToStart.presentation.errors.invalidAggregate',
    BACKEND_FAILURE: 'onboarding.progressiveExperience.readyToStart.presentation.errors.generic',
  }[error.kind];
};

export function GoLiveScreen({
  tenantId,
  onComplete,
  onNavigateToSetupStep,
  onOpenWorkspacePreparation,
}: GoLiveScreenProps) {
  const theme = useClinicTheme();
  const { t } = useTranslation();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const readiness = useReadyToStart(tenantId);
  const readinessState = readiness.data?.state;
  const summaryRef = useRef<View>(null);
  const actionInFlight = useRef(false);
  const [activeActionId, setActiveActionId] = useState<string | null>(null);

  const safeTranslation = useCallback(
    (token: string, fallback = 'onboarding.progressiveExperience.readyToStart.presentation.unavailableExplanation') =>
      hasTranslation(token) ? t(token) : t(fallback),
    [t]
  );

  useEffect(() => {
    if (!readinessState) return;
    const node = summaryRef.current ? findNodeHandle(summaryRef.current) : null;
    if (node) AccessibilityInfo.setAccessibilityFocus(node);
    AccessibilityInfo.announceForAccessibility(
      t(`onboarding.progressiveExperience.readyToStart.presentation.states.${readinessState}`)
    );
  }, [readinessState, t]);

  useEffect(() => {
    if (!readiness.refreshing) return;
    AccessibilityInfo.announceForAccessibility(
      t('onboarding.progressiveExperience.readyToStart.presentation.refreshing')
    );
  }, [readiness.refreshing, t]);

  const actionSupported = useCallback(
    (action: NextAction): boolean => {
      if (!readiness.scopeMatches || !hasTranslation(action.labelToken)) return false;
      if (action.kind === 'REFRESH') {
        return action.ownerId === 'ready_to_start' && action.actionId === 'readiness.refresh';
      }
      if (action.kind !== 'NAVIGATE') return false;
      if (
        action.ownerId === 'setup_wizard' &&
        action.actionId === 'readiness.navigate_setup_step' &&
        action.targetId?.startsWith('setup_step.')
      ) return Boolean(onNavigateToSetupStep);
      return Boolean(
        action.ownerId === 'workspace_preparation' &&
          action.actionId === 'readiness.open_workspace_preparation' &&
          action.targetId === 'onboarding.workspace_preparation' &&
          onOpenWorkspacePreparation
      );
    },
    [onNavigateToSetupStep, onOpenWorkspacePreparation, readiness.scopeMatches]
  );

  const runAction = useCallback(
    async (action: NextAction) => {
      if (actionInFlight.current || !actionSupported(action)) return;
      actionInFlight.current = true;
      setActiveActionId(action.actionId);
      try {
        if (!(await readiness.revalidateTenant())) return;
        if (action.kind === 'REFRESH') {
          await readiness.refresh();
        } else if (action.ownerId === 'setup_wizard' && action.targetId) {
          await onNavigateToSetupStep?.(action.targetId.slice('setup_step.'.length));
        } else if (action.ownerId === 'workspace_preparation') {
          await onOpenWorkspacePreparation?.();
        }
      } finally {
        actionInFlight.current = false;
        setActiveActionId(null);
      }
    },
    [actionSupported, onNavigateToSetupStep, onOpenWorkspacePreparation, readiness]
  );

  const handleHandoff = useCallback(async () => {
    if (
      actionInFlight.current ||
      !readiness.data?.authorizesHandoff ||
      readiness.data.state !== 'READY'
    ) return;
    actionInFlight.current = true;
    setActiveActionId('readiness.handoff');
    try {
      if (await readiness.revalidateTenant()) onComplete();
    } finally {
      actionInFlight.current = false;
      setActiveActionId(null);
    }
  }, [onComplete, readiness]);

  if (readiness.loading) {
    return (
      <LoadingScreen
        message={t('onboarding.progressiveExperience.readyToStart.presentation.loading')}
      />
    );
  }

  if (readiness.error || !readiness.data) {
    return (
      <ErrorScreen
        title={t('onboarding.progressiveExperience.readyToStart.presentation.errorTitle')}
        message={t(errorKey(readiness.error))}
        retryLabel={t('onboarding.progressiveExperience.readyToStart.presentation.actions.retryQuery')}
        onRetry={() => void readiness.refresh()}
      />
    );
  }

  const aggregate = readiness.data;
  const stateLabel = t(
    `onboarding.progressiveExperience.readyToStart.presentation.states.${aggregate.state}`
  );
  const stateColor = aggregate.state === 'READY'
    ? theme.colors.feedback.success
    : aggregate.state === 'NOT_READY'
      ? theme.colors.feedback.warning
      : theme.colors.feedback.info;

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      accessibilityLabel={t('onboarding.progressiveExperience.readyToStart.presentation.screenLabel')}
      accessibilityState={{ busy: readiness.refreshing }}
      refreshControl={(
        <RefreshControl
          refreshing={readiness.refreshing}
          onRefresh={() => void readiness.refresh()}
          tintColor={theme.colors.primary.default}
          colors={[theme.colors.primary.default]}
        />
      )}
    >
      <View
        ref={summaryRef}
        style={styles.summaryCard}
        accessible
        accessibilityRole={aggregate.state === 'READY' ? 'summary' : 'alert'}
        accessibilityLiveRegion={aggregate.state === 'READY' ? 'polite' : 'assertive'}
        accessibilityLabel={`${t('onboarding.progressiveExperience.readyToStart.presentation.title')}. ${stateLabel}`}
      >
        <Ionicons name={stateIcon[aggregate.state]} size={theme.spacing.xl} color={stateColor} />
        <View style={styles.summaryText}>
          <Text style={styles.title} accessibilityRole="header">
            {t('onboarding.progressiveExperience.readyToStart.presentation.title')}
          </Text>
          <Text style={styles.stateLabel}>{stateLabel}</Text>
        </View>
      </View>

      {readiness.refreshing && (
        <Text style={styles.refreshing} accessibilityLiveRegion="polite">
          {t('onboarding.progressiveExperience.readyToStart.presentation.refreshing')}
        </Text>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle} accessibilityRole="header">
          {t('onboarding.progressiveExperience.readyToStart.presentation.explanationTitle')}
        </Text>
        {aggregate.providers.map(provider => (
          <Text key={`${provider.providerId}:${provider.providerVersion}`} style={styles.explanation}>
            {safeTranslation(provider.explanationToken)}
          </Text>
        ))}
      </View>

      <View style={styles.section} accessibilityRole="list">
        <Text style={styles.sectionTitle} accessibilityRole="header">
          {t('onboarding.progressiveExperience.readyToStart.presentation.checklistTitle')}
        </Text>
        {aggregate.checklist.map(item => {
          const itemStatus = t(
            `onboarding.progressiveExperience.readyToStart.presentation.itemStates.${item.status}`
          );
          const action = item.nextAction;
          const supported = action ? actionSupported(action) : false;
          const pending = action ? activeActionId === action.actionId : false;
          return (
            <View
              key={`${item.providerId}:${item.itemId}`}
              style={styles.checklistCard}
              accessible
              accessibilityRole="summary"
              accessibilityLabel={`${safeTranslation(item.titleToken)}. ${itemStatus}. ${safeTranslation(item.explanationToken)}`}
            >
              <View style={styles.checklistHeading}>
                <Ionicons
                  name={statusIcon[item.status]}
                  size={theme.spacing.lg}
                  color={
                    item.status === 'COMPLETE'
                      ? theme.colors.feedback.success
                      : item.status === 'ADVISORY'
                        ? theme.colors.feedback.info
                        : theme.colors.feedback.warning
                  }
                />
                <View style={styles.checklistText}>
                  <Text style={styles.itemTitle}>{safeTranslation(item.titleToken)}</Text>
                  <Text style={styles.itemStatus}>{itemStatus}</Text>
                </View>
              </View>
              <Text style={styles.explanation}>{safeTranslation(item.explanationToken)}</Text>
              {action && (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={safeTranslation(
                    action.labelToken,
                    'onboarding.progressiveExperience.readyToStart.presentation.actions.unavailable'
                  )}
                  accessibilityState={{ disabled: !supported || pending, busy: pending }}
                  disabled={!supported || pending}
                  onPress={() => void runAction(action)}
                  style={[styles.actionButton, (!supported || pending) && styles.disabledButton]}
                >
                  {pending ? (
                    <ActivityIndicator color={theme.colors.text.onPrimary} />
                  ) : (
                    <Text style={styles.actionButtonText}>
                      {safeTranslation(
                        action.labelToken,
                        'onboarding.progressiveExperience.readyToStart.presentation.actions.unavailable'
                      )}
                    </Text>
                  )}
                </Pressable>
              )}
            </View>
          );
        })}
      </View>

      <View style={styles.counts} accessible accessibilityRole="summary">
        <Text style={styles.countText}>
          {t('onboarding.progressiveExperience.readyToStart.presentation.blockerCount', {
            count: aggregate.blockers.length,
          })}
        </Text>
        <Text style={styles.countText}>
          {t('onboarding.progressiveExperience.readyToStart.presentation.advisoryCount', {
            count: aggregate.advisories.length,
          })}
        </Text>
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('onboarding.progressiveExperience.readyToStart.presentation.actions.continue')}
        accessibilityState={{
          disabled: !aggregate.authorizesHandoff || activeActionId !== null,
          busy: activeActionId === 'readiness.handoff',
        }}
        disabled={!aggregate.authorizesHandoff || activeActionId !== null}
        onPress={() => void handleHandoff()}
        style={[
          styles.handoffButton,
          (!aggregate.authorizesHandoff || activeActionId !== null) && styles.disabledButton,
        ]}
      >
        {activeActionId === 'readiness.handoff' ? (
          <ActivityIndicator color={theme.colors.text.onPrimary} />
        ) : (
          <Text style={styles.actionButtonText}>
            {t('onboarding.progressiveExperience.readyToStart.presentation.actions.continue')}
          </Text>
        )}
      </Pressable>
    </ScrollView>
  );
}

const createStyles = (theme: ClinicTheme) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: theme.colors.background.default },
    content: { padding: theme.spacing.lg },
    summaryCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.surface.default,
      borderColor: theme.colors.border.default,
      borderWidth: StyleSheet.hairlineWidth,
      borderRadius: theme.spacing.sm,
      padding: theme.spacing.lg,
      marginBottom: theme.spacing.md,
    },
    summaryText: { flex: 1, marginLeft: theme.spacing.md },
    title: { ...theme.typography.h4, color: theme.colors.text.primary },
    stateLabel: { ...theme.typography.subtitle1, color: theme.colors.text.secondary, marginTop: theme.spacing.xs },
    refreshing: { ...theme.typography.caption, color: theme.colors.text.secondary, marginBottom: theme.spacing.md },
    section: { marginBottom: theme.spacing.lg },
    sectionTitle: { ...theme.typography.h6, color: theme.colors.text.primary, marginBottom: theme.spacing.sm },
    explanation: { ...theme.typography.body2, color: theme.colors.text.secondary, marginBottom: theme.spacing.sm },
    checklistCard: {
      backgroundColor: theme.colors.surface.default,
      borderColor: theme.colors.border.default,
      borderWidth: StyleSheet.hairlineWidth,
      borderRadius: theme.spacing.sm,
      padding: theme.spacing.md,
      marginBottom: theme.spacing.sm,
    },
    checklistHeading: { flexDirection: 'row', alignItems: 'center', marginBottom: theme.spacing.sm },
    checklistText: { flex: 1, marginLeft: theme.spacing.sm },
    itemTitle: { ...theme.typography.subtitle1, color: theme.colors.text.primary },
    itemStatus: { ...theme.typography.caption, color: theme.colors.text.secondary },
    actionButton: {
      minHeight: theme.spacing.xxl,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: theme.colors.primary.default,
      borderRadius: theme.spacing.sm,
      paddingHorizontal: theme.spacing.md,
      marginTop: theme.spacing.sm,
    },
    handoffButton: {
      minHeight: theme.spacing.xxl,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: theme.colors.primary.default,
      borderRadius: theme.spacing.sm,
      paddingHorizontal: theme.spacing.md,
    },
    disabledButton: { backgroundColor: theme.colors.interactive.disabled },
    actionButtonText: { ...theme.typography.button, color: theme.colors.text.onPrimary },
    counts: {
      backgroundColor: theme.colors.surface.muted,
      borderRadius: theme.spacing.sm,
      padding: theme.spacing.md,
      marginBottom: theme.spacing.lg,
    },
    countText: { ...theme.typography.body2, color: theme.colors.text.secondary },
  });
