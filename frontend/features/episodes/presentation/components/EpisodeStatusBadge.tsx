/**
 * Episode Status Badge Component
 * Displays episode status (ACTIVE/CLOSED) with appropriate colors
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useClinicTheme } from '../../../../core/theme/useClinicTheme';
import { getStatusColor, getStatusLabel } from '../../data/models/episodes.dtos';

// ============================================
// TYPES
// ============================================

interface EpisodeStatusBadgeProps {
  status: 'ACTIVE' | 'CLOSED';
  size?: 'small' | 'medium';
}

// ============================================
// COMPONENT
// ============================================

export const EpisodeStatusBadge: React.FC<EpisodeStatusBadgeProps> = ({
  status,
  size = 'medium',
}) => {
  const theme = useClinicTheme();
  const statusColor = getStatusColor(status);
  const statusLabel = getStatusLabel(status);

  return (
    <View
      style={[
        styles.badge,
        size === 'small' && styles.badgeSmall,
        { backgroundColor: statusColor + '15' },
      ]}
      accessibilityLabel={`Status: ${statusLabel}`}
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
