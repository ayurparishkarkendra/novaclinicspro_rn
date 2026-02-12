/**
 * Notification Channel Section Component
 * Groups notification preferences by channel (In-App, Email, SMS)
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NotificationChannel } from '../../domain/entities/notification-preference.entity';
import { getChannelLabel } from '../../data/models/notificationPreferences.dtos';
import { colors } from '../../../../core/theme/colors';
import { spacing } from '../../../../core/theme/spacing';
import { typography } from '../../../../core/theme/typography';

interface NotificationChannelSectionProps {
  channel: NotificationChannel;
  children: React.ReactNode;
  available?: boolean;
}

const channelIcons: Record<NotificationChannel, keyof typeof Ionicons.glyphMap> = {
  in_app: 'phone-portrait-outline',
  email: 'mail-outline',
  sms: 'chatbubble-outline',
};

export function NotificationChannelSection({
  channel,
  children,
  available = false,
}: NotificationChannelSectionProps) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name={channelIcons[channel]} size={20} color={colors.text.primary} />
          <Text style={styles.headerTitle}>{getChannelLabel(channel)}</Text>
        </View>
        {!available && (
          <View style={styles.unavailableBadge}>
            <Text style={styles.unavailableText}>Coming Soon</Text>
          </View>
        )}
      </View>
      <View style={[styles.content, !available && styles.contentDisabled]}>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.grey[100],
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  headerTitle: {
    ...typography.subtitle1,
    color: colors.text.primary,
  },
  unavailableBadge: {
    backgroundColor: colors.warning.main + '20',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs / 2,
    borderRadius: 12,
  },
  unavailableText: {
    ...typography.caption,
    color: colors.warning.dark,
    fontWeight: '500',
  },
  content: {
    backgroundColor: colors.background.paper,
  },
  contentDisabled: {
    opacity: 0.5,
  },
});
