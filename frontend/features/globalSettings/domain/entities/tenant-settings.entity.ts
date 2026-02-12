/**
 * Tenant Settings Entity
 */

import { FeatureFlags, ComplianceSettings, DefaultSettings } from './global-settings.entity';

export interface TenantSettings {
  tenantId: string;
  featureOverrides: Partial<FeatureFlags>;
  complianceOverrides: Partial<ComplianceSettings>;
  defaultOverrides: Partial<DefaultSettings>;
  updatedAt: Date;
  updatedBy: string;
}

/**
 * Check if tenant has override for a feature
 */
export function hasFeatureOverride(settings: TenantSettings, feature: keyof FeatureFlags): boolean {
  return feature in settings.featureOverrides;
}

/**
 * Get effective feature value (tenant override or global default)
 */
export function getEffectiveFeature(
  tenantSettings: TenantSettings,
  globalFeatureFlags: FeatureFlags,
  feature: keyof FeatureFlags
): boolean {
  if (hasFeatureOverride(tenantSettings, feature)) {
    return tenantSettings.featureOverrides[feature] as boolean;
  }
  return globalFeatureFlags[feature];
}
