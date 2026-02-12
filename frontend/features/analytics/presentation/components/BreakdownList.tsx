/**
 * Breakdown List Component
 * Displays a list of items with values and percentages
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../../core/theme/colors';
import { spacing } from '../../../../core/theme/spacing';
import { typography } from '../../../../core/theme/typography';

interface BreakdownItem {
  label: string;
  value: number | string;
  percentage?: number;
  icon?: keyof typeof Ionicons.glyphMap;
  color?: string;
}

interface BreakdownListProps {
  title: string;
  items: BreakdownItem[];
  showPercentageBars?: boolean;
  isLoading?: boolean;
  emptyMessage?: string;
}

export const BreakdownList: React.FC<BreakdownListProps> = ({
  title,
  items,
  showPercentageBars = true,
  isLoading = false,
  emptyMessage = 'No data available',
}) => {
  if (isLoading) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>{title}</Text>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </View>
    );
  }

  if (items.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>{title}</Text>
        <View style={styles.emptyContainer}>
          <Ionicons name="bar-chart-outline" size={32} color={colors.text.tertiary} />
          <Text style={styles.emptyText}>{emptyMessage}</Text>
        </View>
      </View>
    );
  }

  const maxPercentage = Math.max(...items.map((i) => i.percentage || 0), 1);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      {items.map((item, index) => (
        <View key={index} style={styles.itemContainer}>
          <View style={styles.itemHeader}>
            {item.icon && (
              <View
                style={[
                  styles.itemIcon,
                  { backgroundColor: (item.color || colors.primary.main) + '15' },
                ]}
              >
                <Ionicons
                  name={item.icon}
                  size={14}
                  color={item.color || colors.primary.main}
                />
              </View>
            )}
            <Text style={styles.itemLabel} numberOfLines={1}>
              {item.label}
            </Text>
            <Text style={styles.itemValue}>{item.value}</Text>
            {item.percentage !== undefined && (
              <Text style={styles.itemPercentage}>
                {item.percentage.toFixed(1)}%
              </Text>
            )}
          </View>
          {showPercentageBars && item.percentage !== undefined && (
            <View style={styles.progressBarContainer}>
              <View
                style={[
                  styles.progressBar,
                  {
                    width: `${(item.percentage / maxPercentage) * 100}%`,
                    backgroundColor: item.color || colors.primary.main,
                  },
                ]}
              />
            </View>
          )}
        </View>
      ))}
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
  itemContainer: {
    marginBottom: spacing.sm,
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  itemIcon: {
    width: 24,
    height: 24,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemLabel: {
    ...typography.body2,
    color: colors.text.primary,
    flex: 1,
  },
  itemValue: {
    ...typography.body2,
    fontWeight: '600',
    color: colors.text.primary,
  },
  itemPercentage: {
    ...typography.caption,
    color: colors.text.secondary,
    width: 45,
    textAlign: 'right',
  },
  progressBarContainer: {
    height: 4,
    backgroundColor: colors.grey[100],
    borderRadius: 2,
    marginTop: 6,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 2,
  },
  loadingContainer: {
    padding: spacing.lg,
    alignItems: 'center',
  },
  loadingText: {
    ...typography.body2,
    color: colors.text.tertiary,
  },
  emptyContainer: {
    padding: spacing.lg,
    alignItems: 'center',
    gap: spacing.sm,
  },
  emptyText: {
    ...typography.body2,
    color: colors.text.tertiary,
  },
});
