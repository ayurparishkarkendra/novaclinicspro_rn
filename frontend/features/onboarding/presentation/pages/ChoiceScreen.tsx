import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { useTranslation } from '../../../../core/localization/useTranslation';
import { ClinicTheme, useClinicTheme } from '../../../../core/theme/useClinicTheme';
import { useAuth } from '../../../auth/presentation/hooks/useAuth';
import { useApplicationDetailQuery } from '../../data/repositories/onboarding.repository.impl';
import {
  buildClinicEntryViewModel,
  ClinicEntryPathId,
  ClinicEntryPathViewModel,
} from '../../domain/usecases/build-clinic-entry-view-model.usecase';
import { ErrorScreen } from '../components/ErrorScreen';
import { LoadingScreen } from '../components/LoadingScreen';
import { useOnboardingStore } from '../providers/onboarding.store';

interface ClinicEntryPathCardProps {
  path: ClinicEntryPathViewModel;
  selected: boolean;
  onSelect: (pathId: ClinicEntryPathId) => void;
  theme: ClinicTheme;
  t: (key: string) => string;
}

const ClinicEntryPathCard = ({
  path,
  selected,
  onSelect,
  theme,
  t,
}: ClinicEntryPathCardProps) => {
  const styles = useMemo(() => createStyles(theme), [theme]);
  const title = t(path.titleKey);
  const description = t(path.descriptionKey);

  return (
    <TouchableOpacity
      testID={`clinic-entry-path-${path.id}`}
      style={[styles.pathCard, selected && styles.pathCardSelected]}
      onPress={() => onSelect(path.id)}
      accessible
      accessibilityRole="radio"
      accessibilityLabel={title}
      accessibilityHint={description}
      accessibilityState={{ checked: selected }}
    >
      <View style={styles.pathHeader}>
        <Ionicons
          name={path.iconToken}
          size={theme.spacing.xl}
          color={selected ? theme.colors.primary.default : theme.colors.text.secondary}
        />
        <View style={styles.pathHeading}>
          <Text style={styles.pathTitle}>{title}</Text>
          <Text style={styles.pathBadge}>{t(path.badgeKey)}</Text>
        </View>
        <Ionicons
          name={selected ? 'radio-button-on' : 'radio-button-off'}
          size={theme.spacing.lg}
          color={selected ? theme.colors.primary.default : theme.colors.text.tertiary}
        />
      </View>
      <Text style={styles.pathDescription}>{description}</Text>
      <View style={styles.featureList}>
        {path.featureKeys.map((featureKey) => (
          <View key={featureKey} style={styles.featureRow}>
            <Ionicons
              name="checkmark-circle-outline"
              size={theme.spacing.md}
              color={theme.colors.feedback.success}
            />
            <Text style={styles.featureText}>{t(featureKey)}</Text>
          </View>
        ))}
      </View>
    </TouchableOpacity>
  );
};

