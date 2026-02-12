/**
 * Notifications List Screen
 * Main screen for viewing all notifications
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../../../auth/presentation/hooks/useAuth';
import { useNotificationsListQuery } from '../../data/repositories/notifications.repository.impl';
import { NotificationListItem } from '../components/NotificationListItem';
import { Notification, NotificationCategory } from '../../domain/entities/notification.entity';
import { colors } from '../../../../core/theme/colors';
import { spacing } from '../../../../core/theme/spacing';
import { typography } from '../../../../core/theme/typography';

type FilterOption = 'all' | 'unread';

export function NotificationsListScreen() {
  const router = useRouter();
  const { currentUser } = useAuth();
  const tenantId = currentUser?.activeTenant?.id || '';
  
  const [filter, setFilter] = useState<FilterOption>('all');
  const [refreshing, setRefreshing] = useState(false);

  const { data, isLoading, error, refetch, isError } = useNotificationsListQuery(
    tenantId,
    { unread_only: filter === 'unread' }
  );

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const handleNotificationPress = (notification: Notification) => {
    router.push(`/notifications/${notification.id}`);
  };

  const handleBack = () => {
    router.back();
  };

  // Check if API is not available (empty results with no error)
  const isApiNotAvailable = !isLoading && !isError && data?.notifications.length === 0 && data?.total === 0;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={handleBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </Pressable>
        <Text style={styles.headerTitle}>Notifications</Text>
        <View style={styles.headerRight}>
          {data && data.unreadCount > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadBadgeText}>{data.unreadCount}</Text>
            </View>
          )}
        </View>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterTabs}>
        <Pressable
          style={[styles.filterTab, filter === 'all' && styles.filterTabActive]}
          onPress={() => setFilter('all')}
        >
          <Text style={[styles.filterTabText, filter === 'all' && styles.filterTabTextActive]}>
            All
          </Text>
        </Pressable>
        <Pressable
          style={[styles.filterTab, filter === 'unread' && styles.filterTabActive]}
          onPress={() => setFilter('unread')}
        >
          <Text style={[styles.filterTabText, filter === 'unread' && styles.filterTabTextActive]}>
            Unread
          </Text>
        </Pressable>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {isLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary.main} />
          </View>
        )}

        {isApiNotAvailable && (
          <View style={styles.emptyContainer}>
            <View style={styles.comingSoonBanner}>
              <Ionicons name="construct" size={32} color={colors.warning.main} />
              <Text style={styles.comingSoonTitle}>Coming Soon</Text>
              <Text style={styles.comingSoonText}>
                The Notifications feature is not yet available in your environment.
                Once enabled, you&apos;ll receive real-time updates about appointments,
                billing, clinical events, and system alerts here.
              </Text>
            </View>
            
            <View style={styles.placeholderList}>
              <Text style={styles.placeholderTitle}>What to expect:</Text>
              {[
                { icon: 'calendar', text: 'Appointment reminders and updates' },
                { icon: 'card', text: 'Billing and payment notifications' },
                { icon: 'medkit', text: 'Clinical document alerts' },
                { icon: 'settings', text: 'System announcements' },
              ].map((item, index) => (
                <View key={index} style={styles.placeholderItem}>
                  <Ionicons name={item.icon as any} size={20} color={colors.text.secondary} />
                  <Text style={styles.placeholderItemText}>{item.text}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {!isLoading && !isApiNotAvailable && data?.notifications.length === 0 && (
          <View style={styles.emptyContainer}>
            <Ionicons name="notifications-off-outline" size={48} color={colors.text.disabled} />
            <Text style={styles.emptyTitle}>No notifications</Text>
            <Text style={styles.emptyText}>
              {filter === 'unread' 
                ? 'You have no unread notifications.'
                : 'You have no notifications yet.'}
            </Text>
          </View>
        )}

        {!isLoading && data?.notifications.map((notification) => (
          <NotificationListItem
            key={notification.id}
            notification={notification}
            onPress={handleNotificationPress}
          />
        ))}
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
    alignItems: 'flex-end',
  },
  unreadBadge: {
    backgroundColor: colors.error.main,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: 12,
  },
  unreadBadgeText: {
    color: colors.text.light,
    fontSize: 12,
    fontWeight: '700',
  },
  filterTabs: {
    flexDirection: 'row',
    backgroundColor: colors.background.paper,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
    gap: spacing.sm,
  },
  filterTab: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 20,
    backgroundColor: colors.grey[100],
  },
  filterTabActive: {
    backgroundColor: colors.primary.main,
  },
  filterTabText: {
    ...typography.body2,
    color: colors.text.secondary,
    fontWeight: '500',
  },
  filterTabTextActive: {
    color: colors.text.light,
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  emptyContainer: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  comingSoonBanner: {
    backgroundColor: colors.warning.main + '15',
    borderWidth: 1,
    borderColor: colors.warning.main + '30',
    borderRadius: 12,
    padding: spacing.lg,
    alignItems: 'center',
    width: '100%',
    marginBottom: spacing.lg,
  },
  comingSoonTitle: {
    ...typography.h6,
    color: colors.warning.dark,
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
  comingSoonText: {
    ...typography.body2,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  placeholderList: {
    width: '100%',
    backgroundColor: colors.background.paper,
    borderRadius: 12,
    padding: spacing.md,
  },
  placeholderTitle: {
    ...typography.subtitle2,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  placeholderItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  placeholderItemText: {
    ...typography.body2,
    color: colors.text.secondary,
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
});
