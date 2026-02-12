/**
 * Notifications Icon with Badge Component
 * Icon button with unread count badge for embedding in headers
 */

import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Link } from 'expo-router';
import { colors } from '../../../../core/theme/colors';
import { spacing } from '../../../../core/theme/spacing';

interface NotificationsIconWithBadgeProps {
  unreadCount: number;
  size?: number;
  color?: string;
  onPress?: () => void;
}

export function NotificationsIconWithBadge({ 
  unreadCount, 
  size = 24, 
  color = colors.text.primary,
  onPress 
}: NotificationsIconWithBadgeProps) {
  const showBadge = unreadCount > 0;
  const badgeText = unreadCount > 99 ? '99+' : String(unreadCount);

  const content = (
    <View style={styles.container}>
      <Ionicons name="notifications-outline" size={size} color={color} />
      {showBadge && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{badgeText}</Text>
        </View>
      )}
    </View>
  );

  if (onPress) {
    return (
      <Pressable 
        onPress={onPress}
        style={styles.pressable}
        accessibilityRole="button"
        accessibilityLabel={`Notifications. ${unreadCount} unread.`}
      >
        {content}
      </Pressable>
    );
  }

  return (
    <Link href="/notifications" asChild>
      <Pressable 
        style={styles.pressable}
        accessibilityRole="button"
        accessibilityLabel={`Notifications. ${unreadCount} unread.`}
      >
        {content}
      </Pressable>
    </Link>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  pressable: {
    padding: spacing.xs,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.error.main,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: colors.text.light,
    fontSize: 10,
    fontWeight: '700',
  },
});
