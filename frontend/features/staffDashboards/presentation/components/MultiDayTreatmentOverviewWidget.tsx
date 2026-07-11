/**
 * Multi-Day Treatment Overview Widget
 * Shows statistics for multi-day treatments (active, proposed, paused, completed)
 * 
 * Requirements: F2.5 - Admin Dashboard Integration
 * Location: features/staffDashboards/presentation/components/MultiDayTreatmentOverviewWidget.tsx
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../../core/theme/colors';
import { spacing } from '../../../../core/theme/spacing';
import { typography } from '../../../../core/theme/typography';
import { useFeatures, hasMultiDayAppointments } from '../../../../core/hooks/useFeatures';

// ============================================
// TYPES
// ============================================

interface TreatmentStats {
  active_series: number;
  unscheduled_sheets: number;
  paused_series: number;
  completed_this_month: number;
}

interface MultiDayTreatmentOverviewWidgetProps {
  stats: TreatmentStats | null;
  isLoading?: boolean;
  testID?: string;
}

// ============================================
// COMPONENT
// ============================================

export const MultiDayTreatmentOverviewWidget: React.FC<MultiDayTreatmentOverviewWidgetProps> = ({
  stats,
  isLoading = false,
  testID = 'multiday-treatment-overview-widget',
}) => {
  const features = useFeatures();

  // Don't render if multi-day appointments are not enabled
  if (!hasMultiDayAppointments(features)) {
    return null;
  }

  // Loading state
  if (isLoading) {
    return (
      <View style={styles.container} testID={testID}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Ionicons name="stats-chart" size={20} color={colors.primary.main} />
            <Text style={styles.title}>Multi-Day Treatment Overview</Text>
          </View>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={colors.primary.main} />
          <Text style={styles.loadingText}>Loading statistics...</Text>
        </View>
      </View>
    );
  }

  // Empty/error state
  if (!stats) {
    return (
      <View style={styles.container} testID={testID}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Ionicons name="stats-chart" size={20} color={colors.primary.main} />
            <Text style={styles.title}>Multi-Day Treatment Overview</Text>
          </View>
        </View>
        <View style={styles.emptyContainer}>
          <Ionicons name="stats-chart-outline" size={48} color={colors.text.disabled} />
          <Text style={styles.emptyText}>No statistics available</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container} testID={testID}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="stats-chart" size={20} color={colors.primary.main} />
          <Text style={styles.title}>Multi-Day Treatment Overview</Text>
        </View>
      </View>

      {/* Statistics Grid */}
      <View style={styles.statsGrid}>
        {/* Active Series */}
        <View style={[styles.statCard, styles.activeCard]} testID={`${testID}-active`}>
          <View style={styles.statIconContainer}>
            <Ionicons name="pulse" size={24} color={colors.primary.main} />
          </View>
          <Text style={styles.statValue}>{stats.active_series}</Text>
          <Text style={styles.statLabel}>Active Series</Text>
        </View>

        {/* Unscheduled Sheets */}
        <View style={[styles.statCard, styles.unscheduledCard]} testID={`${testID}-unscheduled`}>
          <View style={styles.statIconContainer}>
            <Ionicons name="calendar-outline" size={24} color={colors.warning.main} />
          </View>
          <Text style={styles.statValue}>{stats.unscheduled_sheets}</Text>
          <Text style={styles.statLabel}>Unscheduled Sheets</Text>
        </View>

        {/* Paused Series */}
        <View style={[styles.statCard, styles.pausedCard]} testID={`${testID}-paused`}>
          <View style={styles.statIconContainer}>
            <Ionicons name="pause-circle" size={24} color={colors.info.main} />
          </View>
          <Text style={styles.statValue}>{stats.paused_series}</Text>
          <Text style={styles.statLabel}>Paused</Text>
        </View>

        {/* Completed This Month */}
        <View style={[styles.statCard, styles.completedCard]} testID={`${testID}-completed`}>
          <View style={styles.statIconContainer}>
            <Ionicons name="checkmark-circle" size={24} color={colors.success.main} />
          </View>
          <Text style={styles.statValue}>{stats.completed_this_month}</Text>
          <Text style={styles.statLabel}>Completed This Month</Text>
        </View>
      </View>
    </View>
  );
};

// ============================================
// STYLES
// ============================================

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background.paper,
    borderRadius: 12,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  title: {
    ...typography.subtitle1,
    color: colors.text.primary,
    fontWeight: '600',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl,
    gap: spacing.sm,
  },
  loadingText: {
    ...typography.body2,
    color: colors.text.secondary,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    gap: spacing.sm,
  },
  emptyText: {
    ...typography.body2,
    color: colors.text.secondary,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: colors.background.default,
    borderRadius: 8,
    padding: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  activeCard: {
    borderLeftWidth: 3,
    borderLeftColor: colors.primary.main,
  },
  unscheduledCard: {
    borderLeftWidth: 3,
    borderLeftColor: colors.warning.main,
  },
  pausedCard: {
    borderLeftWidth: 3,
    borderLeftColor: colors.info.main,
  },
  completedCard: {
    borderLeftWidth: 3,
    borderLeftColor: colors.success.main,
  },
  statIconContainer: {
    marginBottom: spacing.sm,
  },
  statValue: {
    ...typography.h4,
    color: colors.text.primary,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  statLabel: {
    ...typography.caption,
    color: colors.text.secondary,
    textAlign: 'center',
  },
});
