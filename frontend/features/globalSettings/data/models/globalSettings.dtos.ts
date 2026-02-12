/**
 * Global Settings DTOs
 * Data Transfer Objects for global settings operations
 * 
 * Note: These DTOs are prepared for when the Global Settings API becomes available.
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
  defaultAppointmentDuration: number;  // minutes
  defaultTimeZone: string;
  defaultCurrency: string;
  defaultDateFormat: string;
  defaultTimeFormat: '12h' | '24h';
}

export interface GlobalSettingsDto {
  id: string;
  featureFlags: FeatureFlags;
  compliance: ComplianceSettings;
  defaults: DefaultSettings;
  updatedAt: string;
  updatedBy: string;
}

export interface GlobalSettingsResponse {
  settings: GlobalSettingsDto;
}

export interface UpdateGlobalSettingsRequest {
  featureFlags?: Partial<FeatureFlags>;
  compliance?: Partial<ComplianceSettings>;
  defaults?: Partial<DefaultSettings>;
}

export interface TenantSettingsDto {
  tenantId: string;
  featureOverrides: Partial<FeatureFlags>;
  complianceOverrides: Partial<ComplianceSettings>;
  defaultOverrides: Partial<DefaultSettings>;
  updatedAt: string;
  updatedBy: string;
}

export interface TenantSettingsResponse {
  settings: TenantSettingsDto;
}

export interface UpdateTenantSettingsRequest {
  featureOverrides?: Partial<FeatureFlags>;
  complianceOverrides?: Partial<ComplianceSettings>;
  defaultOverrides?: Partial<DefaultSettings>;
}

// Entity conversion
export function toGlobalSettingsEntity(
  dto: GlobalSettingsDto
): import('../../domain/entities/global-settings.entity').GlobalSettings {
  return {
    id: dto.id,
    featureFlags: dto.featureFlags,
    compliance: dto.compliance,
    defaults: dto.defaults,
    updatedAt: new Date(dto.updatedAt),
    updatedBy: dto.updatedBy,
  };
}

export function toTenantSettingsEntity(
  dto: TenantSettingsDto
): import('../../domain/entities/tenant-settings.entity').TenantSettings {
  return {
    tenantId: dto.tenantId,
    featureOverrides: dto.featureOverrides,
    complianceOverrides: dto.complianceOverrides,
    defaultOverrides: dto.defaultOverrides,
    updatedAt: new Date(dto.updatedAt),
    updatedBy: dto.updatedBy,
  };
}

// Default global settings
export const DEFAULT_GLOBAL_SETTINGS: GlobalSettingsDto = {
  id: 'default',
  featureFlags: {
    enableAppointmentReminders: true,
    enableOnlineBooking: true,
    enableSmsNotifications: false,
    enableEmailNotifications: true,
    enableAnalytics: true,
    enableReports: false,
    enableInventoryAlerts: true,
    enableBillingModule: true,
  },
  compliance: {
    showConsentBanner: true,
    consentBannerText: 'By using this application, you agree to our Privacy Policy and Terms of Service.',
    dataRetentionDays: 365,
    requirePatientConsent: true,
    hipaaMode: false,
    gdprMode: false,
  },
  defaults: {
    defaultAppointmentDuration: 30,
    defaultTimeZone: 'Asia/Kolkata',
    defaultCurrency: 'INR',
    defaultDateFormat: 'DD/MM/YYYY',
    defaultTimeFormat: '12h',
  },
  updatedAt: new Date().toISOString(),
  updatedBy: 'system',
};

// Setting category labels for UI
export interface SettingCategory {
  id: string;
  label: string;
  description: string;
  icon: string;
}

export const SETTING_CATEGORIES: SettingCategory[] = [
  {
    id: 'features',
    label: 'Feature Toggles',
    description: 'Enable or disable app features',
    icon: 'toggle',
  },
  {
    id: 'compliance',
    label: 'Compliance & Privacy',
    description: 'HIPAA, GDPR, and consent settings',
    icon: 'shield-checkmark',
  },
  {
    id: 'defaults',
    label: 'Default Values',
    description: 'System-wide default settings',
    icon: 'settings',
  },
];
