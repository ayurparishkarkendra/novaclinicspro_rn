/**
 * ProgressBar Component
 * Displays setup progress with percentage
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useClinicTheme } from '../../../../core/theme/useClinicTheme';
import { useTranslation } from '../../../../core/localization/useTranslation';

interface ProgressBarProps {
  percentage: number;
  showLabel?: boolean;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  percentage,
  showLabel = true,
}) => {
  const theme = useClinicTheme();
  const { t } = useTranslation();

  return (
    <View style={styles.container}>
      {showLabel && (
        <View
          style={[styles.labelRow, { marginBottom: theme.spacing.xs }]}
        >
          <Text
            style={[
              theme.typography.body2,
              { color: theme.colors.text.secondary },
            ]}
          >
            {t('onboarding.progressiveExperience.flow.clinicPreparation')}
          </Text>
          <Text
            style={[
              theme.typography.h6,
              { color: theme.colors.primary.default },
            ]}
          >
            {percentage}%
          </Text>
        </View>
      )}
      <View
        style={[
          styles.track,
          {
            backgroundColor: theme.colors.border.subtle,
            height: 8,
            borderRadius: 4,
          },
        ]}
      >
        <View
          style={[
            styles.fill,
            {
              width: `${percentage}%`,
              backgroundColor: theme.colors.primary.default,
              height: 8,
              borderRadius: 4,
            },
          ]}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  track: {
    overflow: 'hidden',
  },
  fill: {
    // Width set dynamically
  },
});
