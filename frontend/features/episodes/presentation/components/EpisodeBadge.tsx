/**
 * Episode Badge Component
 * Compact badge for displaying episode info in lists (e.g., appointment lists)
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useClinicTheme } from '../../../../core/theme/useClinicTheme';
import { getStatusColor } from '../../data/models/episodes.dtos';

// ============================================
// TYPES
// ============================================

interface EpisodeBadgeProps {
  title: string;
  status?: 'ACTIVE' | 'CLOSED';
  onPress?: () => void;
}

// ============================================
// COMPONENT
// ============================================

export const EpisodeBadge: React.FC<EpisodeBadgeProps> = ({
  title,
  status,
  onPress,
}) => {
  const theme = useClinicTheme();
  const statusColor = status ? getStatusColor(status) : theme.colors.primary.default;

  const content = (
    <View
      style={[
        styles.badge,
        { 
          backgroundColor: statusColor + '10',
          borderColor: statusColor + '30',
        },
      ]}
    >
      <Ionicons name="folder-outline" size={12} color={statusColor} />
      <Text
        style={[styles.text, { color: statusColor }]}
        numberOfLines={1}
      >
        {title}
      </Text>
      {status && (
        <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
      )}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel={`Episode: ${title}`}
      >
        {content}
      </TouchableOpacity>
    );
  }

  return content;
};

// ============================================
// STYLES
// ============================================

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    gap: 4,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: 11,
    fontWeight: '600',
    maxWidth: 120,
  },
  statusDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
});
