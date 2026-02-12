/**
 * Localization Repository Interface
 */

import { Locale } from '../entities/locale.entity';

export interface SupportedLocalesResult {
  locales: Locale[];
  defaultLocale: string;
}

export interface UserLocale {
  userId: string;
  localeCode: string;
}

export interface TenantLocale {
  tenantId: string;
  defaultLocaleCode: string;
  supportedLocales: string[];
}

export interface ILocalizationRepository {
  getSupportedLocales(): Promise<SupportedLocalesResult>;
  getUserLocale(userId: string): Promise<UserLocale>;
  updateUserLocale(userId: string, localeCode: string): Promise<UserLocale>;
  getTenantDefaultLocale(tenantId: string): Promise<TenantLocale>;
  updateTenantDefaultLocale(tenantId: string, localeCode: string): Promise<TenantLocale>;
}
