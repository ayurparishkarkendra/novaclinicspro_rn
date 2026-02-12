/**
 * Localization Feature
 * 
 * Provides language/locale selection and translated UI text.
 * Note: API endpoints are not yet available - UI will show placeholder state.
 */

// Data layer
export * from './data/models/localization.dtos';
export * from './data/datasources/localization.api';
export * from './data/repositories/localization.repository.impl';

// Domain layer
export * from './domain/entities/locale.entity';
export * from './domain/repositories/localization.repository';

// Presentation layer
export { UserLocaleSettingsScreen } from './presentation/pages/UserLocaleSettingsScreen';
export { TenantLocaleSettingsScreen } from './presentation/pages/TenantLocaleSettingsScreen';
export { LocaleSelect } from './presentation/components/LocaleSelect';
