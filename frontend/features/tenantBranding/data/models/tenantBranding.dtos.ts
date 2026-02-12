/**
 * Tenant Branding DTOs
 * Data Transfer Objects for tenant branding operations
 * 
 * Note: These DTOs are prepared for when the Tenant Branding API becomes available.
 */

export interface TenantBrandingColors {
  primary: string;      // Primary brand color
  secondary: string;    // Secondary accent color
  accent: string;       // Accent/highlight color
}

export interface TenantBrandingLogos {
  headerLogo?: string;  // URL for header logo
  appLogo?: string;     // URL for app icon
  splashLogo?: string;  // URL for splash screen
  favicon?: string;     // URL for favicon
}

export interface TenantBrandingDto {
  tenantId: string;
  name: string;
  colors: TenantBrandingColors;
  logos: TenantBrandingLogos;
  customFontFamily?: string;
  updatedAt: string;
}

export interface TenantBrandingResponse {
  branding: TenantBrandingDto;
}

export interface UpdateTenantBrandingRequest {
  colors?: Partial<TenantBrandingColors>;
  logos?: Partial<TenantBrandingLogos>;
  customFontFamily?: string;
}

// Entity conversion
export function toBrandingEntity(
  dto: TenantBrandingDto
): import('../../domain/entities/tenant-branding.entity').TenantBranding {
  return {
    tenantId: dto.tenantId,
    name: dto.name,
    colors: dto.colors,
    logos: dto.logos,
    customFontFamily: dto.customFontFamily,
    updatedAt: new Date(dto.updatedAt),
  };
}

// Default branding (Ayurveda theme)
export const DEFAULT_BRANDING: TenantBrandingDto = {
  tenantId: '',
  name: 'NovaClinicsPro',
  colors: {
    primary: '#2F6F4E',     // Forest green (Ayurveda)
    secondary: '#8B5E3C',   // Earth brown
    accent: '#D4A574',      // Golden accent
  },
  logos: {},
  updatedAt: new Date().toISOString(),
};

// Pre-defined color palettes for selection
export interface ColorPalette {
  id: string;
  name: string;
  colors: TenantBrandingColors;
}

export const PRESET_PALETTES: ColorPalette[] = [
  {
    id: 'ayurveda',
    name: 'Ayurveda Classic',
    colors: { primary: '#2F6F4E', secondary: '#8B5E3C', accent: '#D4A574' },
  },
  {
    id: 'ocean',
    name: 'Ocean Calm',
    colors: { primary: '#1E6091', secondary: '#40A8C4', accent: '#89CFF0' },
  },
  {
    id: 'wellness',
    name: 'Wellness Spa',
    colors: { primary: '#7C3AED', secondary: '#A78BFA', accent: '#C4B5FD' },
  },
  {
    id: 'nature',
    name: 'Natural Green',
    colors: { primary: '#059669', secondary: '#34D399', accent: '#A7F3D0' },
  },
  {
    id: 'sunset',
    name: 'Sunset Warmth',
    colors: { primary: '#EA580C', secondary: '#FB923C', accent: '#FED7AA' },
  },
];

/**
 * Check if a color has sufficient contrast for accessibility
 */
export function hasGoodContrast(foreground: string, background: string): boolean {
  // Simplified contrast check - in production, use proper WCAG calculations
  return true; // Placeholder
}
