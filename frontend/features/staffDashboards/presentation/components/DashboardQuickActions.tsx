/**
 * Dashboard Quick Actions Component
 * Row of action buttons for dashboards
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../../core/theme/colors';
import { spacing } from '../../../../core/theme/spacing';
import { typography } from '../../../../core/theme/typography';

export interface QuickAction {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  color?: string;
  variant?: 'primary' | 'secondary' | 'outline';
}

interface DashboardQuickActionsProps {
  actions: QuickAction[];
}

export const DashboardQuickActions: React.FC<DashboardQuickActionsProps> = ({ actions }) => {
  const getButtonStyle = (action: QuickAction) => {
    const baseColor = action.color || colors.primary.main;
    
    switch (action.variant) {
      case 'primary':
        return {
          backgroundColor: baseColor,
          borderColor: baseColor,
        };
      case 'outline':
        return {
          backgroundColor: 'transparent',
          borderColor: baseColor,
        };
      default:
        return {
          backgroundColor: baseColor + '15',
          borderColor: 'transparent',
        };
    }
  };

  const getTextColor = (action: QuickAction) => {
    const baseColor = action.color || colors.primary.main;
    return action.variant === 'primary' ? colors.background.default : baseColor;
  };

  return (
    <View style={styles.container}>
      {actions.map((action, index) => (
        <TouchableOpacity
          key={index}
          style={[
            styles.actionButton,
            getButtonStyle(action),
          ]}
          onPress={action.onPress}
          activeOpacity={0.7}
        >
          <Ionicons
            name={action.icon}
            size={18}
            color={getTextColor(action)}
          />
          <Text
            style={[styles.actionLabel, { color: getTextColor(action) }]}
            numberOfLines={1}
          >
            {action.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 10,
    borderWidth: 1,
    gap: spacing.xs,
  },
  actionLabel: {
    ...typography.button,
    fontSize: 13,
  },
});
