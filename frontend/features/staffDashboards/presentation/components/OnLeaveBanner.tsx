/**
 * On Leave Banner Component
 * Shows when the staff member is on leave today
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../../core/theme/colors';
import { spacing } from '../../../../core/theme/spacing';
import { typography } from '../../../../core/theme/typography';

interface OnLeaveBannerProps {
  message?: string;
}

export const OnLeaveBanner: React.FC<OnLeaveBannerProps> = ({
  message = "You're on leave today. Enjoy your day off!",
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <Ionicons name="sunny" size={24} color={colors.warning.main} />
      </View>
      <View style={styles.textContainer}>
        <Text style={styles.title}>On Leave Today</Text>
        <Text style={styles.message}>{message}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.warning.main + '15',
    borderRadius: 12,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.warning.main + '30',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.warning.main + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    ...typography.body1,
    color: colors.warning.dark,
    fontWeight: '600',
    marginBottom: 2,
  },
  message: {
    ...typography.body2,
    color: colors.text.secondary,
  },
});
