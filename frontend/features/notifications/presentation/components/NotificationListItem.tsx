/**
 * Notification List Item Component
 * Displays a single notification in the list view
 */

import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Notification, getTimeAgo, isHighPriority } from '../../domain/entities/notification.entity';
import { NotificationCategoryBadge } from './NotificationCategoryBadge';
import { colors } from '../../../../core/theme/colors';
import { spacing } from '../../../../core/theme/spacing';
import { typography } from '../../../../core/theme/typography';

interface NotificationListItemProps {
  notification: Notification;
  onPress: (notification: Notification) => void;
}

export function NotificationListItem({ notification, onPress }: NotificationListItemProps) {
  const isUnread = !notification.isRead;
  const highPriority = isHighPriority(notification);

  return (
    <Pressable
      style={[styles.container, isUnread && styles.unread]}
      onPress={() => onPress(notification)}
      accessibilityRole="button"
      accessibilityLabel={`${notification.title}. ${notification.message}. ${isUnread ? 'Unread' : 'Read'}. ${getTimeAgo(notification)}`}
    >
      <View style={styles.leftIndicator}>
        {isUnread && <View style={[styles.unreadDot, highPriority && styles.urgentDot]} />}
      </View>
      
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <Text style={[styles.title, isUnread && styles.unreadTitle]} numberOfLines={1}>
              {notification.title}
            </Text>
            {highPriority && (
              <Ionicons name="alert-circle" size={16} color={colors.error.main} />
            )}
          </View>
          <Text style={styles.time}>{getTimeAgo(notification)}</Text>
        </View>
        
        <Text style={styles.message} numberOfLines={2}>
          {notification.message}
        </Text>
        
        <View style={styles.footer}>
          <NotificationCategoryBadge category={notification.category} />
        </View>
      </View>
      
      <Ionicons name="chevron-forward" size={20} color={colors.text.disabled} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.background.paper,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  unread: {
    backgroundColor: colors.primary.main + '08',
  },
  leftIndicator: {
    width: 12,
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary.main,
  },
  urgentDot: {
    backgroundColor: colors.error.main,
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.xs,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: spacing.sm,
    gap: spacing.xs,
  },
  title: {
    ...typography.subtitle2,
    color: colors.text.primary,
    flex: 1,
  },
  unreadTitle: {
    fontWeight: '700',
  },
  time: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  message: {
    ...typography.body2,
    color: colors.text.secondary,
    marginBottom: spacing.sm,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
