/**
 * Localization Module Exports
 * 
 * Usage:
 * import { t, ErrorTokens, changeLanguage } from '@/core/localization';
 * 
 * // Get translated error message
 * const message = t(ErrorTokens.network.generic);
 * 
 * // With interpolation
 * const resourceError = t(ErrorTokens.generic.withResource, { resource: 'appointment' });
 */

export { t, changeLanguage, getCurrentLocale, initI18n, SUPPORTED_LOCALES, hasTranslation } from './i18n';
export type { LocaleCode } from './i18n';
export { ErrorTokens } from './errorTokens';
export type { ErrorTokenKey } from './errorTokens';
