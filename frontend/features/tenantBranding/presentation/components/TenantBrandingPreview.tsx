/**
 * Tenant Branding Preview Component
 * Shows a preview of the current branding configuration
 */

import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TenantBranding } from '../../domain/entities/tenant-branding.entity';
import { colors } from '../../../../core/theme/colors';
import { spacing } from '../../../../core/theme/spacing';
import { typography } from '../../../../core/theme/typography';

interface TenantBrandingPreviewProps {
  branding: TenantBranding;
}

export function TenantBrandingPreview({ branding }: TenantBrandingPreviewProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.previewTitle}>Preview</Text>
      
      {/* Mock Header */}
      <View style={[styles.mockHeader, { backgroundColor: branding.colors.primary }]}>
        {branding.logos.headerLogo ? (
          <Image source={{ uri: branding.logos.headerLogo }} style={styles.logo} resizeMode="contain" />
        ) : (
          <Text style={styles.mockLogoText}>{branding.name}</Text>
        )}
        <View style={styles.mockHeaderIcons}>
          <Ionicons name="notifications-outline" size={20} color="white" />
          <Ionicons name="person-circle" size={24} color="white" />
        </View>
      </View>

      {/* Mock Content */}
      <View style={styles.mockContent}>
        <View style={[styles.mockButton, { backgroundColor: branding.colors.primary }]}>
          <Text style={styles.mockButtonText}>Primary Button</Text>
        </View>
        <View style={[styles.mockButton, styles.mockButtonOutline, { borderColor: branding.colors.secondary }]}>
          <Text style={[styles.mockButtonText, { color: branding.colors.secondary }]}>Secondary</Text>
        </View>
        <View style={[styles.mockAccent, { backgroundColor: branding.colors.accent }]}>
          <Text style={styles.mockAccentText}>Accent highlight</Text>
        </View>
      </View>

      {/* Color Legend */}
      <View style={styles.colorLegend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendSwatch, { backgroundColor: branding.colors.primary }]} />
          <Text style={styles.legendText}>Primary</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendSwatch, { backgroundColor: branding.colors.secondary }]} />
          <Text style={styles.legendText}>Secondary</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendSwatch, { backgroundColor: branding.colors.accent }]} />
          <Text style={styles.legendText}>Accent</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.grey[100],
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  previewTitle: {
    ...typography.caption,
    color: colors.text.secondary,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  mockHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    borderRadius: 8,
    marginBottom: spacing.sm,
  },
  logo: {
    width: 100,
    height: 32,
  },
  mockLogoText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 16,
  },
  mockHeaderIcons: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  mockContent: {
    backgroundColor: colors.background.paper,
    borderRadius: 8,
    padding: spacing.md,
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  mockButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 8,
    alignItems: 'center',
  },
  mockButtonOutline: {
    backgroundColor: 'transparent',
    borderWidth: 2,
  },
  mockButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  mockAccent: {
    padding: spacing.sm,
    borderRadius: 6,
    alignItems: 'center',
  },
  mockAccentText: {
    fontWeight: '500',
    fontSize: 12,
    color: colors.text.primary,
  },
  colorLegend: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  legendSwatch: {
    width: 16,
    height: 16,
    borderRadius: 4,
  },
  legendText: {
    ...typography.caption,
    color: colors.text.secondary,
  },
});
