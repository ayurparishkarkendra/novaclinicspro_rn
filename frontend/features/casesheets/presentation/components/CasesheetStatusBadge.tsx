/**
 * Casesheet Status Badge Component
 * Displays document status with appropriate styling
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../../core/theme/colors';
import { spacing } from '../../../../core/theme/spacing';
import { typography } from '../../../../core/theme/typography';
import { CasesheetStatus, getStatusLabel, getStatusColor } from '../../data/models/casesheets.dtos';

interface CasesheetStatusBadgeProps {
  status: CasesheetStatus;
  size?: 'small' | 'medium' | 'large';
  showIcon?: boolean;
}

export const CasesheetStatusBadge: React.FC<CasesheetStatusBadgeProps> = ({
  status,
  size = 'medium',
  showIcon = true,
}) => {
  const statusColor = getStatusColor(status);
  const label = getStatusLabel(status);

  const getIcon = (): keyof typeof Ionicons.glyphMap => {
    switch (status) {
      case 'DRAFT':
        return 'create-outline';
      case 'FINAL':
        return 'checkmark-circle-outline';
      case 'SIGNED':
        return 'shield-checkmark-outline';
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
