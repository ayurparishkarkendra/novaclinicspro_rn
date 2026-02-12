/**
 * Use Notification Badge Count Hook
 * Provides unread notification count for header badges
 */

import { useUnreadNotificationCount } from '../../data/repositories/notifications.repository.impl';
import { useAuth } from '../../../auth/presentation/hooks/useAuth';

/**
 * Hook to get the unread notification count for the current user/tenant
 * Used for displaying badges in dashboard headers
 * 
 * Note: Returns 0 when Notifications API is not available
 */
export function useNotificationBadgeCount(): number {
  const { currentUser } = useAuth();
  const tenantId = currentUser?.activeTenant?.id || '';
  
  const unreadCount = useUnreadNotificationCount(tenantId);
  
  return unreadCount;
}
