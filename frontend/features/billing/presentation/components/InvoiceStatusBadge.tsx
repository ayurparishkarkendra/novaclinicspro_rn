/**
 * Invoice Status Badge Component
 * Displays invoice status with appropriate color coding
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { typography } from '../../../../core/theme/typography';
import { getInvoiceStatusInfo } from '../../data/models/billing.dtos';

interface InvoiceStatusBadgeProps {
  status: string;
  size?: 'small' | 'medium';
}

export const InvoiceStatusBadge: React.FC<InvoiceStatusBadgeProps> = ({
  status,
  size = 'medium',
}) => {
  const { label, color } = getInvoiceStatusInfo(status);

  return (
    <View
      style={[
        styles.badge,
        size === 'small' && styles.badgeSmall,
        { backgroundColor: color + '15' },
      ]}
    >
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text
        style={[
          styles.text,
          size === 'small' && styles.textSmall,
          { color },
        ]}
      >
        {label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  badgeSmall: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  text: {
    ...typography.body2,
    fontWeight: '600',
  },
  textSmall: {
    ...typography.caption,
    fontWeight: '600',
  },
});
