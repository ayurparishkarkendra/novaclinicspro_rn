/**
 * DemoStatusBanner Component
 * Shows sample clinic and commercial trial countdown actions
 */

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useClinicTheme } from '../../../../core/theme/useClinicTheme';

interface DemoStatusBannerProps {
  demoExpiresAt: string;
  trialExpiresAt: string;
  isDemoExpired: boolean;
  isTrialExpired: boolean;
  onExtendDemo?: () => void;
  onTransitionToLive?: () => void;
  canExtendDemo?: boolean;
}

export const DemoStatusBanner: React.FC<DemoStatusBannerProps> = ({
  demoExpiresAt,
  trialExpiresAt,
  isDemoExpired,
  isTrialExpired,
  onExtendDemo,
  onTransitionToLive,
  canExtendDemo = true,
}) => {
  const theme = useClinicTheme();
  const [demoTimeRemaining, setDemoTimeRemaining] = useState('');
  const [trialTimeRemaining, setTrialTimeRemaining] = useState('');

  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date().getTime();
      const demoEnd = new Date(demoExpiresAt).getTime();
      const trialEnd = new Date(trialExpiresAt).getTime();

      // Demo countdown
      const demoDistance = demoEnd - now;
      if (demoDistance > 0) {
        const days = Math.floor(demoDistance / (1000 * 60 * 60 * 24));
        const hours = Math.floor((demoDistance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        setDemoTimeRemaining(`${days}d ${hours}h`);
      } else {
        setDemoTimeRemaining('Expired');
      }

      // Trial countdown
      const trialDistance = trialEnd - now;
      if (trialDistance > 0) {
        const days = Math.floor(trialDistance / (1000 * 60 * 60 * 24));
        const hours = Math.floor((trialDistance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        setTrialTimeRemaining(`${days}d ${hours}h`);
      } else {
        setTrialTimeRemaining('Expired');
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [demoExpiresAt, trialExpiresAt]);

  const getDemoColor = () => {
    const now = new Date().getTime();
    const demoEnd = new Date(demoExpiresAt).getTime();
    const daysRemaining = Math.floor((demoEnd - now) / (1000 * 60 * 60 * 24));

    if (daysRemaining > 3) return theme.colors.feedback.success;
    if (daysRemaining >= 1) return theme.colors.feedback.warning;
    return theme.colors.feedback.error;
  };

  const getTrialColor = () => {
    const now = new Date().getTime();
    const trialEnd = new Date(trialExpiresAt).getTime();
    const daysRemaining = Math.floor((trialEnd - now) / (1000 * 60 * 60 * 24));

    if (daysRemaining > 10) return theme.colors.feedback.success;
    if (daysRemaining >= 3) return theme.colors.feedback.warning;
    return theme.colors.feedback.error;
  };

  if (isDemoExpired && isTrialExpired) {
    return (
      <View
        style={[
          styles.banner,
          {
            backgroundColor: theme.colors.feedback.errorLight,
            padding: theme.spacing.md,
            marginBottom: theme.spacing.lg,
            borderRadius: 8,
            borderLeftWidth: 4,
            borderLeftColor: theme.colors.feedback.error,
          },
        ]}
      >
        <View style={[styles.header, { marginBottom: theme.spacing.sm }]}>
          <Ionicons name="alert-circle" size={24} color={theme.colors.feedback.error} />
          <Text
            style={[
              theme.typography.h6,
              { color: theme.colors.feedback.error, marginLeft: theme.spacing.sm },
            ]}
          >
            Commercial Trial Ended
          </Text>
        </View>
        <Text style={[theme.typography.body2, { color: theme.colors.text.secondary }]}>
          Your clinic data is safely stored. Choose a subscription plan to continue using Nova.
        </Text>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.banner,
        {
          backgroundColor: theme.colors.surface.elevated,
          padding: theme.spacing.md,
          marginBottom: theme.spacing.lg,
          borderRadius: 8,
          borderLeftWidth: 4,
          borderLeftColor: isDemoExpired ? getTrialColor() : getDemoColor(),
        },
      ]}
    >
      <View style={[styles.header, { marginBottom: theme.spacing.md }]}>
        <Ionicons
          name={isDemoExpired ? 'time' : 'flask'}
          size={24}
          color={isDemoExpired ? getTrialColor() : getDemoColor()}
        />
        <Text
          style={[
            theme.typography.h6,
            {
              color: theme.colors.text.primary,
              marginLeft: theme.spacing.sm,
              flex: 1,
            },
          ]}
        >
          {isDemoExpired ? 'Commercial Trial' : 'Sample Clinic'}
        </Text>
      </View>

      {!isDemoExpired && (
        <View style={[styles.countdown, { marginBottom: theme.spacing.sm }]}>
          <Text style={[theme.typography.body2, { color: theme.colors.text.secondary }]}>
            Sample access ends in:{' '}
          </Text>
          <Text
            style={[
              theme.typography.h6,
              { color: getDemoColor(), marginLeft: theme.spacing.xs },
            ]}
          >
            {demoTimeRemaining}
          </Text>
        </View>
      )}

      <View style={[styles.countdown, { marginBottom: theme.spacing.md }]}>
        <Text style={[theme.typography.body2, { color: theme.colors.text.secondary }]}>
          Commercial trial ends in:{' '}
        </Text>
        <Text
          style={[
            theme.typography.h6,
            { color: getTrialColor(), marginLeft: theme.spacing.xs },
          ]}
        >
          {trialTimeRemaining}
        </Text>
      </View>

      <View style={[styles.actions, { flexDirection: 'row', gap: theme.spacing.sm }]}>
        {!isDemoExpired && canExtendDemo && onExtendDemo && (
          <TouchableOpacity
            style={[
              styles.button,
              {
                backgroundColor: theme.colors.surface.default,
                borderColor: theme.colors.border.default,
                borderWidth: 1,
                padding: theme.spacing.sm,
                borderRadius: 4,
                flex: 1,
                alignItems: 'center',
              },
            ]}
            onPress={onExtendDemo}
          >
            <Text style={[theme.typography.button, { color: theme.colors.text.primary }]}>
              Extend Sample Access
            </Text>
          </TouchableOpacity>
        )}

        {onTransitionToLive && (
          <TouchableOpacity
            style={[
              styles.button,
              {
                backgroundColor: theme.colors.primary.default,
                padding: theme.spacing.sm,
                borderRadius: 4,
                flex: 1,
                alignItems: 'center',
              },
            ]}
            onPress={onTransitionToLive}
          >
            <Text style={[theme.typography.button, { color: theme.colors.text.onPrimary }]}>
              {isDemoExpired ? 'Choose Plan' : 'Ready to Start'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  banner: {
    // Styles set inline with theme
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  countdown: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actions: {
    // Styles set inline with theme
  },
  button: {
    // Styles set inline with theme
  },
});
