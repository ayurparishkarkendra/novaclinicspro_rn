/**
 * Global Settings Entity
 */

export interface FeatureFlags {
  enableAppointmentReminders: boolean;
  enableOnlineBooking: boolean;
  enableSmsNotifications: boolean;
  enableEmailNotifications: boolean;
  enableAnalytics: boolean;
  enableReports: boolean;
  enableInventoryAlerts: boolean;
  enableBillingModule: boolean;
}

export interface ComplianceSettings {
  showConsentBanner: boolean;
  consentBannerText: string;
  dataRetentionDays: number;
  requirePatientConsent: boolean;
  hipaaMode: boolean;
  gdprMode: boolean;
}

export interface DefaultSettings {
  defaultAppointmentDuration: number;
  defaultTimeZone: string;
  defaultCurrency: string;
  defaultDateFormat: string;
  defaultTimeFormat: '12h' | '24h';
}

export interface GlobalSettings {
  id: string;
  featureFlags: FeatureFlags;
  compliance: ComplianceSettings;
  defaults: DefaultSettings;
  updatedAt: Date;
  updatedBy: string;
}

/**
 * Check if a feature is enabled
 */
export function isFeatureEnabled(settings: GlobalSettings, feature: keyof FeatureFlags): boolean {
  return settings.featureFlags[feature];
}

/**
 * Check if compliance mode is active
 */
export function isHipaaMode(settings: GlobalSettings): boolean {
  return settings.compliance.hipaaMode;
}

export function isGdprMode(settings: GlobalSettings): boolean {
  return settings.compliance.gdprMode;
}
