/**
 * Notifications List Route
 * /notifications - Now uses backend-integrated Notification History Screen
 */

import React from 'react';
import { NotificationHistoryScreen } from '../../features/notifications/presentation/pages/NotificationHistoryScreen';

export default function NotificationsRoute() {
  return <NotificationHistoryScreen />;
}
