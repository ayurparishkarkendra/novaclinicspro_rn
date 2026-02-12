/**
 * Locale Entity
 * Domain entity representing a supported locale
 */

export interface Locale {
  code: string;       // e.g., 'en-US', 'hi-IN'
  language: string;   // e.g., 'English', 'Hindi'
  region: string;     // e.g., 'United States', 'India'
  label: string;      // Display label
  isRtl: boolean;     // Right-to-left script
  isDefault: boolean;
}

/**
 * Get language code from locale code
 */
export function getLanguageCode(locale: Locale): string {
  return locale.code.split('-')[0];
}

/**
 * Get region code from locale code
 */
export function getRegionCode(locale: Locale): string {
  return locale.code.split('-')[1] || '';
}

/**
 * Check if locale is for India
 */
export function isIndianLocale(locale: Locale): boolean {
  return locale.code.endsWith('-IN');
}

/**
 * Get locale by code from a list
 */
export function findLocaleByCode(locales: Locale[], code: string): Locale | undefined {
  return locales.find(l => l.code === code);
}
