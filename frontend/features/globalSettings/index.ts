/**
 * Global Settings Feature
 * 
 * Provides global and tenant-level configuration flags.
 * Note: API endpoints are not yet available - UI will show placeholder state.
 */

// Data layer - explicitly export DTOs and API
export {
  type GlobalSettingsDto,
  type GlobalSettingsResponse,
  type UpdateGlobalSettingsRequest,
  type TenantSettingsDto,
  type TenantSettingsResponse,
  type UpdateTenantSettingsRequest,
  type SettingCategory,
  toGlobalSettingsEntity,
  toTenantSettingsEntity,
  DEFAULT_GLOBAL_SETTINGS,
  SETTING_CATEGORIES,
} from './data/models/globalSettings.dtos';
export * from './data/datasources/globalSettings.api';
export * from './data/repositories/globalSettings.repository.impl';

// Domain layer - use entity types (re-export with different names to avoid conflicts)
export {
  type FeatureFlags,
  type ComplianceSettings,
  type DefaultSettings,
  type GlobalSettings,
  isFeatureEnabled,
  isHipaaMode,
  isGdprMode,
} from './domain/entities/global-settings.entity';
export * from './domain/entities/tenant-settings.entity';

// Presentation layer
export { SystemSettingsScreen } from './presentation/pages/SystemSettingsScreen';
export { TenantSettingsScreen } from './presentation/pages/TenantSettingsScreen';
