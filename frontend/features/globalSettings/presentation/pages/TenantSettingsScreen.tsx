/**
 * Tenant Settings Screen
 * Clinic Admin screen for managing tenant-specific settings
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../../../auth/presentation/hooks/useAuth';
import {
  useTenantSettingsQuery,
  useGlobalSettingsQuery,
} from '../../data/repositories/globalSettings.repository.impl';
import { colors } from '../../../../core/theme/colors';
import { spacing } from '../../../../core/theme/spacing';
import { typography } from '../../../../core/theme/typography';

export function TenantSettingsScreen() {
  const router = useRouter();
  const { currentUser } = useAuth();
  const tenantId = currentUser?.tenantId || '';

  const { data: globalSettings, isLoading: globalLoading } = useGlobalSettingsQuery();
  const { data: tenantSettings, isLoading: tenantLoading } = useTenantSettingsQuery(tenantId);

  const isLoading = globalLoading || tenantLoading;
  const isApiNotAvailable = !isLoading && tenantSettings && !tenantSettings.isApiAvailable;

  const handleBack = () => {
    router.back();
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={handleBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </Pressable>
        <Text style={styles.headerTitle}>Clinic Settings</Text>
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
              Tenant-specific settings are not yet configurable in your environment.
              Once enabled, you&apos;ll be able to customize settings for your clinic.
            </Text>
          </View>
        )}

        {/* Settings Overview */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Clinic Configuration</Text>
          <Text style={styles.sectionDescription}>
            These settings allow you to override global defaults for your clinic.
            {isApiNotAvailable && ' (Preview only)'}
          </Text>

          {/* Feature Overrides */}
          <View style={styles.settingsCard}>
            <View style={styles.cardHeader}>
              <Ionicons name="toggle" size={18} color={colors.primary.main} />
              <Text style={styles.cardTitle}>Feature Overrides</Text>
            </View>
            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Online Booking</Text>
                <Text style={styles.settingDescription}>Allow patients to book online</Text>
              </View>
              <Switch
                value={true}
                disabled={isApiNotAvailable}
                trackColor={{ false: colors.grey[300], true: colors.primary.main + '80' }}
                thumbColor={colors.primary.main}
              />
            </View>
            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>SMS Notifications</Text>
                <Text style={styles.settingDescription}>Send SMS to patients</Text>
              </View>
              <Switch
                value={false}
                disabled={isApiNotAvailable}
                trackColor={{ false: colors.grey[300], true: colors.primary.main + '80' }}
                thumbColor={colors.grey[100]}
              />
            </View>
            <View style={[styles.settingItem, { borderBottomWidth: 0 }]}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Inventory Alerts</Text>
                <Text style={styles.settingDescription}>Alert when stock is low</Text>
              </View>
              <Switch
                value={true}
                disabled={isApiNotAvailable}
                trackColor={{ false: colors.grey[300], true: colors.primary.main + '80' }}
                thumbColor={colors.primary.main}
              />
            </View>
          </View>

          {/* Default Overrides */}
          <View style={styles.settingsCard}>
            <View style={styles.cardHeader}>
              <Ionicons name="settings" size={18} color={colors.primary.main} />
              <Text style={styles.cardTitle}>Default Values</Text>
            </View>
            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Appointment Duration</Text>
                <Text style={styles.settingValue}>30 minutes (using global default)</Text>
              </View>
            </View>
            <View style={[styles.settingItem, { borderBottomWidth: 0 }]}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Currency</Text>
                <Text style={styles.settingValue}>INR (using global default)</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Info Section */}
        <View style={styles.infoSection}>
          <View style={styles.infoItem}>
            <Ionicons name="information-circle-outline" size={20} color={colors.text.secondary} />
            <Text style={styles.infoText}>
              Settings marked &quot;using global default&quot; inherit from system-wide settings.
              Override them here to customize for your clinic.
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
  settingsCard: {
    backgroundColor: colors.background.paper,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    backgroundColor: colors.grey[100],
  },
  cardTitle: {
    ...typography.subtitle2,
    color: colors.text.primary,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  settingInfo: {
    flex: 1,
    marginRight: spacing.md,
  },
  settingLabel: {
    ...typography.subtitle2,
    color: colors.text.primary,
  },
  settingDescription: {
    ...typography.caption,
    color: colors.text.secondary,
    marginTop: spacing.xs / 2,
  },
  settingValue: {
    ...typography.body2,
    color: colors.primary.main,
    marginTop: spacing.xs / 2,
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
