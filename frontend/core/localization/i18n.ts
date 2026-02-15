/**
 * i18n Configuration
 * Centralized internationalization setup for the application
 * 
 * Usage:
 * import { t, changeLanguage, getCurrentLocale } from '@/core/localization/i18n';
 * 
 * // In components:
 * const message = t('errors.network.generic');
 * const messageWithParams = t('errors.generic.withResource', { resource: 'appointment' });
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Localization from 'expo-localization';

// Import translation files
import enUS from './translations/en-US.json';
import hiIN from './translations/hi-IN.json';

// Supported locales
export const SUPPORTED_LOCALES = [
  { code: 'en-US', label: 'English (US)', nativeLabel: 'English' },
  { code: 'en-IN', label: 'English (India)', nativeLabel: 'English (India)' },
  { code: 'hi-IN', label: 'Hindi', nativeLabel: 'हिन्दी' },
  { code: 'ta-IN', label: 'Tamil', nativeLabel: 'தமிழ்' },
  { code: 'te-IN', label: 'Telugu', nativeLabel: 'తెలుగు' },
  { code: 'kn-IN', label: 'Kannada', nativeLabel: 'ಕನ್ನಡ' },
  { code: 'ml-IN', label: 'Malayalam', nativeLabel: 'മലയാളം' },
  { code: 'mr-IN', label: 'Marathi', nativeLabel: 'मराठी' },
] as const;

export type LocaleCode = typeof SUPPORTED_LOCALES[number]['code'];

// Translation resources map
const resources: Record<string, Record<string, any>> = {
  'en-US': enUS,
  'en-IN': enUS, // Fallback to en-US for now
  'hi-IN': hiIN,
  // Other locales will fallback to en-US until translations are added
};

// Current locale state
let currentLocale: LocaleCode = 'en-US';
const LOCALE_STORAGE_KEY = '@app_locale';

/**
 * Initialize i18n with device locale or stored preference
 */
export const initI18n = async (): Promise<void> => {
  try {
    // Check for stored preference
    const storedLocale = await AsyncStorage.getItem(LOCALE_STORAGE_KEY);
    if (storedLocale && isValidLocale(storedLocale)) {
      currentLocale = storedLocale as LocaleCode;
      return;
    }

    // Fall back to device locale
    const deviceLocale = Localization.locale;
    if (isValidLocale(deviceLocale)) {
      currentLocale = deviceLocale as LocaleCode;
    } else if (deviceLocale) {
      // Try to match language code only (e.g., 'hi' matches 'hi-IN')
      const langCode = deviceLocale.split('-')[0];
      const matchedLocale = SUPPORTED_LOCALES.find(
        (l) => l.code.startsWith(langCode)
      );
      if (matchedLocale) {
        currentLocale = matchedLocale.code;
      }
    }
    // If deviceLocale is undefined (web context), currentLocale stays as default 'en-US'
  } catch (error) {
    console.warn('Failed to initialize i18n:', error);
  }
};

/**
 * Check if a locale code is supported
 */
export const isValidLocale = (locale: string): boolean => {
  return SUPPORTED_LOCALES.some((l) => l.code === locale);
};

/**
 * Get current locale code
 */
export const getCurrentLocale = (): LocaleCode => currentLocale;

/**
 * Change the current locale
 */
export const changeLanguage = async (locale: LocaleCode): Promise<void> => {
  if (!isValidLocale(locale)) {
    console.warn(`Invalid locale: ${locale}`);
    return;
  }

  currentLocale = locale;
  try {
    await AsyncStorage.setItem(LOCALE_STORAGE_KEY, locale);
  } catch (error) {
    console.warn('Failed to persist locale:', error);
  }
};

/**
 * Get nested value from object using dot notation
 */
const getNestedValue = (obj: any, path: string): string | undefined => {
  const keys = path.split('.');
  let current = obj;

  for (const key of keys) {
    if (current === undefined || current === null) {
      return undefined;
    }
    current = current[key];
  }

  return typeof current === 'string' ? current : undefined;
};

/**
 * Interpolate parameters into a string
 * Supports {{paramName}} syntax
 */
const interpolate = (
  template: string,
  params?: Record<string, string | number>
): string => {
  if (!params) return template;

  return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    return params[key] !== undefined ? String(params[key]) : match;
  });
};

/**
 * Translation function
 * 
 * @param key - Dot-notation key (e.g., 'errors.network.generic')
 * @param params - Optional interpolation parameters
 * @returns Translated string or key if not found
 * 
 * @example
 * t('errors.network.generic') // "Unable to connect to server"
 * t('errors.generic.withResource', { resource: 'appointment' }) // "Could not load appointment"
 */
export const t = (
  key: string,
  params?: Record<string, string | number>
): string => {
  // Try current locale
  let translation = getNestedValue(resources[currentLocale], key);

  // Fallback to en-US if not found
  if (!translation && currentLocale !== 'en-US') {
    translation = getNestedValue(resources['en-US'], key);
  }

  // Return key if still not found (helps identify missing translations)
  if (!translation) {
    console.warn(`Missing translation: ${key}`);
    return key;
  }

  return interpolate(translation, params);
};

/**
 * Check if a translation key exists
 */
export const hasTranslation = (key: string): boolean => {
  return getNestedValue(resources[currentLocale], key) !== undefined ||
    getNestedValue(resources['en-US'], key) !== undefined;
};

// Initialize on module load (deferred to avoid SSR issues)
if (typeof window !== 'undefined') {
  // Only initialize in browser context
  initI18n().catch((err) => {
    console.warn('Failed to initialize i18n:', err);
  });
}

export default { t, changeLanguage, getCurrentLocale, initI18n };
