/**
 * EpisodeWorkspaceShared
 *
 * Shared primitives used across all Episode Workspace sub-components:
 *  - SectionSkeleton  — loading placeholder
 *  - SectionError     — error state with retry
 *  - Shared StyleSheet factory (makeSharedStyles)
 *  - Shared date/time formatters
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useClinicTheme } from '../../../../core/theme/useClinicTheme';
import { useTranslation } from '../../../../core/localization/useTranslation';

// ─── Formatters ──────────────────────────────────────────────────────────────

export const formatDisplayDate = (iso: string | null | undefined): string => {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return iso;
  }
};

// ─── SectionSkeleton ─────────────────────────────────────────────────────────

export const SectionSkeleton: React.FC = () => {
  const { colors, spacing } = useClinicTheme();
  return (
    <View
      style={{ gap: spacing.md, padding: spacing.md }}
      accessibilityLabel="Loading"
      accessibilityLiveRegion="polite"
    >
      {[1, 2].map((i) => (
        <View
          key={i}
          style={[
            skeletonStyles.card,
            {
              backgroundColor: colors.background.elevated,
              borderRadius: spacing.sm,
              height: 96,
            },
          ]}
        />
      ))}
    </View>
  );
};

const skeletonStyles = StyleSheet.create({
  card: { width: '100%' },
});

// ─── SectionError ─────────────────────────────────────────────────────────────

interface SectionErrorProps {
  message: string;
  onRetry: () => void;
}

export const SectionError: React.FC<SectionErrorProps> = ({ message, onRetry }) => {
  const { colors, spacing, typography } = useClinicTheme();
  const { t } = useTranslation();
  return (
    <View
      style={{
        alignItems: 'center',
        paddingVertical: spacing.xl,
        gap: spacing.sm,
        paddingHorizontal: spacing.md,
      }}
      accessibilityRole="alert"
      accessibilityLiveRegion="assertive"
    >
      <Ionicons name="alert-circle-outline" size={24} color={colors.feedback.error} />
      <Text style={[typography.body2, { color: colors.text.secondary, textAlign: 'center' }]}>
        {message}
      </Text>
      <TouchableOpacity
        style={{
          backgroundColor: colors.primary.default,
          paddingHorizontal: spacing.lg,
          paddingVertical: spacing.sm,
          borderRadius: spacing.sm,
        }}
        onPress={onRetry}
        accessibilityRole="button"
        accessibilityLabel={t('episodeWorkspace.actions.retry')}
      >
        <Text style={[typography.button, { color: colors.primary.onPrimary }]}>
          {t('episodeWorkspace.actions.retry')}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

// ─── StatusChip ───────────────────────────────────────────────────────────────

export interface StatusChipProps {
  label: string;
  color: string;
}

export const StatusChip: React.FC<StatusChipProps> = ({ label, color }) => {
  const { spacing, typography } = useClinicTheme();
  return (
    <View
      style={{
        paddingHorizontal: spacing.xs,
        paddingVertical: 2,
        borderRadius: spacing.xs,
        borderWidth: 1,
        backgroundColor: color + '15',
        borderColor: color + '40',
      }}
    >
      <Text style={[typography.caption, { color, fontWeight: '600' }]}>{label}</Text>
    </View>
  );
};

// ─── DocField ─────────────────────────────────────────────────────────────────

export interface DocFieldProps {
  label: string;
  value: string;
}

export const DocField: React.FC<DocFieldProps> = ({ label, value }) => {
  const { colors, typography } = useClinicTheme();
  return (
    <View style={{ gap: 2 }}>
      <Text
        style={[
          typography.caption,
          {
            color: colors.text.secondary,
            fontWeight: '600',
            textTransform: 'uppercase',
            letterSpacing: 0.5,
          },
        ]}
      >
        {label}
      </Text>
      <Text
        style={[typography.body2, { color: colors.text.primary }]}
        numberOfLines={3}
      >
        {value}
      </Text>
    </View>
  );
};

// ─── Shared card layout styles ────────────────────────────────────────────────

export const cardStyles = StyleSheet.create({
  docCard: { borderWidth: 1 },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  emptySection: { alignItems: 'center' },
  tabContent: {},
  chevron: { alignSelf: 'flex-end' },
});

// ─── Shared CTA styles factory ────────────────────────────────────────────────
// Returns inline style objects so each component can apply them without
// duplicating magic numbers. All values come from theme tokens.

export const useCtaStyles = () => {
  const { spacing, typography } = useClinicTheme();
  return {
    primaryCta: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      gap: spacing.xs,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
      borderRadius: spacing.sm,
    },
    primaryCtaText: typography.button,
    secondaryCta: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      gap: spacing.xs,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
      borderRadius: spacing.sm,
      borderWidth: 1,
    },
    secondaryCtaText: typography.button,
    disabledCta: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      gap: spacing.xs,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
      borderRadius: spacing.sm,
      borderWidth: 1,
    },
  };
};
