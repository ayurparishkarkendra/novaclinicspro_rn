/**
 * Therapist KPI Row Component
 * Displays KPI metrics at the top of the dashboard
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../../core/theme/colors';
import { spacing } from '../../../../core/theme/spacing';
import { typography } from '../../../../core/theme/typography';
import { KpiMetric, WorklistPeriod } from '../../data/models/therapistDashboard.dtos';

interface TherapistKpiRowProps {
  metrics: KpiMetric[];
  period: WorklistPeriod;
  isLoading?: boolean;
}

export const TherapistKpiRow: React.FC<TherapistKpiRowProps> = ({
  metrics,
  period,
  isLoading = false,
}) => {
  const periodLabels: Record<WorklistPeriod, string> = {
    today: 'Today',
    next_7_days: 'Next 7 Days',
    past_7_days: 'Last 7 Days',
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Performance</Text>
          <Text style={styles.headerPeriod}>{periodLabels[period]}</Text>
        </View>
        <View style={styles.metricsRow}>
          {[1, 2, 3, 4].map((i) => (
            <View key={i} style={styles.metricCard}>
              <View style={[styles.skeleton, styles.skeletonValue]} />
              <View style={[styles.skeleton, styles.skeletonLabel]} />
            </View>
          ))}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Performance</Text>
        <Text style={styles.headerPeriod}>{periodLabels[period]}</Text>
      </View>
      <View style={styles.metricsRow}>
        {metrics.map((metric, index) => (
          <View key={index} style={styles.metricCard}>
            <View style={[styles.iconContainer, { backgroundColor: metric.color + '15' }]}>
              <Ionicons
                name={metric.icon as any}
                size={18}
                color={metric.color}
              />
            </View>
            <Text style={[styles.metricValue, { color: metric.color }]}>
              {metric.value}
            </Text>
            <Text style={styles.metricLabel} numberOfLines={1}>
              {metric.label}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background.default,
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
  headerTitle: {
    ...typography.subtitle1,
    color: colors.text.primary,
    fontWeight: '600',
  },
  headerPeriod: {
    ...typography.caption,
    color: colors.text.secondary,
    backgroundColor: colors.grey[100],
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: 4,
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  metricCard: {
    flex: 1,
    alignItems: 'center',
    padding: spacing.sm,
    backgroundColor: colors.grey[50],
    borderRadius: 8,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  metricValue: {
    ...typography.h6,
    fontWeight: '700',
    marginBottom: 2,
  },
  metricLabel: {
    ...typography.caption,
    color: colors.text.secondary,
    textAlign: 'center',
    fontSize: 10,
  },
  skeleton: {
    backgroundColor: colors.grey[200],
    borderRadius: 4,
  },
  skeletonValue: {
    width: 32,
    height: 24,
    marginTop: spacing.sm,
    marginBottom: 4,
  },
  skeletonLabel: {
    width: 50,
    height: 12,
  },
});

export default TherapistKpiRow;
