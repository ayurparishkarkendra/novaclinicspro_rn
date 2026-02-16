/**
 * Time Metrics Bar Component
 * Simple horizontal bar visualization for time-based metrics
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../../core/theme/colors';
import { spacing } from '../../../../core/theme/spacing';
import { typography } from '../../../../core/theme/typography';
import type { TimeBarItem } from '../../data/models/doctorKpis.dtos';

interface TimeMetricsBarProps {
  items: TimeBarItem[];
  title: string;
  icon: string;
  emptyText?: string;
  testID?: string;
}

export const TimeMetricsBars: React.FC<TimeMetricsBarProps> = ({
  items,
  title,
  icon,
  emptyText = 'No data available',
  testID,
}) => {
  if (items.length === 0) {
    return (
      <View style={styles.container} testID={testID}>
        <View style={styles.header}>
          <Ionicons name={icon as any} size={18} color={colors.text.secondary} />
          <Text style={styles.title}>{title}</Text>
        </View>
        <Text style={styles.emptyText}>{emptyText}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container} testID={testID}>
      <View style={styles.header}>
        <Ionicons name={icon as any} size={18} color={colors.text.secondary} />
        <Text style={styles.title}>{title}</Text>
      </View>
      <View style={styles.barsContainer}>
        {items.map((item, index) => (
          <View key={`${item.label}-${index}`} style={styles.barRow}>
            <Text style={styles.barLabel}>{item.label}</Text>
            <View style={styles.barTrack}>
              <View
                style={[
                  styles.barFill,
                  {
                    width: `${Math.max((item.value / item.maxValue) * 100, 5)}%`,
                    backgroundColor: item.color || colors.primary.main,
                  },
                ]}
              />
            </View>
            <Text style={styles.barValue}>{item.value}</Text>
          </View>
        ))}
      </View>
    </View>
  );
};

/**
 * Duration Metric Card
 * Displays average consultation duration prominently
 */
interface DurationMetricCardProps {
  duration: string;
  label?: string;
  testID?: string;
}

export const DurationMetricCard: React.FC<DurationMetricCardProps> = ({
  duration,
  label = 'Avg. Duration',
  testID,
}) => {
  return (
    <View style={styles.durationCard} testID={testID}>
      <View style={styles.durationIconContainer}>
        <Ionicons name="time-outline" size={24} color={colors.info.main} />
      </View>
      <View style={styles.durationContent}>
        <Text style={styles.durationValue}>{duration}</Text>
        <Text style={styles.durationLabel}>{label}</Text>
      </View>
    </View>
  );
};

/**
 * Time Metrics Section
 * Combined component for all time-related metrics
 */
interface TimeMetricsSectionProps {
  avgDuration: string;
  peakHours: TimeBarItem[];
  busiestDays: TimeBarItem[];
  testID?: string;
}

export const TimeMetricsSection: React.FC<TimeMetricsSectionProps> = ({
  avgDuration,
  peakHours,
  busiestDays,
  testID,
}) => {
  return (
    <View style={styles.sectionContainer} testID={testID}>
      <DurationMetricCard duration={avgDuration} testID={`${testID}-duration`} />
      <View style={styles.barsRow}>
        <View style={styles.barsSectionHalf}>
          <TimeMetricsBars
            items={peakHours}
            title="Peak Hours"
            icon="time-outline"
            emptyText="No peak hour data"
            testID={`${testID}-peak-hours`}
          />
        </View>
        <View style={styles.barsSectionHalf}>
          <TimeMetricsBars
            items={busiestDays}
            title="Busiest Days"
            icon="calendar-outline"
            emptyText="No day data"
            testID={`${testID}-busiest-days`}
          />
        </View>
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
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  title: {
    ...typography.subtitle2,
    color: colors.text.primary,
  },
  emptyText: {
    ...typography.caption,
    color: colors.text.tertiary,
    fontStyle: 'italic',
  },
  barsContainer: {
    gap: spacing.sm,
  },
  barRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  barLabel: {
    ...typography.caption,
    color: colors.text.secondary,
    width: 50,
  },
  barTrack: {
    flex: 1,
    height: 8,
    backgroundColor: colors.grey[100],
    borderRadius: 4,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 4,
  },
  barValue: {
    ...typography.caption,
    color: colors.text.primary,
    fontWeight: '600',
    width: 24,
    textAlign: 'right',
  },
  durationCard: {
    backgroundColor: colors.background.default,
    borderRadius: 12,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.border.light,
    marginBottom: spacing.sm,
  },
  durationIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: colors.info.light + '30',
    alignItems: 'center',
    justifyContent: 'center',
  },
  durationContent: {
    flex: 1,
  },
  durationValue: {
    ...typography.h4,
    color: colors.text.primary,
    fontWeight: '700',
  },
  durationLabel: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  sectionContainer: {
    gap: spacing.sm,
  },
  barsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  barsSectionHalf: {
    flex: 1,
  },
});

export default TimeMetricsBars;
