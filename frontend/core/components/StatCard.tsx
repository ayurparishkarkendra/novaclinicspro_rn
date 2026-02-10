import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  onPress?: () => void;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon,
  color,
  trend,
  onPress,
}) => {
  const Container = onPress ? TouchableOpacity : View;

  return (
    <Container
      style={styles.card}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      <View style={[styles.iconContainer, { backgroundColor: color + '20' }]}>
        <Ionicons name={icon} size={24} color={color} />
      </View>
      <View style={styles.content}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.value}>{value}</Text>
        {trend && (
          <View style={styles.trendContainer}>
            <Ionicons
              name={trend.isPositive ? 'trending-up' : 'trending-down'}
              size={14}
              color={trend.isPositive ? colors.success.main : colors.error.main}
            />
            <Text
              style={[
                styles.trendText,
                {
                  color: trend.isPositive
                    ? colors.success.main
                    : colors.error.main,
                },
              ]}
            >
              {trend.value}
            </Text>
          </View>
        )}
      </View>
    </Container>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.background.default,
    borderRadius: 12,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  content: {
    flex: 1,
  },
  title: {
    ...typography.body2,
    color: colors.text.secondary,
    marginBottom: 4,
  },
  value: {
    ...typography.h4,
    color: colors.text.primary,
    marginBottom: 4,
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  trendText: {
    ...typography.caption,
    fontWeight: '600',
  },
});
