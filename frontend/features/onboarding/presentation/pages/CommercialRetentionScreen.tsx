import { Ionicons } from '@expo/vector-icons';
import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { useTranslation } from '../../../../core/localization/useTranslation';
import { ClinicTheme, useClinicTheme } from '../../../../core/theme/useClinicTheme';
import { CommercialTrialError } from '../../domain/entities/commercial-trial.entity';
import { useCommercialRetentionQuery } from '../../data/repositories/onboarding.repository.impl';
import { ErrorScreen } from '../components/ErrorScreen';
import { LoadingScreen } from '../components/LoadingScreen';

interface CommercialRetentionScreenProps {
  organizationId: string;
  tenantId: string;
}

const ROOT = 'onboarding.progressiveExperience.commercialRetention';

export function CommercialRetentionScreen({
  organizationId,
  tenantId,
}: CommercialRetentionScreenProps) {
  const theme = useClinicTheme();
  const { t, locale } = useTranslation();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const query = useCommercialRetentionQuery(organizationId, tenantId);

  const formatDate = (value: string) =>
    new Intl.DateTimeFormat(locale, {
      dateStyle: 'long',
      timeZone: 'UTC',
    }).format(new Date(value));

  if (!organizationId || !tenantId) {
    return (
      <ErrorScreen
        title={t(`${ROOT}.empty.title`)}
        message={t(`${ROOT}.empty.missingWorkspace`)}
      />
    );
  }

  if (query.isPending) {
    return <LoadingScreen message={t(`${ROOT}.loading`)} />;
  }

  if (query.error || !query.data) {
    const kind =
      query.error instanceof CommercialTrialError
        ? query.error.kind
        : 'BACKEND_FAILURE';
    const retryable =
      query.error instanceof CommercialTrialError && query.error.retryable;
    const messageKey =
      kind === 'UNAUTHORIZED' || kind === 'FORBIDDEN'
        ? 'permissionDenied'
        : kind === 'NOT_FOUND'
          ? 'missingWorkspace'
          : kind === 'RETENTION_EVIDENCE_UNAVAILABLE'
            ? 'missingEvidence'
            : kind === 'UNSUPPORTED_CONTRACT' || kind === 'INVALID_AGGREGATE'
              ? 'unsupported'
              : 'network';
    return (
      <ErrorScreen
        title={t(`${ROOT}.empty.title`)}
        message={t(`${ROOT}.empty.${messageKey}`)}
        onRetry={retryable ? () => void query.refetch() : undefined}
        retryLabel={t(`${ROOT}.actions.retry`)}
      />
    );
  }

  const retention = query.data;
  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      accessibilityLabel={t(`${ROOT}.accessibility.screen`)}
    >
      <View style={styles.header}>
        <Ionicons
          name="business-outline"
          size={theme.spacing.xxl}
          color={theme.colors.primary.default}
        />
        <Text style={styles.title} accessibilityRole="header">
          {t(`${ROOT}.title`)}
        </Text>
        <Text style={styles.introduction}>{t(`${ROOT}.introduction`)}</Text>
      </View>

      <View style={styles.card} accessible>
        <Text style={styles.sectionTitle} accessibilityRole="header">
          {t(`${ROOT}.workspaceStatus.title`)}
        </Text>
        <Text style={styles.status} accessibilityLiveRegion="polite">
          {t(`${ROOT}.states.${retention.commercialState}`)}
        </Text>
        <Text style={styles.body}>
          {t(`${ROOT}.stateDescriptions.${retention.commercialState}`)}
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle} accessibilityRole="header">
          {t(`${ROOT}.retention.title`)}
        </Text>
        {retention.archivedAt ? (
          <InformationRow
            label={t(`${ROOT}.retention.archivedAt`)}
            value={formatDate(retention.archivedAt)}
            styles={styles}
          />
        ) : null}
        {retention.retentionUntil ? (
          <InformationRow
            label={t(`${ROOT}.retention.retentionUntil`)}
            value={formatDate(retention.retentionUntil)}
            styles={styles}
          />
        ) : null}
        {retention.legalHoldActive !== null ? (
          <InformationRow
            label={t(`${ROOT}.retention.legalHold`)}
            value={t(
              `${ROOT}.retention.${retention.legalHoldActive ? 'active' : 'notActive'}`
            )}
            styles={styles}
          />
        ) : null}
        {retention.statutoryRetentionActive !== null ? (
          <InformationRow
            label={t(`${ROOT}.retention.statutoryRetention`)}
            value={t(
              `${ROOT}.retention.${
                retention.statutoryRetentionActive ? 'active' : 'notActive'
              }`
            )}
            styles={styles}
          />
        ) : null}
        {!retention.archivedAt &&
        !retention.retentionUntil &&
        retention.legalHoldActive === null &&
        retention.statutoryRetentionActive === null ? (
          <Text style={styles.body}>{t(`${ROOT}.retention.notApplicable`)}</Text>
        ) : null}
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle} accessibilityRole="header">
          {t(`${ROOT}.availableActions.title`)}
        </Text>
        {retention.allowedActions.length === 0 ? (
          <Text style={styles.body}>{t(`${ROOT}.availableActions.none`)}</Text>
        ) : (
          retention.allowedActions.map((action) => (
            <View
              key={action}
              style={styles.actionRow}
              accessible
              accessibilityLabel={`${t(`${ROOT}.actionLabels.${action}`)}. ${t(
                `${ROOT}.actionDescriptions.${action}`
              )}`}
            >
              <Ionicons
                name="checkmark-circle-outline"
                size={theme.spacing.xl}
                color={theme.colors.feedback.success}
              />
              <View style={styles.actionText}>
                <Text style={styles.actionTitle}>
                  {t(`${ROOT}.actionLabels.${action}`)}
                </Text>
                <Text style={styles.body}>
                  {t(`${ROOT}.actionDescriptions.${action}`)}
                </Text>
              </View>
            </View>
          ))
        )}
      </View>

      {retention.ineligibilityReasons.length > 0 ? (
        <View
          style={styles.warningCard}
          accessible
          accessibilityRole="alert"
          accessibilityLiveRegion="polite"
        >
          <Text style={styles.sectionTitle} accessibilityRole="header">
            {t(`${ROOT}.unavailable.title`)}
          </Text>
          {retention.ineligibilityReasons.map((reason) => (
            <View key={reason} style={styles.reasonRow}>
              <Ionicons
                name="information-circle-outline"
                size={theme.spacing.lg}
                color={theme.colors.feedback.warning}
              />
              <Text style={styles.reasonText}>
                {t(`${ROOT}.ineligibilityReasons.${reason}`)}
              </Text>
            </View>
          ))}
        </View>
      ) : null}

      <Text style={styles.footer}>{t(`${ROOT}.footer`)}</Text>
    </ScrollView>
  );
}

