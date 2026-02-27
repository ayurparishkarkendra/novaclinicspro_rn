/**
 * Cost Display Component
 * Displays cost with currency support and formatting
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useClinicTheme } from '../../../../core/theme/useClinicTheme';
import { formatCostRange } from '../../data/models/cost.helpers';

// ============================================
// TYPES
// ============================================

interface CostDisplayProps {
  /** Minimum cost (for range display) */
  min?: number;
  /** Maximum cost (for range display) */
  max?: number;
  /** Single cost amount (if not using range) */
  amount?: number;
  /** Currency code (default: INR) */
  currency?: string;
  /** Label to display before cost */
  label?: string;
  /** Size variant */
  size?: 'small' | 'medium' | 'large';
  /** Show as inline (horizontal layout) */
  inline?: boolean;
}

// ============================================
// COMPONENT
// ============================================

export const CostDisplay: React.FC<CostDisplayProps> = ({
  min,
  max,
  amount,
  currency = 'INR',
  label = 'Cost',
  size = 'medium',
  inline = false,
}) => {
  const theme = useClinicTheme();

  // Determine the display text
  const displayText = amount !== undefined
    ? formatCostRange(amount, amount, currency)
    : formatCostRange(min, max, currency);

  const textSize = size === 'small' ? 12 : size === 'large' ? 18 : 14;
  const labelSize = size === 'small' ? 11 : size === 'large' ? 14 : 12;

  return (
    <View
      style={[
        inline ? styles.containerInline : styles.containerStacked,
        inline && styles.containerInlineGap,
      ]}
      accessibilityLabel={`${label}: ${displayText}`}
      accessibilityRole="text"
    >
      <Text
        style={[
          styles.label,
          { fontSize: labelSize, color: theme.colors.text.secondary },
        ]}
      >
        {label}:
      </Text>
      <Text
        style={[
          styles.amount,
          { fontSize: textSize, color: theme.colors.text.primary },
        ]}
      >
        {displayText}
      </Text>
    </View>
  );
};

// ============================================
// STYLES
// ============================================

const styles = StyleSheet.create({
  containerStacked: {
    flexDirection: 'column',
    gap: 2,
  },
  containerInline: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  containerInlineGap: {
    gap: 6,
  },
  label: {
    fontWeight: '500',
  },
  amount: {
    fontWeight: '600',
  },
});
