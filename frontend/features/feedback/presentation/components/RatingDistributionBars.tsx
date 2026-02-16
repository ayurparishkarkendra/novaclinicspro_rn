/**
 * Rating Distribution Bar Component
 * Displays rating distribution as horizontal bars
 */

import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../../core/theme/colors';
import { spacing } from '../../../../core/theme/spacing';
import { typography } from '../../../../core/theme/typography';

interface RatingDistributionProps {
  distribution: {
    rating: number;
    count: number;
    percentage: number;
  }[];
  testID?: string;
}

export const RatingDistributionBars: React.FC<RatingDistributionProps> = ({
  distribution,
  testID,
}) => {
  // Reverse to show 5 stars at top
  const sortedDistribution = [...distribution].sort((a, b) => b.rating - a.rating);

  return (
    <View style={styles.container} testID={testID}>
      {sortedDistribution.map((item) => (
        <View key={item.rating} style={styles.row}>
          <View style={styles.labelContainer}>
            <Text style={styles.ratingLabel}>{item.rating}</Text>
            <Ionicons name="star" size={12} color={colors.warning.main} />
          </View>
          <View style={styles.barContainer}>
            <View
              style={[
                styles.bar,
                { width: `${Math.max(item.percentage, 2)}%` },
                item.rating >= 4 && styles.barGood,
                item.rating === 3 && styles.barNeutral,
                item.rating <= 2 && styles.barPoor,
              ]}
            />
          </View>
          <Text style={styles.countText}>{item.count}</Text>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: spacing.xs,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 24,
    gap: 2,
  },
  ratingLabel: {
    ...typography.caption,
    color: colors.text.secondary,
    fontWeight: '500',
  },
  barContainer: {
    flex: 1,
    height: 8,
    backgroundColor: colors.grey[100],
    borderRadius: 4,
    overflow: 'hidden',
  },
  bar: {
    height: '100%',
    borderRadius: 4,
    minWidth: 4,
  },
  barGood: {
    backgroundColor: colors.success.main,
  },
  barNeutral: {
    backgroundColor: colors.warning.main,
  },
  barPoor: {
    backgroundColor: colors.error.main,
  },
  countText: {
    ...typography.caption,
    color: colors.text.secondary,
    width: 30,
    textAlign: 'right',
  },
});

export default RatingDistributionBars;
