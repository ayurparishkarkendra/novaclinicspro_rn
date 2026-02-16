/**
 * Tenant Branding Feature
 * 
 * Provides per-tenant logo and theme overrides.
 * Note: API endpoints are not yet available - UI will show placeholder state.
 */

// Data layer - explicitly export DTOs
export {
  type TenantBrandingDto,
  type TenantBrandingResponse,
  type UpdateTenantBrandingRequest,
  type ColorPalette,
  toBrandingEntity,
  DEFAULT_BRANDING,
  PRESET_PALETTES,
  hasGoodContrast,
} from './data/models/tenantBranding.dtos';
export * from './data/datasources/tenantBranding.api';
export * from './data/repositories/tenantBranding.repository.impl';

// Domain layer - export entity types
export {
  type TenantBrandingColors,
  type TenantBrandingLogos,
  type TenantBranding,
  hasCustomColors,
  hasCustomLogo,
} from './domain/entities/tenant-branding.entity';
export * from './domain/repositories/tenantBranding.repository';

// Presentation layer
export { TenantBrandingSettingsScreen } from './presentation/pages/TenantBrandingSettingsScreen';
export { TenantBrandingPreview } from './presentation/components/TenantBrandingPreview';
export { ColorPaletteSelector } from './presentation/components/ColorPaletteSelector';
