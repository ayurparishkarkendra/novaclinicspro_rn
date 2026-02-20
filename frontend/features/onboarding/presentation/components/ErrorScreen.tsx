/**
 * ErrorScreen Component
 * Displays error state with retry option
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useClinicTheme } from '../../../../core/theme/useClinicTheme';

interface ErrorScreenProps {
  message: string;
  onRetry?: () => void;
}

export const ErrorScreen: React.FC<ErrorScreenProps> = ({ message, onRetry }) => {
  const theme = useClinicTheme();

  return (
    <View style={[styles.container, { 
      backgroundColor: theme.colors.background.default,
      padding: theme.spacing.xl 
    }]}>
      <Ionicons 
        name="alert-circle" 
        size={64} 
        color={theme.colors.feedback.error} 
      />
      <Text style={[
        styles.title, 
        theme.typography.h4, 
        { 
          color: theme.colors.text.primary,
          marginTop: theme.spacing.md,
          marginBottom: theme.spacing.sm 
        }
      ]}>
        Something went wrong
      </Text>
      <Text style={[
        styles.message, 
        theme.typography.body1, 
        { 
          color: theme.colors.text.secondary,
          marginBottom: theme.spacing.lg 
        }
      ]}>
        {message}
      </Text>
      {onRetry && (
        <TouchableOpacity
          style={[styles.retryButton, { 
            backgroundColor: theme.colors.primary.default,
            paddingHorizontal: theme.spacing.lg,
            paddingVertical: 12 
          }]}
          onPress={onRetry}
        >
          <Text style={[
            theme.typography.button, 
            { color: theme.colors.text.onPrimary }
          ]}>
            Try Again
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    textAlign: 'center',
  },
  message: {
    textAlign: 'center',
  },
  retryButton: {
    borderRadius: 8,
  },
});