export function ChoiceScreen() {
  const theme = useClinicTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { t } = useTranslation();
  const router = useRouter();
  const { applicationId } = useLocalSearchParams<{ applicationId: string }>();
  const { setCurrentApplicationId } = useOnboardingStore();
  const { currentUser } = useAuth();
  const [selectedPathId, setSelectedPathId] = useState<ClinicEntryPathId | null>(null);

  const { data: application, isLoading, error, refetch } = useApplicationDetailQuery(
    applicationId || '',
    { enabled: Boolean(applicationId) }
  );

  const viewModel = useMemo(
    () =>
      application
        ? buildClinicEntryViewModel({ tenantName: application.tenant_name })
        : null,
    [application]
  );

  const selectedPath = useMemo(
    () => viewModel?.paths.find((path) => path.id === selectedPathId) ?? null,
    [selectedPathId, viewModel]
  );

  useEffect(() => {
    if (applicationId) {
      setCurrentApplicationId(applicationId);
    }
  }, [applicationId, setCurrentApplicationId]);

  useEffect(() => {
    if (currentUser?.applicationStatus === 'onboarding') {
      router.replace('/onboarding/wizard-flow');
    }
  }, [currentUser, router]);

  if (!applicationId) {
    return <ErrorScreen message={t('onboarding.progressiveExperience.clinicEntry.empty')} />;
  }

  if (isLoading) {
    return <LoadingScreen message={t('onboarding.progressiveExperience.clinicEntry.loading')} />;
  }

  if (error) {
    return (
      <ErrorScreen
        message={t('onboarding.progressiveExperience.clinicEntry.loadError')}
        onRetry={refetch}
      />
    );
  }

  if (!application || !viewModel) {
    return <ErrorScreen message={t('onboarding.progressiveExperience.clinicEntry.empty')} />;
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.header} accessible accessibilityRole="header">
        <Ionicons
          name="checkmark-circle"
          size={theme.spacing.xxl}
          color={theme.colors.feedback.success}
        />
        <Text style={styles.approvedTitle}>
          {t('onboarding.progressiveExperience.clinicEntry.approvedTitle')}
        </Text>
        <Text style={styles.clinicName}>{viewModel.clinicDisplayName}</Text>
      </View>

      <View style={styles.introduction}>
        <Text style={styles.question} accessibilityRole="header">
          {t('onboarding.progressiveExperience.clinicEntry.question')}
        </Text>
        <Text style={styles.questionHint}>
          {t('onboarding.progressiveExperience.clinicEntry.questionHint')}
        </Text>
      </View>

      <View accessibilityRole="radiogroup">
        {viewModel.paths.map((path) => (
          <ClinicEntryPathCard
            key={path.id}
            path={path}
            selected={path.id === selectedPathId}
            onSelect={setSelectedPathId}
            theme={theme}
            t={t}
          />
        ))}
      </View>

      {selectedPath ? (
        <View
          testID="clinic-entry-selection-summary"
          style={styles.selectionSummary}
          accessible
          accessibilityRole="summary"
          accessibilityLiveRegion="polite"
        >
          <Text style={styles.selectionTitle}>
            {t('onboarding.progressiveExperience.clinicEntry.selectionHeading')}
          </Text>
          <Text style={styles.selectionPath}>{t(selectedPath.titleKey)}</Text>
          <Text style={styles.validationText}>{t(selectedPath.validationKey)}</Text>
          <View style={styles.handoffRow}>
            <Ionicons
              name="shield-checkmark-outline"
              size={theme.spacing.md}
              color={theme.colors.feedback.info}
            />
            <Text style={styles.handoffText}>
              {t('onboarding.progressiveExperience.clinicEntry.authoritativeHandoff')}
            </Text>
          </View>
        </View>
      ) : (
        <View style={styles.selectionPrompt} accessible accessibilityRole="summary">
          <Text style={styles.selectionPromptText}>
            {t('onboarding.progressiveExperience.clinicEntry.selectionPrompt')}
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

const createStyles = (theme: ClinicTheme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background.default,
    },
    contentContainer: {
      padding: theme.spacing.lg,
      paddingBottom: theme.spacing.xxl,
    },
    header: {
      alignItems: 'center',
      marginBottom: theme.spacing.xl,
    },
    approvedTitle: {
      ...theme.typography.h3,
      color: theme.colors.text.primary,
      marginTop: theme.spacing.md,
      textAlign: 'center',
    },
    clinicName: {
      ...theme.typography.body1,
      color: theme.colors.text.secondary,
      marginTop: theme.spacing.sm,
      textAlign: 'center',
    },
    introduction: {
      marginBottom: theme.spacing.lg,
    },
    question: {
      ...theme.typography.h5,
      color: theme.colors.text.primary,
      textAlign: 'center',
    },
    questionHint: {
      ...theme.typography.body2,
      color: theme.colors.text.secondary,
      marginTop: theme.spacing.sm,
      textAlign: 'center',
    },
    pathCard: {
      minHeight: theme.spacing.xxl,
      backgroundColor: theme.colors.surface.default,
      borderColor: theme.colors.border.default,
      borderWidth: StyleSheet.hairlineWidth,
      borderRadius: theme.spacing.sm,
      padding: theme.spacing.lg,
      marginBottom: theme.spacing.md,
    },
    pathCardSelected: {
      backgroundColor: theme.colors.primary.soft,
      borderColor: theme.colors.primary.default,
    },
    pathHeader: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    pathHeading: {
      flex: 1,
      marginHorizontal: theme.spacing.md,
    },
    pathTitle: {
      ...theme.typography.h6,
      color: theme.colors.text.primary,
    },
    pathBadge: {
      ...theme.typography.caption,
      color: theme.colors.primary.default,
      marginTop: theme.spacing.xs,
    },
    pathDescription: {
      ...theme.typography.body2,
      color: theme.colors.text.secondary,
      marginTop: theme.spacing.md,
    },
    featureList: {
      marginTop: theme.spacing.md,
    },
    featureRow: {
      minHeight: theme.spacing.xl,
      flexDirection: 'row',
      alignItems: 'center',
    },
    featureText: {
      ...theme.typography.caption,
      color: theme.colors.text.secondary,
      flex: 1,
      marginLeft: theme.spacing.sm,
    },
    selectionSummary: {
      backgroundColor: theme.colors.feedback.infoLight,
      borderColor: theme.colors.feedback.info,
      borderWidth: StyleSheet.hairlineWidth,
      borderRadius: theme.spacing.sm,
      padding: theme.spacing.md,
      marginTop: theme.spacing.sm,
    },
    selectionTitle: {
      ...theme.typography.caption,
      color: theme.colors.text.secondary,
    },
    selectionPath: {
      ...theme.typography.h6,
      color: theme.colors.text.primary,
      marginTop: theme.spacing.xs,
    },
    validationText: {
      ...theme.typography.body2,
      color: theme.colors.text.secondary,
      marginTop: theme.spacing.sm,
    },
    handoffRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      marginTop: theme.spacing.md,
    },
    handoffText: {
      ...theme.typography.caption,
      color: theme.colors.text.secondary,
      flex: 1,
      marginLeft: theme.spacing.sm,
    },
    selectionPrompt: {
      minHeight: theme.spacing.xxl,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: theme.spacing.sm,
    },
    selectionPromptText: {
      ...theme.typography.body2,
      color: theme.colors.text.secondary,
      textAlign: 'center',
    },
  });
