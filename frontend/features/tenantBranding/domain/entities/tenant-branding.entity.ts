/**
 * Tenant Branding Entity
 * Domain entity representing tenant branding configuration
 */

export interface TenantBrandingColors {
  primary: string;
  secondary: string;
  accent: string;
}

export interface TenantBrandingLogos {
  headerLogo?: string;
  appLogo?: string;
  splashLogo?: string;
  favicon?: string;
}

export interface TenantBranding {
  tenantId: string;
  name: string;
  colors: TenantBrandingColors;
  logos: TenantBrandingLogos;
  customFontFamily?: string;
  updatedAt: Date;
}

/**
 * Check if branding has custom colors
 */
export function hasCustomColors(branding: TenantBranding): boolean {
  const defaults = { primary: '#2F6F4E', secondary: '#8B5E3C', accent: '#D4A574' };
  return (
    branding.colors.primary !== defaults.primary ||
    branding.colors.secondary !== defaults.secondary ||
    branding.colors.accent !== defaults.accent
  );
}

/**
 * Check if branding has custom logo
 */
export function hasCustomLogo(branding: TenantBranding): boolean {
  return !!(
    branding.logos.headerLogo ||
    branding.logos.appLogo ||
    branding.logos.splashLogo
  );
}
