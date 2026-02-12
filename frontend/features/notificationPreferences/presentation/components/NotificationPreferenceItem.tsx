/**
 * Notification Preference Item Component
 * Shows a single preference setting with toggle or frequency selector
 */

import React from 'react';
import { View, Text, StyleSheet, Switch } from 'react-native';
import { NotificationPreference } from '../../domain/entities/notification-preference.entity';
import {
  getEventTypeLabel,
  getEventTypeDescription,
  getFrequencyLabel,
} from '../../data/models/notificationPreferences.dtos';
import { colors } from '../../../../core/theme/colors';
import { spacing } from '../../../../core/theme/spacing';
import { typography } from '../../../../core/theme/typography';

interface NotificationPreferenceItemProps {
  preference: NotificationPreference;
  onToggle: (enabled: boolean) => void;
  disabled?: boolean;
}

export function NotificationPreferenceItem({
  preference,
  onToggle,
  disabled = false,
}: NotificationPreferenceItemProps) {
  return (
    <View style={[styles.container, disabled && styles.disabled]}>
      <View style={styles.content}>
        <Text style={styles.label}>{getEventTypeLabel(preference.eventType)}</Text>
        <Text style={styles.description}>{getEventTypeDescription(preference.eventType)}</Text>
        {preference.frequency !== 'immediate' && preference.frequency !== 'off' && (
          <Text style={styles.frequency}>{getFrequencyLabel(preference.frequency)}</Text>
        )}
      </View>
      <Switch
        value={preference.enabled}
        onValueChange={onToggle}
        disabled={disabled}
        trackColor={{ false: colors.grey[300], true: colors.primary.main + '80' }}
        thumbColor={preference.enabled ? colors.primary.main : colors.grey[100]}
        accessibilityLabel={`${getEventTypeLabel(preference.eventType)} notifications ${preference.enabled ? 'enabled' : 'disabled'}`}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.background.paper,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  disabled: {
    opacity: 0.5,
  },
  content: {
    flex: 1,
    marginRight: spacing.md,
  },
  label: {
    ...typography.subtitle2,
    color: colors.text.primary,
    marginBottom: spacing.xs / 2,
  },
  description: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  frequency: {
    ...typography.caption,
    color: colors.primary.main,
    fontWeight: '500',
    marginTop: spacing.xs,
  },
});
