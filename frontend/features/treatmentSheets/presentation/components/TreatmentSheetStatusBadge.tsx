/**
 * Treatment Sheet Status Badge Component
 * Displays document status with appropriate styling
 * Updated to support multi-day therapy workflow statuses
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useClinicTheme } from '../../../../core/theme/useClinicTheme';
import { spacing } from '../../../../core/theme/spacing';
import { TreatmentSheetStatus, getStatusLabel, getStatusColor } from '../../data/models/treatmentSheets.dtos';

interface TreatmentSheetStatusBadgeProps {
  status: TreatmentSheetStatus;
  size?: 'small' | 'medium' | 'large';
  showIcon?: boolean;
}

export const TreatmentSheetStatusBadge: React.FC<TreatmentSheetStatusBadgeProps> = ({
  status,
  size = 'medium',
  showIcon = true,
}) => {
  const theme = useClinicTheme();
  const statusColor = getStatusColor(status);
  const label = getStatusLabel(status);

  const getIcon = (): keyof typeof Ionicons.glyphMap => {
    switch (status) {
      case 'DRAFT':
        return 'create-outline';
      case 'SCHEDULED':
        return 'calendar-outline';
      case 'IN_PROGRESS':
        return 'play-circle-outline';
      case 'COMPLETED':
        return 'checkmark-circle-outline';
      case 'CANCELLED':
        return 'close-circle-outline';
      case 'PAUSED':
        return 'pause-circle-outline';
      case 'SIGNED':
        return 'shield-checkmark-outline';
      case 'FINAL':
        return 'checkmark-circle-outline';
      default:
        return 'document-outline';
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return {
          paddingHorizontal: spacing.xs,
          paddingVertical: 2,
          fontSize: 10,
          iconSize: 12,
        };
      case 'large':
        return {
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.sm,
          fontSize: 14,
          iconSize: 18,
        };
      default:
        return {
          paddingHorizontal: spacing.sm,
          paddingVertical: 4,
          fontSize: 12,
          iconSize: 14,
        };
    }
  };

  const sizeStyles = getSizeStyles();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: statusColor + '20',
          paddingHorizontal: sizeStyles.paddingHorizontal,
          paddingVertical: sizeStyles.paddingVertical,
        },
      ]}
    >
      {showIcon && (
        <Ionicons
          name={getIcon()}
          size={sizeStyles.iconSize}
          color={statusColor}
          style={styles.icon}
        />
      )}
      <Text
        style={[
          styles.label,
          { color: statusColor, fontSize: sizeStyles.fontSize },
        ]}
      >
        {label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 6,
  },
  icon: {
    marginRight: 4,
  },
  label: {
    fontWeight: '600',
  },
});
