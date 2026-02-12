/**
 * Notification Preferences Screen
 * User settings screen for managing notification preferences
 */

import React from 'react';
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
import { useRouter } from 'expo-router';
import { useAuth } from '../../../auth/presentation/hooks/useAuth';
import { useNotificationPreferencesQuery } from '../../data/repositories/notificationPreferences.repository.impl';
import {
  eventTypeCategories,
  getEventTypeLabel,
  getEventTypeDescription,
  getChannelLabel,
  NotificationEventType,
  NotificationChannel,
} from '../../data/models/notificationPreferences.dtos';
import { colors } from '../../../../core/theme/colors';
import { spacing } from '../../../../core/theme/spacing';
import { typography } from '../../../../core/theme/typography';

// Placeholder preferences for when API is unavailable
const placeholderPreferences: Array<{
  eventType: NotificationEventType;
  channels: NotificationChannel[];
}> = [
  { eventType: 'appointment_reminder', channels: ['in_app', 'email', 'sms'] },
  { eventType: 'appointment_cancelled', channels: ['in_app', 'email'] },
  { eventType: 'appointment_rescheduled', channels: ['in_app', 'email'] },
  { eventType: 'payment_received', channels: ['in_app', 'email'] },
  { eventType: 'invoice_generated', channels: ['in_app', 'email'] },
  { eventType: 'payment_due', channels: ['in_app', 'email', 'sms'] },
  { eventType: 'clinical_document_ready', channels: ['in_app', 'email'] },
  { eventType: 'prescription_ready', channels: ['in_app', 'email'] },
  { eventType: 'system_maintenance', channels: ['in_app', 'email'] },
  { eventType: 'security_alert', channels: ['in_app', 'email', 'sms'] },
];

export function NotificationPreferencesScreen() {
  const router = useRouter();
  const { currentUser } = useAuth();
  const userId = currentUser?.id || '';

  const { data: preferences, isLoading } = useNotificationPreferencesQuery(userId);

  const handleBack = () => {
    router.back();
  };

  // API not available - show placeholder UI
  const isApiNotAvailable = !isLoading && (!preferences || preferences.length === 0);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={handleBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </Pressable>
        <Text style={styles.headerTitle}>Notification Preferences</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {isLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary.main} />
          </View>
        )}

        {isApiNotAvailable && (
          <>
            {/* Coming Soon Banner */}
            <View style={styles.comingSoonBanner}>
              <Ionicons name="construct" size={32} color={colors.warning.main} />
              <Text style={styles.comingSoonTitle}>Coming Soon</Text>
              <Text style={styles.comingSoonText}>
                Notification preferences are not yet available in your environment.
                Once enabled, you&apos;ll be able to customize how and when you receive notifications.
              </Text>
            </View>

            {/* Preview of what preferences will look like */}
            <View style={styles.previewSection}>
              <Text style={styles.previewTitle}>Preview: Available Settings</Text>
              <Text style={styles.previewSubtitle}>
                When available, you&apos;ll be able to configure these notification types:
              </Text>

              {eventTypeCategories.map((category) => (
                <View key={category.id} style={styles.categorySection}>
                  <View style={styles.categoryHeader}>
                    <Text style={styles.categoryTitle}>{category.label}</Text>
                  </View>
                  {category.eventTypes.map((eventType) => {
                    const placeholder = placeholderPreferences.find(p => p.eventType === eventType);
                    return (
                      <View key={eventType} style={styles.preferenceItem}>
                        <View style={styles.preferenceContent}>
                          <Text style={styles.preferenceLabel}>
                            {getEventTypeLabel(eventType)}
                          </Text>
                          <Text style={styles.preferenceDescription}>
                            {getEventTypeDescription(eventType)}
                          </Text>
                          {placeholder && (
                            <View style={styles.channelTags}>
                              {placeholder.channels.map((channel) => (
                                <View key={channel} style={styles.channelTag}>
                                  <Text style={styles.channelTagText}>
                                    {getChannelLabel(channel)}
                                  </Text>
                                </View>
                              ))}
                            </View>
                          )}
                        </View>
                        <View style={styles.disabledSwitch}>
                          <Ionicons name="toggle" size={36} color={colors.grey[300]} />
                        </View>
                      </View>
                    );
                  })}
                </View>
              ))}
            </View>
          </>
        )}

        {!isLoading && !isApiNotAvailable && preferences && preferences.length > 0 && (
          <View style={styles.preferencesContainer}>
            {/* Real preferences would render here when API is available */}
            {eventTypeCategories.map((category) => {
              const categoryPrefs = preferences.filter(p =>
                category.eventTypes.includes(p.eventType)
              );
              if (categoryPrefs.length === 0) return null;
              
              return (
                <View key={category.id} style={styles.categorySection}>
                  <View style={styles.categoryHeader}>
                    <Text style={styles.categoryTitle}>{category.label}</Text>
                  </View>
                  {categoryPrefs.map((pref) => (
                    <View key={pref.id} style={styles.preferenceItem}>
                      <View style={styles.preferenceContent}>
                        <Text style={styles.preferenceLabel}>
                          {getEventTypeLabel(pref.eventType)}
                        </Text>
                        <Text style={styles.preferenceDescription}>
                          {getChannelLabel(pref.channel)}
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>
              );
            })}
          </View>
        )}
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
  previewSection: {
    backgroundColor: colors.background.paper,
    borderRadius: 12,
    overflow: 'hidden',
  },
  previewTitle: {
    ...typography.subtitle1,
    color: colors.text.primary,
    padding: spacing.md,
    paddingBottom: spacing.xs,
  },
  previewSubtitle: {
    ...typography.body2,
    color: colors.text.secondary,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
  },
  preferencesContainer: {
    backgroundColor: colors.background.paper,
    borderRadius: 12,
    overflow: 'hidden',
  },
  categorySection: {
    marginBottom: spacing.sm,
  },
  categoryHeader: {
    backgroundColor: colors.grey[100],
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  categoryTitle: {
    ...typography.subtitle2,
    color: colors.text.primary,
  },
  preferenceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  preferenceContent: {
    flex: 1,
    marginRight: spacing.md,
  },
  preferenceLabel: {
    ...typography.subtitle2,
    color: colors.text.primary,
    marginBottom: spacing.xs / 2,
  },
  preferenceDescription: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  channelTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  channelTag: {
    backgroundColor: colors.primary.main + '15',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: 10,
  },
  channelTagText: {
    ...typography.caption,
    color: colors.primary.main,
    fontSize: 10,
  },
  disabledSwitch: {
    opacity: 0.4,
  },
});
