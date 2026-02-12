/**
 * Notification Preferences Feature
 * 
 * Provides per-user notification preference management.
 * Note: API endpoints are not yet available - UI will show placeholder state.
 */

// Data layer
export * from './data/models/notificationPreferences.dtos';
export * from './data/datasources/notificationPreferences.api';
export * from './data/repositories/notificationPreferences.repository.impl';

// Domain layer
export * from './domain/entities/notification-preference.entity';
export * from './domain/repositories/notificationPreferences.repository';

// Presentation layer
export { NotificationPreferencesScreen } from './presentation/pages/NotificationPreferencesScreen';
export { NotificationPreferenceItem } from './presentation/components/NotificationPreferenceItem';
export { NotificationChannelSection } from './presentation/components/NotificationChannelSection';
