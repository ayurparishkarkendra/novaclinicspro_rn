/**
 * Treatment Sheet Status Badge Component
 * Displays treatment sheet status with appropriate colors
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useClinicTheme } from '../../../../core/theme/useClinicTheme';
import {
  TreatmentSheetStatus,
  getTreatmentSheetStatusLabel,
  getTreatmentSheetStatusColor,
} from '../../data/models/treatmentProposals.dtos';

// ============================================
// TYPES
// ============================================

interface TreatmentSheetStatusBadgeProps {
  status: TreatmentSheetStatus;
  size?: 'small' | 'medium';
}

// ============================================
// COMPONENT
// ============================================

export const TreatmentSheetStatusBadge: React.FC<TreatmentSheetStatusBadgeProps> = ({
  status,
  size = 'medium',
}) => {
  const theme = useClinicTheme();
  const statusColor = getTreatmentSheetStatusColor(status);
  const statusLabel = getTreatmentSheetStatusLabel(status);

  return (
    <View
      style={[
        styles.badge,
        size === 'small' && styles.badgeSmall,
        { backgroundColor: statusColor + '15' },
      ]}
      accessibilityLabel={`Treatment sheet status: ${statusLabel}`}
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
