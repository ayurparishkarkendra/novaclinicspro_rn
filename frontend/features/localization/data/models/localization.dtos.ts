/**
 * Localization DTOs
 * Data Transfer Objects for localization operations
 * 
 * Note: These DTOs are prepared for when the Localization API becomes available.
 * Currently, the API endpoints do not exist.
 */

export interface SupportedLocale {
  code: string;       // e.g., 'en-US', 'hi-IN', 'ta-IN'
  language: string;   // e.g., 'English', 'Hindi', 'Tamil'
  region: string;     // e.g., 'United States', 'India'
  label: string;      // Display label e.g., 'English (US)'
  isRtl: boolean;     // Right-to-left script
  isDefault: boolean;
}

export interface SupportedLocalesResponse {
  locales: SupportedLocale[];
  defaultLocale: string;
}

export interface UserLocaleResponse {
  userId: string;
  localeCode: string;
  updatedAt: string;
}

export interface UpdateUserLocaleRequest {
  localeCode: string;
}

export interface TenantLocaleResponse {
  tenantId: string;
  defaultLocaleCode: string;
  supportedLocales: string[];
  updatedAt: string;
}

export interface UpdateTenantLocaleRequest {
  defaultLocaleCode: string;
  supportedLocales?: string[];
}

// Entity conversion
export function toLocaleEntity(dto: SupportedLocale): import('../../domain/entities/locale.entity').Locale {
  return {
    code: dto.code,
    language: dto.language,
    region: dto.region,
    label: dto.label,
    isRtl: dto.isRtl,
    isDefault: dto.isDefault,
  };
}

// Default supported locales for placeholder UI
export const DEFAULT_SUPPORTED_LOCALES: SupportedLocale[] = [
  { code: 'en-US', language: 'English', region: 'United States', label: 'English (US)', isRtl: false, isDefault: true },
  { code: 'en-IN', language: 'English', region: 'India', label: 'English (India)', isRtl: false, isDefault: false },
  { code: 'hi-IN', language: 'Hindi', region: 'India', label: 'हिन्दी (भारत)', isRtl: false, isDefault: false },
  { code: 'ta-IN', language: 'Tamil', region: 'India', label: 'தமிழ் (இந்தியா)', isRtl: false, isDefault: false },
  { code: 'te-IN', language: 'Telugu', region: 'India', label: 'తెలుగు (భారతదేశం)', isRtl: false, isDefault: false },
  { code: 'kn-IN', language: 'Kannada', region: 'India', label: 'ಕನ್ನಡ (ಭಾರತ)', isRtl: false, isDefault: false },
  { code: 'ml-IN', language: 'Malayalam', region: 'India', label: 'മലയാളം (ഇന്ത്യ)', isRtl: false, isDefault: false },
  { code: 'mr-IN', language: 'Marathi', region: 'India', label: 'मराठी (भारत)', isRtl: false, isDefault: false },
];
