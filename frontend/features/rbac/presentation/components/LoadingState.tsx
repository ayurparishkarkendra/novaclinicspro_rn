/**
 * LoadingState Component
 * Full-screen loading indicator
 */

import React from 'react';
import {
  View,
  Text,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { useRbacTheme } from '../hooks/useRbacTheme';
import { spacing } from '../../../../core/theme/spacing';
import { typography } from '../../../../core/theme/typography';

interface LoadingStateProps {
  message?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  message = 'Loading...',
}) => {
  const { colors } = useRbacTheme();

  return (
    <View style={styles.container} accessible={true} accessibilityRole="progressbar">
      <ActivityIndicator size="large" color={colors.primary.main} />
      <Text style={styles.message}>{message}</Text>
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
  message: {
    ...typography.body2,
    color: '#6B7280',
    marginTop: spacing.md,
  },
});
