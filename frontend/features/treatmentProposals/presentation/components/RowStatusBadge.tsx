/**
 * Row Status Badge Component
 * Displays treatment sheet row status with appropriate colors
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useClinicTheme } from '../../../../core/theme/useClinicTheme';
import {
  RowStatus,
  getRowStatusLabel,
  getRowStatusColor,
} from '../../data/models/treatmentProposals.dtos';

// ============================================
// TYPES
// ============================================

interface RowStatusBadgeProps {
  status: RowStatus;
  size?: 'small' | 'medium';
}

// ============================================
// COMPONENT
// ============================================

export const RowStatusBadge: React.FC<RowStatusBadgeProps> = ({
  status,
  size = 'medium',
}) => {
  const theme = useClinicTheme();
  const statusColor = getRowStatusColor(status);
  const statusLabel = getRowStatusLabel(status);

  return (
    <View
      style={[
        styles.badge,
        size === 'small' && styles.badgeSmall,
        { backgroundColor: statusColor + '15' },
      ]}
      accessibilityLabel={`Row status: ${statusLabel}`}
      accessibilityRole="text"
    >
      <View style={[styles.dot, { backgroundColor: statusColor }]} />
      <Text
        style={[
          styles.text,
          size === 'small' && styles.textSmall,
          { color: statusColor },
        ]}
      >
        {statusLabel}
      </Text>
    </View>
  );
};

// ============================================
// STYLES
// ============================================

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    gap: 5,
  },
  badgeSmall: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    gap: 4,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  text: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  textSmall: {
    fontSize: 11,
  },
});
