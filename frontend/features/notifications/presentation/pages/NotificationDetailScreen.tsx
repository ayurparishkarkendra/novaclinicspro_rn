/**
 * Notification Detail Screen
 * Shows full details of a single notification
 */

import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuth } from '../../../auth/presentation/hooks/useAuth';
import {
  useNotificationDetailQuery,
  useMarkNotificationReadMutation,
} from '../../data/repositories/notifications.repository.impl';
import { NotificationCategoryBadge } from '../components/NotificationCategoryBadge';
import { getTimeAgo, isHighPriority } from '../../domain/entities/notification.entity';
import { getImportanceLabel } from '../../data/models/notifications.dtos';
import { colors } from '../../../../core/theme/colors';
import { spacing } from '../../../../core/theme/spacing';
import { typography } from '../../../../core/theme/typography';

export function NotificationDetailScreen() {
  const router = useRouter();
  const { notificationId } = useLocalSearchParams<{ notificationId: string }>();
  const { currentUser } = useAuth();
  const tenantId = currentUser?.activeTenant?.id || '';

  const { data: notification, isLoading } = useNotificationDetailQuery(
    tenantId,
    notificationId || ''
  );

  const markReadMutation = useMarkNotificationReadMutation(tenantId);

  // Mark as read when viewed
  useEffect(() => {
    if (notification && !notification.isRead) {
      markReadMutation.mutate(notification.id);
    }
  }, [notification?.id, notification?.isRead]);

  const handleBack = () => {
    router.back();
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary.main} />
        </View>
      </SafeAreaView>
    );
  }

  if (!notification) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <Pressable onPress={handleBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
          </Pressable>
          <Text style={styles.headerTitle}>Notification</Text>
          <View style={styles.headerRight} />
        </View>
        <View style={styles.emptyContainer}>
          <Ionicons name="alert-circle-outline" size={48} color={colors.text.disabled} />
          <Text style={styles.emptyTitle}>Notification not found</Text>
          <Text style={styles.emptyText}>
            This notification may have been deleted or the Notifications API is not yet available.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const highPriority = isHighPriority(notification);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={handleBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </Pressable>
        <Text style={styles.headerTitle}>Notification</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.card}>
          {/* Title and Priority */}
          <View style={styles.titleRow}>
            <Text style={styles.title}>{notification.title}</Text>
            {highPriority && (
              <View style={styles.priorityBadge}>
                <Ionicons name="alert-circle" size={16} color={colors.error.main} />
                <Text style={styles.priorityText}>{getImportanceLabel(notification.importance)}</Text>
              </View>
            )}
          </View>

          {/* Category and Time */}
          <View style={styles.metaRow}>
            <NotificationCategoryBadge category={notification.category} size="medium" />
            <Text style={styles.time}>{getTimeAgo(notification)}</Text>
          </View>

          {/* Message */}
          <View style={styles.messageContainer}>
            <Text style={styles.message}>{notification.message}</Text>
          </View>

          {/* Status */}
          <View style={styles.statusRow}>
            <Ionicons 
              name={notification.isRead ? 'checkmark-circle' : 'ellipse-outline'} 
              size={16} 
              color={notification.isRead ? colors.success.main : colors.text.secondary} 
            />
            <Text style={[styles.statusText, notification.isRead && styles.statusTextRead]}>
              {notification.isRead ? 'Read' : 'Unread'}
            </Text>
          </View>

          {/* Timestamp */}
          <View style={styles.timestampContainer}>
            <Text style={styles.timestampLabel}>Received:</Text>
            <Text style={styles.timestampValue}>
              {notification.createdAt.toLocaleString()}
            </Text>
          </View>
          {notification.readAt && (
            <View style={styles.timestampContainer}>
              <Text style={styles.timestampLabel}>Read at:</Text>
              <Text style={styles.timestampValue}>
                {notification.readAt.toLocaleString()}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.default,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    backgroundColor: colors.background.paper,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  backButton: {
    padding: spacing.xs,
  },
  headerTitle: {
    ...typography.h6,
    color: colors.text.primary,
  },
  headerRight: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.md,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  emptyTitle: {
    ...typography.subtitle1,
    color: colors.text.primary,
    marginTop: spacing.md,
  },
  emptyText: {
    ...typography.body2,
    color: colors.text.secondary,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  card: {
    backgroundColor: colors.background.paper,
    borderRadius: 12,
    padding: spacing.lg,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  title: {
    ...typography.h6,
    color: colors.text.primary,
    flex: 1,
    marginRight: spacing.sm,
  },
  priorityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.error.main + '15',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs / 2,
    borderRadius: 12,
    gap: 4,
  },
  priorityText: {
    ...typography.caption,
    color: colors.error.main,
    fontWeight: '600',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  time: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  messageContainer: {
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.border.light,
    marginBottom: spacing.md,
  },
  message: {
    ...typography.body1,
    color: colors.text.primary,
    lineHeight: 24,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  statusText: {
    ...typography.body2,
    color: colors.text.secondary,
  },
  statusTextRead: {
    color: colors.success.main,
  },
  timestampContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  timestampLabel: {
    ...typography.caption,
    color: colors.text.secondary,
    width: 70,
  },
  timestampValue: {
    ...typography.caption,
    color: colors.text.primary,
  },
});
