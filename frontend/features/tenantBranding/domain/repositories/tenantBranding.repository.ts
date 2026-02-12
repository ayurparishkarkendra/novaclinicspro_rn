/**
 * Tenant Branding Repository Interface
 */

import { TenantBranding, TenantBrandingColors, TenantBrandingLogos } from '../entities/tenant-branding.entity';

export interface UpdateBrandingParams {
  colors?: Partial<TenantBrandingColors>;
  logos?: Partial<TenantBrandingLogos>;
  customFontFamily?: string;
}

export interface ITenantBrandingRepository {
  getBranding(tenantId: string): Promise<TenantBranding>;
  updateBranding(tenantId: string, params: UpdateBrandingParams): Promise<TenantBranding>;
}
