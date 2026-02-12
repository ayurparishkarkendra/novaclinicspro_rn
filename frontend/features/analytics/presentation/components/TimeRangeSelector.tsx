/**
 * Time Range Selector Component
 * Allows selecting time range for analytics data
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { colors } from '../../../../core/theme/colors';
import { spacing } from '../../../../core/theme/spacing';
import { typography } from '../../../../core/theme/typography';

interface TimeRangeOption {
  label: string;
  value: number;
  unit: 'hours' | 'days' | 'months';
}

interface TimeRangeSelectorProps {
  options: TimeRangeOption[];
  selectedValue: number;
  onSelect: (value: number) => void;
}

export const TimeRangeSelector: React.FC<TimeRangeSelectorProps> = ({
  options,
  selectedValue,
  onSelect,
}) => {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {options.map((option, index) => {
        const isSelected = option.value === selectedValue;
        return (
          <TouchableOpacity
            key={index}
            style={[
              styles.option,
              isSelected && styles.optionSelected,
            ]}
            onPress={() => onSelect(option.value)}
          >
            <Text
              style={[
                styles.optionText,
                isSelected && styles.optionTextSelected,
              ]}
            >
              {option.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
};

// Preset time range options
export const TIME_RANGE_HOURS: TimeRangeOption[] = [
  { label: '1H', value: 1, unit: 'hours' },
  { label: '6H', value: 6, unit: 'hours' },
  { label: '12H', value: 12, unit: 'hours' },
  { label: '24H', value: 24, unit: 'hours' },
  { label: '48H', value: 48, unit: 'hours' },
  { label: '7D', value: 168, unit: 'hours' },
];

export const TIME_RANGE_DAYS: TimeRangeOption[] = [
  { label: '7D', value: 7, unit: 'days' },
  { label: '14D', value: 14, unit: 'days' },
  { label: '30D', value: 30, unit: 'days' },
  { label: '60D', value: 60, unit: 'days' },
  { label: '90D', value: 90, unit: 'days' },
];

const styles = StyleSheet.create({
  container: {
    gap: spacing.xs,
    paddingVertical: spacing.xs,
  },
  option: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 20,
    backgroundColor: colors.grey[100],
  },
  optionSelected: {
    backgroundColor: colors.primary.main,
  },
  optionText: {
    ...typography.caption,
    fontWeight: '600',
    color: colors.text.secondary,
  },
  optionTextSelected: {
    color: colors.text.light,
  },
});
