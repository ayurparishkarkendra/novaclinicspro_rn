/**
 * Dashboard Stats Row Component
 * Displays a compact row of stats for dashboards
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../../core/theme/colors';
import { spacing } from '../../../../core/theme/spacing';
import { typography } from '../../../../core/theme/typography';

export interface StatItem {
  label: string;
  value: number | string;
  icon?: keyof typeof Ionicons.glyphMap;
  color?: string;
}

interface DashboardStatsRowProps {
  stats: StatItem[];
}

export const DashboardStatsRow: React.FC<DashboardStatsRowProps> = ({ stats }) => {
  return (
    <View style={styles.container}>
      {stats.map((stat, index) => (
        <View
          key={index}
          style={[
            styles.statCard,
            index < stats.length - 1 && styles.statCardWithBorder,
          ]}
        >
          {stat.icon && (
            <View style={[styles.iconContainer, { backgroundColor: (stat.color || colors.primary.main) + '15' }]}>
              <Ionicons
                name={stat.icon}
                size={16}
                color={stat.color || colors.primary.main}
              />
            </View>
          )}
          <Text style={styles.statValue}>{stat.value}</Text>
          <Text style={styles.statLabel} numberOfLines={1}>{stat.label}</Text>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: colors.background.default,
    borderRadius: 12,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
  },
  statCardWithBorder: {
    borderRightWidth: 1,
    borderRightColor: colors.border.light,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  statValue: {
    ...typography.h5,
    color: colors.text.primary,
    fontWeight: '700',
    marginBottom: 2,
  },
  statLabel: {
    ...typography.caption,
    color: colors.text.secondary,
    fontSize: 10,
    textAlign: 'center',
  },
});
