/**
 * ErrorState Component
 * Displays error message with retry option
 */

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRbacTheme } from '../hooks/useRbacTheme';
import { spacing } from '../../../../core/theme/spacing';
import { typography } from '../../../../core/theme/typography';

interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Something went wrong',
  message,
  onRetry,
}) => {
  const { colors } = useRbacTheme();

  return (
    <View style={styles.container} accessible={true}>
      <View style={[styles.iconContainer, { backgroundColor: colors.feedback.error + '20' }]}>
        <Ionicons name="alert-circle" size={48} color={colors.feedback.error} />
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
      {onRetry && (
        <TouchableOpacity
          style={[styles.button, { backgroundColor: colors.primary.main }]}
          onPress={onRetry}
          accessibilityRole="button"
          accessibilityLabel="Retry"
        >
          <Ionicons name="refresh" size={18} color="#FFFFFF" />
          <Text style={styles.buttonText}>Try Again</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  iconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    ...typography.h6,
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  message: {
    ...typography.body2,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: 8,
  },
  buttonText: {
    ...typography.body2,
    color: '#FFFFFF',
    fontWeight: '600',
  },
});
