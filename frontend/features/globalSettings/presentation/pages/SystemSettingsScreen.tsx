/**
 * System Settings Screen
 * Super Admin screen for managing global settings
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
import { useGlobalSettingsQuery } from '../../data/repositories/globalSettings.repository.impl';
import { SETTING_CATEGORIES, FeatureFlags, ComplianceSettings, DefaultSettings } from '../../data/models/globalSettings.dtos';
import { colors } from '../../../../core/theme/colors';
import { spacing } from '../../../../core/theme/spacing';
import { typography } from '../../../../core/theme/typography';

const FEATURE_FLAG_LABELS: Record<keyof FeatureFlags, { label: string; description: string }> = {
  enableAppointmentReminders: { label: 'Appointment Reminders', description: 'Send automated reminders before appointments' },
  enableOnlineBooking: { label: 'Online Booking', description: 'Allow patients to book appointments online' },
  enableSmsNotifications: { label: 'SMS Notifications', description: 'Send notifications via SMS' },
  enableEmailNotifications: { label: 'Email Notifications', description: 'Send notifications via email' },
  enableAnalytics: { label: 'Analytics Dashboard', description: 'Enable performance analytics' },
  enableReports: { label: 'Reports Module', description: 'Enable report generation' },
  enableInventoryAlerts: { label: 'Inventory Alerts', description: 'Alert when stock is low' },
  enableBillingModule: { label: 'Billing Module', description: 'Enable billing and invoicing' },
};

const COMPLIANCE_LABELS: Record<keyof ComplianceSettings, { label: string; description: string }> = {
  showConsentBanner: { label: 'Consent Banner', description: 'Show consent banner to users' },
  consentBannerText: { label: 'Banner Text', description: 'Text shown in consent banner' },
  dataRetentionDays: { label: 'Data Retention', description: 'Days to retain patient data' },
  requirePatientConsent: { label: 'Patient Consent', description: 'Require explicit patient consent' },
  hipaaMode: { label: 'HIPAA Mode', description: 'Enable HIPAA compliance features' },
  gdprMode: { label: 'GDPR Mode', description: 'Enable GDPR compliance features' },
};

export function SystemSettingsScreen() {
  const router = useRouter();
  const { data: settingsData, isLoading } = useGlobalSettingsQuery();

  const isApiNotAvailable = !isLoading && settingsData && !settingsData.isApiAvailable;

  const handleBack = () => {
    router.back();
  };

  const renderFeatureToggle = (key: keyof FeatureFlags, value: boolean) => {
    const label = FEATURE_FLAG_LABELS[key];
    return (
      <View key={key} style={styles.settingItem}>
        <View style={styles.settingInfo}>
          <Text style={styles.settingLabel}>{label.label}</Text>
          <Text style={styles.settingDescription}>{label.description}</Text>
        </View>
        <Switch
          value={value}
          disabled={isApiNotAvailable}
          trackColor={{ false: colors.grey[300], true: colors.primary.main + '80' }}
          thumbColor={value ? colors.primary.main : colors.grey[100]}
        />
      </View>
    );
  };

  const renderComplianceSetting = (key: keyof ComplianceSettings, value: boolean | string | number) => {
    const label = COMPLIANCE_LABELS[key];
    const isBoolean = typeof value === 'boolean';
    return (
      <View key={key} style={styles.settingItem}>
        <View style={styles.settingInfo}>
          <Text style={styles.settingLabel}>{label.label}</Text>
          <Text style={styles.settingDescription}>{label.description}</Text>
          {!isBoolean && (
            <Text style={styles.settingValue}>
              {typeof value === 'number' ? `${value} days` : value}
            </Text>
          )}
        </View>
        {isBoolean && (
          <Switch
            value={value}
            disabled={isApiNotAvailable}
            trackColor={{ false: colors.grey[300], true: colors.primary.main + '80' }}
            thumbColor={value ? colors.primary.main : colors.grey[100]}
          />
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={handleBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </Pressable>
        <Text style={styles.headerTitle}>System Settings</Text>
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
              Global settings are not yet configurable in your environment.
              Below is a preview of the settings that will be available.
            </Text>
          </View>
        )}

        {settingsData && (
          <>
            {/* Feature Flags Section */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="toggle" size={20} color={colors.primary.main} />
                <Text style={styles.sectionTitle}>Feature Toggles</Text>
              </View>
              <Text style={styles.sectionDescription}>
                Enable or disable features across all clinics
                {isApiNotAvailable && ' (Preview only)'}
              </Text>
              <View style={styles.settingsCard}>
                {(Object.keys(settingsData.settings.featureFlags) as Array<keyof FeatureFlags>).map((key) =>
                  renderFeatureToggle(key, settingsData.settings.featureFlags[key])
                )}
              </View>
            </View>

            {/* Compliance Section */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="shield-checkmark" size={20} color={colors.primary.main} />
                <Text style={styles.sectionTitle}>Compliance & Privacy</Text>
              </View>
              <Text style={styles.sectionDescription}>
                HIPAA, GDPR, and consent settings
              </Text>
              <View style={styles.settingsCard}>
                {(Object.keys(settingsData.settings.compliance) as Array<keyof ComplianceSettings>).map((key) =>
                  renderComplianceSetting(key, settingsData.settings.compliance[key])
                )}
              </View>
            </View>

            {/* Defaults Section */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="settings" size={20} color={colors.primary.main} />
                <Text style={styles.sectionTitle}>Default Values</Text>
              </View>
              <View style={styles.settingsCard}>
                <View style={styles.settingItem}>
                  <View style={styles.settingInfo}>
                    <Text style={styles.settingLabel}>Default Appointment Duration</Text>
                    <Text style={styles.settingValue}>{settingsData.settings.defaults.defaultAppointmentDuration} minutes</Text>
                  </View>
                </View>
                <View style={styles.settingItem}>
                  <View style={styles.settingInfo}>
                    <Text style={styles.settingLabel}>Default Time Zone</Text>
                    <Text style={styles.settingValue}>{settingsData.settings.defaults.defaultTimeZone}</Text>
                  </View>
                </View>
                <View style={styles.settingItem}>
                  <View style={styles.settingInfo}>
                    <Text style={styles.settingLabel}>Default Currency</Text>
                    <Text style={styles.settingValue}>{settingsData.settings.defaults.defaultCurrency}</Text>
                  </View>
                </View>
                <View style={styles.settingItem}>
                  <View style={styles.settingInfo}>
                    <Text style={styles.settingLabel}>Date Format</Text>
                    <Text style={styles.settingValue}>{settingsData.settings.defaults.defaultDateFormat}</Text>
                  </View>
                </View>
                <View style={[styles.settingItem, { borderBottomWidth: 0 }]}>
                  <View style={styles.settingInfo}>
                    <Text style={styles.settingLabel}>Time Format</Text>
                    <Text style={styles.settingValue}>{settingsData.settings.defaults.defaultTimeFormat}</Text>
                  </View>
                </View>
              </View>
            </View>
          </>
        )}

        {/* Info Section */}
        <View style={styles.infoSection}>
          <View style={styles.infoItem}>
            <Ionicons name="information-circle-outline" size={20} color={colors.text.secondary} />
            <Text style={styles.infoText}>
              System settings affect all clinics. Changes should be made carefully
              and may require clinics to be notified.
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
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  sectionTitle: {
    ...typography.subtitle1,
    color: colors.text.primary,
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
