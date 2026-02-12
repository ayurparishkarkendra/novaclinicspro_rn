/**
 * Tenant Branding Settings Screen
 * Allows Clinic Admins to customize tenant branding
 */

import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../../../auth/presentation/hooks/useAuth';
import {
  useTenantBrandingQuery,
  useUpdateTenantBrandingMutation,
} from '../../data/repositories/tenantBranding.repository.impl';
import { PRESET_PALETTES, ColorPalette } from '../../data/models/tenantBranding.dtos';
import { TenantBranding } from '../../domain/entities/tenant-branding.entity';
import { ColorPaletteSelector } from '../components/ColorPaletteSelector';
import { TenantBrandingPreview } from '../components/TenantBrandingPreview';
import { colors } from '../../../../core/theme/colors';
import { spacing } from '../../../../core/theme/spacing';
import { typography } from '../../../../core/theme/typography';

export function TenantBrandingSettingsScreen() {
  const router = useRouter();
  const { currentUser } = useAuth();
  const tenantId = currentUser?.activeTenant?.id || '';

  const { data: brandingData, isLoading } = useTenantBrandingQuery(tenantId);
  const updateMutation = useUpdateTenantBrandingMutation(tenantId);

  const [selectedPalette, setSelectedPalette] = useState<ColorPalette | null>(null);

  const isApiNotAvailable = !isLoading && brandingData && !brandingData.isApiAvailable;

  // Get current palette ID based on colors
  const currentPaletteId = useMemo(() => {
    if (!brandingData) return null;
    const match = PRESET_PALETTES.find(
      p =>
        p.colors.primary === brandingData.branding.colors.primary &&
        p.colors.secondary === brandingData.branding.colors.secondary
    );
    return match?.id || null;
  }, [brandingData]);

  // Preview branding with selected palette applied
  const previewBranding: TenantBranding | null = useMemo(() => {
    if (!brandingData) return null;
    if (!selectedPalette) return brandingData.branding;
    return {
      ...brandingData.branding,
      colors: selectedPalette.colors,
    };
  }, [brandingData, selectedPalette]);

  const handleBack = () => {
    router.back();
  };

  const handlePaletteSelect = (palette: ColorPalette) => {
    setSelectedPalette(palette);
  };

  const handleSave = async () => {
    if (selectedPalette && !isApiNotAvailable) {
      try {
        await updateMutation.mutateAsync({ colors: selectedPalette.colors });
        router.back();
      } catch (error) {
        // Error handled by mutation
      }
    }
  };

  const hasChanges = selectedPalette && selectedPalette.id !== currentPaletteId;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={handleBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </Pressable>
        <Text style={styles.headerTitle}>Branding & Theme</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {isLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary.main} />
          </View>
        )}

        {isApiNotAvailable && (
          <View style={styles.comingSoonBanner}>
            <Ionicons name="construct" size={32} color={colors.warning.main} />
            <Text style={styles.comingSoonTitle}>Coming Soon</Text>
            <Text style={styles.comingSoonText}>
              Tenant branding is not yet configurable in your environment.
              Once enabled, you&apos;ll be able to customize your clinic&apos;s colors and logo.
            </Text>
          </View>
        )}

        {previewBranding && (
          <TenantBrandingPreview branding={previewBranding} />
        )}

        {!isLoading && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Color Palette</Text>
            <Text style={styles.sectionDescription}>
              Choose a color palette for your clinic&apos;s branding. These colors will
              be applied throughout the app.
              {isApiNotAvailable && ' (Preview only - changes will not be saved)'}
            </Text>

            <ColorPaletteSelector
              selectedPaletteId={selectedPalette?.id || currentPaletteId}
              onSelect={handlePaletteSelect}
              disabled={isApiNotAvailable}
            />

            {!isApiNotAvailable && hasChanges && (
              <Pressable
                style={[
                  styles.saveButton,
                  updateMutation.isPending && styles.saveButtonDisabled,
                ]}
                onPress={handleSave}
                disabled={updateMutation.isPending}
              >
                {updateMutation.isPending ? (
                  <ActivityIndicator size="small" color={colors.text.light} />
                ) : (
                  <Text style={styles.saveButtonText}>Save Changes</Text>
                )}
              </Pressable>
            )}
          </View>
        )}

        {/* Logo Section (Placeholder) */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Logo</Text>
          <View style={styles.logoPlaceholder}>
            <Ionicons name="image-outline" size={32} color={colors.text.disabled} />
            <Text style={styles.logoPlaceholderText}>
              Logo upload will be available when branding API is enabled
            </Text>
          </View>
        </View>

        {/* Info Section */}
        <View style={styles.infoSection}>
          <View style={styles.infoItem}>
            <Ionicons name="information-circle-outline" size={20} color={colors.text.secondary} />
            <Text style={styles.infoText}>
              Branding changes will be visible to all users in your clinic.
              Color combinations are pre-validated for accessibility compliance.
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.default,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    backgroundColor: colors.background.paper,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  backButton: {
    padding: spacing.xs,
  },
  headerTitle: {
    ...typography.h6,
    color: colors.text.primary,
  },
  headerRight: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.md,
  },
  loadingContainer: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  comingSoonBanner: {
    backgroundColor: colors.warning.main + '15',
    borderWidth: 1,
    borderColor: colors.warning.main + '30',
    borderRadius: 12,
    padding: spacing.lg,
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  comingSoonTitle: {
    ...typography.h6,
    color: colors.warning.dark,
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
  comingSoonText: {
    ...typography.body2,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    ...typography.subtitle1,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  sectionDescription: {
    ...typography.body2,
    color: colors.text.secondary,
    marginBottom: spacing.md,
  },
  saveButton: {
    backgroundColor: colors.primary.main,
    paddingVertical: spacing.md,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    ...typography.button,
    color: colors.text.light,
  },
  logoPlaceholder: {
    backgroundColor: colors.grey[100],
    borderRadius: 12,
    padding: spacing.xl,
    alignItems: 'center',
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: colors.border.light,
  },
  logoPlaceholderText: {
    ...typography.body2,
    color: colors.text.disabled,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  infoSection: {
    backgroundColor: colors.grey[100],
    borderRadius: 12,
    padding: spacing.md,
  },
  infoItem: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  infoText: {
    ...typography.caption,
    color: colors.text.secondary,
    flex: 1,
  },
});
