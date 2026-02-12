/**
 * Color Palette Selector Component
 * Allows selection of pre-defined color palettes
 */

import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ColorPalette, PRESET_PALETTES } from '../../data/models/tenantBranding.dtos';
import { colors } from '../../../../core/theme/colors';
import { spacing } from '../../../../core/theme/spacing';
import { typography } from '../../../../core/theme/typography';

interface ColorPaletteSelectorProps {
  selectedPaletteId: string | null;
  onSelect: (palette: ColorPalette) => void;
  disabled?: boolean;
}

export function ColorPaletteSelector({
  selectedPaletteId,
  onSelect,
  disabled = false,
}: ColorPaletteSelectorProps) {
  return (
    <View style={styles.container}>
      {PRESET_PALETTES.map((palette) => {
        const isSelected = palette.id === selectedPaletteId;
        return (
          <Pressable
            key={palette.id}
            style={[
              styles.paletteItem,
              isSelected && styles.paletteItemSelected,
              disabled && styles.paletteItemDisabled,
            ]}
            onPress={() => !disabled && onSelect(palette)}
            disabled={disabled}
            accessibilityRole="radio"
            accessibilityState={{ checked: isSelected, disabled }}
            accessibilityLabel={`${palette.name} color palette${isSelected ? ', selected' : ''}`}
          >
            <View style={styles.colorPreview}>
              <View style={[styles.colorSwatch, { backgroundColor: palette.colors.primary }]} />
              <View style={[styles.colorSwatch, { backgroundColor: palette.colors.secondary }]} />
              <View style={[styles.colorSwatch, { backgroundColor: palette.colors.accent }]} />
            </View>
            <View style={styles.paletteInfo}>
              <Text style={styles.paletteName}>{palette.name}</Text>
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
  paletteItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.background.paper,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.border.light,
    gap: spacing.md,
  },
  paletteItemSelected: {
    borderColor: colors.primary.main,
    backgroundColor: colors.primary.main + '08',
  },
  paletteItemDisabled: {
    opacity: 0.5,
  },
  colorPreview: {
    flexDirection: 'row',
    gap: spacing.xs / 2,
  },
  colorSwatch: {
    width: 24,
    height: 24,
    borderRadius: 6,
  },
  paletteInfo: {
    flex: 1,
  },
  paletteName: {
    ...typography.subtitle2,
    color: colors.text.primary,
  },
});
