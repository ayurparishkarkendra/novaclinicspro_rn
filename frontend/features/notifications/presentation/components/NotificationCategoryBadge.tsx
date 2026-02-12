/**
 * Notification Category Badge Component
 * Displays a colored badge indicating the notification category
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NotificationCategory } from '../../domain/entities/notification.entity';
import { getCategoryLabel } from '../../data/models/notifications.dtos';
import { colors } from '../../../../core/theme/colors';
import { spacing } from '../../../../core/theme/spacing';
import { typography } from '../../../../core/theme/typography';

interface NotificationCategoryBadgeProps {
  category: NotificationCategory;
  size?: 'small' | 'medium';
}

const categoryConfig: Record<NotificationCategory, { icon: keyof typeof Ionicons.glyphMap; color: string }> = {
  appointments: { icon: 'calendar', color: colors.primary.main },
  billing: { icon: 'card', color: colors.success.main },
  clinical: { icon: 'medkit', color: colors.secondary.main },
  system: { icon: 'settings', color: colors.grey[600] },
  general: { icon: 'notifications', color: colors.info.main },
};

export function NotificationCategoryBadge({ category, size = 'small' }: NotificationCategoryBadgeProps) {
  const config = categoryConfig[category] || categoryConfig.general;
  const isSmall = size === 'small';

  return (
    <View style={[styles.badge, { backgroundColor: config.color + '15' }]}>
      <Ionicons 
        name={config.icon} 
        size={isSmall ? 12 : 14} 
        color={config.color} 
      />
      <Text style={[styles.label, isSmall && styles.labelSmall, { color: config.color }]}>
        {getCategoryLabel(category)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs / 2,
    borderRadius: 12,
    gap: spacing.xs / 2,
  },
  label: {
    ...typography.caption,
    fontWeight: '500',
  },
  labelSmall: {
    fontSize: 10,
  },
});
