# Module 10: Notifications Feature - TODO

## Status: ⏳ WAITING FOR BACKEND

The Notifications feature UI is built but **disabled** because the required API endpoints do not exist.

### What's Built (Frontend)
- `NotificationsListScreen` - Notification inbox with filters (All/Unread)
- `NotificationDetailScreen` - Full notification view
- `NotificationListItem` - Individual notification row component
- `NotificationCategoryBadge` - Category indicator (Appointments, Billing, Clinical, System)
- `NotificationsIconWithBadge` - Header icon with unread count
- `useNotificationBadgeCount` hook - For dashboard integration
- Routes: `/notifications`, `/notifications/[notificationId]`

### Backend Dependencies - REQUIRED

The following endpoints are **expected** but **do not exist** in the OpenAPI spec:

| Expected Endpoint | Expected Tag | Purpose | Status |
|-------------------|--------------|---------|--------|
| `GET /api/v1/tenants/{tenantId}/notifications` | Notifications | List notifications for user | ❌ Not Found |
| `GET /api/v1/tenants/{tenantId}/notifications/{id}` | Notifications | Get single notification | ❌ Not Found |
| `PATCH /api/v1/tenants/{tenantId}/notifications/{id}/read` | Notifications | Mark as read | ❌ Not Found |
| `POST /api/v1/tenants/{tenantId}/notifications/mark-all-read` | Notifications | Mark all as read | ❌ Not Found |

### Why We're Waiting
1. **No "Notifications" tag exists** in the current OpenAPI spec
2. Per PRD rules: "If no suitable operation exists, render controls as disabled/unavailable"
3. The UI shows a friendly "Coming Soon" message with preview of expected features

### Expected Notification Categories (from PRD)
- **Appointments**: Reminders, cancellations, reschedules
- **Billing**: Payment received, invoices, due reminders
- **Clinical**: Documents ready, prescriptions
- **System**: Maintenance, security alerts

### Expected DTO Structure
```typescript
interface NotificationDto {
  id: string;
  tenant_id: string;
  user_id: string;
  title: string;
  message: string;
  category: 'appointments' | 'billing' | 'clinical' | 'system' | 'general';
  importance: 'low' | 'medium' | 'high' | 'urgent';
  created_at: string;
  read_at: string | null;
  related_resource_type?: string;
  related_resource_id?: string;
  action_url?: string;
}
```

### When Backend Adds These Endpoints
1. Update `/features/notifications/data/datasources/notifications.api.ts`
2. Update `/features/notifications/data/repositories/notifications.repository.impl.ts`
3. Remove "Coming Soon" banner from screens
4. Enable mark as read functionality
5. Badge count will automatically start working

### Files to Update When Ready
```
/app/frontend/features/notifications/
├── data/
│   ├── datasources/notifications.api.ts          <- Uncomment API calls
│   └── repositories/notifications.repository.impl.ts <- Enable hooks
└── presentation/
    ├── pages/NotificationsListScreen.tsx         <- Remove Coming Soon
    └── pages/NotificationDetailScreen.tsx        <- Enable mark as read
```

---

## Last Updated
- Date: 2025-02-12
- By: Development Agent
