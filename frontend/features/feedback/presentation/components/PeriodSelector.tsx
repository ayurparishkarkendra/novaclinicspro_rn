/**
 * Period Selector Component
 * Period selector for KPI and feedback date filtering
 */

import React from 'react';
import { View, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { colors } from '../../../../core/theme/colors';
import { spacing } from '../../../../core/theme/spacing';
import { typography } from '../../../../core/theme/typography';
import type { KPIPeriod } from '../../data/models/feedback.dtos';

interface PeriodSelectorProps {
  value: KPIPeriod;
  onChange: (period: KPIPeriod) => void;
  showCustom?: boolean;
  disabled?: boolean;
  testID?: string;
}

const PERIOD_OPTIONS: { value: KPIPeriod; label: string }[] = [
  { value: '7d', label: '7 Days' },
  { value: '30d', label: '30 Days' },
  { value: '90d', label: '90 Days' },
];

export const PeriodSelector: React.FC<PeriodSelectorProps> = ({
  value,
  onChange,
  showCustom = false,
  disabled = false,
  testID,
}) => {
  const options = showCustom
    ? [...PERIOD_OPTIONS, { value: 'custom' as KPIPeriod, label: 'Custom' }]
    : PERIOD_OPTIONS;

  return (
    <View style={styles.container} testID={testID}>
      {options.map((option) => (
        <TouchableOpacity
          key={option.value}
          style={[
            styles.option,
            value === option.value && styles.optionActive,
            disabled && styles.optionDisabled,
          ]}
          onPress={() => onChange(option.value)}
          disabled={disabled}
          testID={`${testID}-${option.value}`}
        >
          <Text
            style={[
              styles.optionText,
              value === option.value && styles.optionTextActive,
              disabled && styles.optionTextDisabled,
            ]}
          >
            {option.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: colors.grey[100],
    borderRadius: 8,
    padding: 2,
  },
  option: {
    flex: 1,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: 6,
    alignItems: 'center',
  },
  optionActive: {
    backgroundColor: colors.background.default,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  optionDisabled: {
    opacity: 0.5,
  },
  optionText: {
    ...typography.caption,
    color: colors.text.secondary,
    fontWeight: '500',
  },
  optionTextActive: {
    color: colors.primary.main,
    fontWeight: '600',
  },
  optionTextDisabled: {
    color: colors.text.disabled,
  },
});

export default PeriodSelector;
