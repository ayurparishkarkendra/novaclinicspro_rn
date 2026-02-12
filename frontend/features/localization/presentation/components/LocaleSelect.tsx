/**
 * Locale Select Component
 * Allows users to select their preferred locale
 */

import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Locale } from '../../domain/entities/locale.entity';
import { colors } from '../../../../core/theme/colors';
import { spacing } from '../../../../core/theme/spacing';
import { typography } from '../../../../core/theme/typography';

interface LocaleSelectProps {
  locales: Locale[];
  selectedLocale: string;
  onSelect: (localeCode: string) => void;
  disabled?: boolean;
}

export function LocaleSelect({
  locales,
  selectedLocale,
  onSelect,
  disabled = false,
}: LocaleSelectProps) {
  return (
    <View style={styles.container}>
      {locales.map((locale) => {
        const isSelected = locale.code === selectedLocale;
        return (
          <Pressable
            key={locale.code}
            style={[
              styles.localeItem,
              isSelected && styles.localeItemSelected,
              disabled && styles.localeItemDisabled,
            ]}
            onPress={() => !disabled && onSelect(locale.code)}
            disabled={disabled}
            accessibilityRole="radio"
            accessibilityState={{ checked: isSelected, disabled }}
            accessibilityLabel={`${locale.label}${isSelected ? ', selected' : ''}`}
          >
            <View style={styles.localeInfo}>
              <Text style={[styles.localeLabel, isSelected && styles.localeLabelSelected]}>
                {locale.label}
              </Text>
              <Text style={styles.localeRegion}>
                {locale.language} • {locale.region}
              </Text>
            </View>
            {isSelected && (
              <Ionicons name="checkmark-circle" size={24} color={colors.primary.main} />
            )}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
  },
  localeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    backgroundColor: colors.background.paper,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.border.light,
  },
  localeItemSelected: {
    borderColor: colors.primary.main,
    backgroundColor: colors.primary.main + '08',
  },
  localeItemDisabled: {
    opacity: 0.5,
  },
  localeInfo: {
    flex: 1,
  },
  localeLabel: {
    ...typography.subtitle1,
    color: colors.text.primary,
    marginBottom: spacing.xs / 2,
  },
  localeLabelSelected: {
    color: colors.primary.main,
    fontWeight: '600',
  },
  localeRegion: {
    ...typography.caption,
    color: colors.text.secondary,
  },
});
