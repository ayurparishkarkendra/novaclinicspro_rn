/**
 * Metric Trend Chart Component
 * Simple bar/line chart visualization for metrics
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../../../../core/theme/colors';
import { spacing } from '../../../../core/theme/spacing';
import { typography } from '../../../../core/theme/typography';

interface DataPoint {
  label: string;
  value: number;
}

interface MetricTrendChartProps {
  title: string;
  data: DataPoint[];
  color?: string;
  showValues?: boolean;
  isLoading?: boolean;
  emptyMessage?: string;
}

export const MetricTrendChart: React.FC<MetricTrendChartProps> = ({
  title,
  data,
  color = colors.primary.main,
  showValues = true,
  isLoading = false,
  emptyMessage = 'No data available',
}) => {
  const maxValue = Math.max(...data.map((d) => d.value), 1);

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>{title}</Text>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading chart data...</Text>
        </View>
      </View>
    );
  }

  if (data.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>{title}</Text>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>{emptyMessage}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <View style={styles.chartContainer}>
        {data.map((point, index) => {
          const barHeight = (point.value / maxValue) * 100;
          return (
            <View key={index} style={styles.barWrapper}>
              <View style={styles.barContainer}>
                <View
                  style={[
                    styles.bar,
                    {
                      height: `${Math.max(barHeight, 5)}%`,
                      backgroundColor: color,
                    },
                  ]}
                />
              </View>
              {showValues && (
                <Text style={styles.barValue}>{point.value}</Text>
              )}
              <Text style={styles.barLabel} numberOfLines={1}>
                {point.label}
              </Text>
            </View>
          );
        })}
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
  title: {
    ...typography.body1,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  chartContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 120,
    paddingTop: spacing.md,
  },
  barWrapper: {
    flex: 1,
    alignItems: 'center',
    maxWidth: 50,
  },
  barContainer: {
    width: '70%',
    height: 80,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  bar: {
    width: '100%',
    borderRadius: 4,
    minHeight: 4,
  },
  barValue: {
    ...typography.caption,
    color: colors.text.secondary,
    marginTop: 4,
    fontSize: 10,
  },
  barLabel: {
    ...typography.caption,
    color: colors.text.tertiary,
    fontSize: 9,
    textAlign: 'center',
  },
  loadingContainer: {
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    ...typography.body2,
    color: colors.text.tertiary,
  },
  emptyContainer: {
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    ...typography.body2,
    color: colors.text.tertiary,
  },
});