interface InformationRowProps {
  label: string;
  value: string;
  styles: ReturnType<typeof createStyles>;
}

function InformationRow({ label, value, styles }: InformationRowProps) {
  return (
    <View style={styles.informationRow} accessible accessibilityLabel={`${label}. ${value}`}>
      <Text style={styles.informationLabel}>{label}</Text>
      <Text style={styles.informationValue}>{value}</Text>
    </View>
  );
}

const createStyles = (theme: ClinicTheme) =>
  StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: theme.colors.background.default,
    },
    content: {
      padding: theme.spacing.lg,
      gap: theme.spacing.lg,
    },
    header: {
      alignItems: 'center',
      gap: theme.spacing.sm,
    },
    title: {
      ...theme.typography.h3,
      color: theme.colors.text.primary,
      textAlign: 'center',
    },
    introduction: {
      ...theme.typography.body1,
      color: theme.colors.text.secondary,
      textAlign: 'center',
    },
    card: {
      backgroundColor: theme.colors.surface.default,
      padding: theme.spacing.lg,
      borderRadius: theme.spacing.md,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.border.subtle,
      gap: theme.spacing.md,
    },
    warningCard: {
      backgroundColor: theme.colors.feedback.warningLight,
      padding: theme.spacing.lg,
      borderRadius: theme.spacing.md,
      gap: theme.spacing.md,
    },
    sectionTitle: {
      ...theme.typography.h5,
      color: theme.colors.text.primary,
    },
    status: {
      ...theme.typography.h4,
      color: theme.colors.primary.default,
    },
    body: {
      ...theme.typography.body1,
      color: theme.colors.text.secondary,
    },
    informationRow: {
      gap: theme.spacing.xs,
    },
    informationLabel: {
      ...theme.typography.body2,
      color: theme.colors.text.secondary,
    },
    informationValue: {
      ...theme.typography.body1,
      color: theme.colors.text.primary,
    },
    actionRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: theme.spacing.md,
      minHeight: 44,
    },
    actionText: {
      flex: 1,
      gap: theme.spacing.xs,
    },
    actionTitle: {
      ...theme.typography.h6,
      color: theme.colors.text.primary,
    },
    reasonRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: theme.spacing.sm,
    },
    reasonText: {
      ...theme.typography.body1,
      color: theme.colors.text.primary,
      flex: 1,
    },
    footer: {
      ...theme.typography.body2,
      color: theme.colors.text.secondary,
      textAlign: 'center',
    },
  });
