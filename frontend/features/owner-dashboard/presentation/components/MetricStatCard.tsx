/**
 * MetricStatCard Component
 * Displays a metric with placeholder support for unavailable data
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../../core/theme/colors';
import { spacing } from '../../../../core/theme/spacing';
import { typography } from '../../../../core/theme/typography';
import type { MetricValue } from '../../domain/entities/owner-dashboard.entity';
import { isMetricAvailable } from '../../domain/entities/owner-dashboard.entity';

interface MetricStatCardProps {
  label: string;
  metric: MetricValue;
  icon: string;
  iconColor?: string;
  format?: 'number' | 'currency' | 'percentage';
  testID?: string;
}

const formatValue = (value: number, format: 'number' | 'currency' | 'percentage'): string => {
  switch (format) {
    case 'currency':
      return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0,
      }).format(value);
    case 'percentage':
      return `${value}%`;
    default:
      return value.toLocaleString('en-IN');
  }
};

export const MetricStatCard: React.FC<MetricStatCardProps> = ({
  label,
  metric,
  icon,
  iconColor = colors.primary.main,
  format = 'number',
  testID,
}) => {
  const isAvailable = isMetricAvailable(metric);

  return (
    <View style={styles.container} testID={testID}>
      <View style={[styles.iconContainer, { backgroundColor: iconColor + '15' }]}>
        <Ionicons name={icon as any} size={22} color={iconColor} />
      </View>
      <View style={styles.content}>
        <Text style={styles.label}>{label}</Text>
        {isAvailable ? (
          <Text style={styles.value}>{formatValue(metric.value, format)}</Text>
        ) : (
          <View style={styles.unavailableContainer}>
            <Ionicons name="time-outline" size={14} color={colors.text.tertiary} />
            <Text style={styles.unavailableText}>Not available yet</Text>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background.default,
    borderRadius: 12,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
  },
  label: {
    ...typography.caption,
    color: colors.text.secondary,
    marginBottom: 2,
  },
  value: {
    ...typography.h5,
    color: colors.text.primary,
    fontWeight: '700',
  },
  unavailableContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  unavailableText: {
    ...typography.caption,
    color: colors.text.tertiary,
    fontStyle: 'italic',
  },
});

export default MetricStatCard;
