/**
 * Global Settings Feature
 * 
 * Provides global and tenant-level configuration flags.
 * Note: API endpoints are not yet available - UI will show placeholder state.
 */

// Data layer
export * from './data/models/globalSettings.dtos';
export * from './data/datasources/globalSettings.api';
export * from './data/repositories/globalSettings.repository.impl';

// Domain layer
export * from './domain/entities/global-settings.entity';
export * from './domain/entities/tenant-settings.entity';

// Presentation layer
export { SystemSettingsScreen } from './presentation/pages/SystemSettingsScreen';
export { TenantSettingsScreen } from './presentation/pages/TenantSettingsScreen';
