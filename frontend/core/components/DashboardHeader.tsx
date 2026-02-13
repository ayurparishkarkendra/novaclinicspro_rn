import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Link } from 'expo-router';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';

interface DashboardHeaderProps {
  title: string;
  subtitle?: string;
  userName?: string;
  onBackPress?: () => void;
  onNotificationPress?: () => void;
  onProfilePress?: () => void;
  onLogoutPress?: () => void;
  notificationCount?: number;
  showNotifications?: boolean;
  rightAction?: React.ReactNode;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  title,
  subtitle,
  userName,
  onBackPress,
  onNotificationPress,
  onProfilePress,
  onLogoutPress,
  notificationCount = 0,
  showNotifications = true,
  rightAction,
}) => {
  const renderNotificationButton = () => {
    const button = (
      <View style={styles.iconButton}>
        <Ionicons
          name="notifications-outline"
          size={24}
          color={colors.text.primary}
        />
        {notificationCount > 0 && (
          <View style={styles.badgeWithCount}>
            <Text style={styles.badgeText}>
              {notificationCount > 99 ? '99+' : notificationCount}
            </Text>
          </View>
        )}
      </View>
    );

    // If custom handler provided, use TouchableOpacity
    if (onNotificationPress) {
      return (
        <TouchableOpacity
          onPress={onNotificationPress}
          activeOpacity={0.7}
          accessibilityLabel={`Notifications. ${notificationCount} unread.`}
          accessibilityRole="button"
        >
          {button}
        </TouchableOpacity>
      );
    }

    // Default: Link to notifications screen
    return (
      <Link href="/notifications" asChild>
        <TouchableOpacity
          activeOpacity={0.7}
          accessibilityLabel={`Notifications. ${notificationCount} unread.`}
          accessibilityRole="button"
        >
          {button}
        </TouchableOpacity>
      </Link>
    );
  };

  return (
    <View style={styles.container}>
      {onBackPress && (
        <TouchableOpacity
          style={styles.backButton}
          onPress={onBackPress}
          activeOpacity={0.7}
          accessibilityLabel="Go back"
          accessibilityRole="button"
        >
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </TouchableOpacity>
      )}
      <View style={[styles.leftSection, onBackPress && styles.leftSectionWithBack]}>
        <Text style={styles.title}>{title}</Text>
        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
        {userName && (
          <Text style={styles.userName}>Welcome, {userName}</Text>
        )}
      </View>
      <View style={styles.rightSection}>
        {rightAction}
        {showNotifications && renderNotificationButton()}
        {onProfilePress && (
          <TouchableOpacity
            style={styles.profileButton}
            onPress={onProfilePress}
            activeOpacity={0.7}
          >
            <Ionicons name="person-circle" size={32} color={colors.primary.main} />
          </TouchableOpacity>
        )}
        {onLogoutPress && (
          <TouchableOpacity
            style={styles.logoutButton}
            onPress={onLogoutPress}
            activeOpacity={0.7}
          >
            <Ionicons name="log-out-outline" size={24} color={colors.error.main} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    backgroundColor: colors.background.default,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  leftSection: {
    flex: 1,
  },
  leftSectionWithBack: {
    marginLeft: spacing.xs,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.grey[100],
  },
  title: {
    ...typography.h4,
    color: colors.text.primary,
  },
  subtitle: {
    ...typography.body2,
    color: colors.text.secondary,
    marginTop: 2,
  },
  userName: {
    ...typography.body2,
    color: colors.text.secondary,
    marginTop: 4,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.grey[100],
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.error.main,
  },
  badgeWithCount: {
    position: 'absolute',
    top: -2,
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
  profileButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.error.main + '15',
  },
});
