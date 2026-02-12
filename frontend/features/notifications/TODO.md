# Module 10: Notifications Feature - Implementation Guide

## Status: ⏳ WAITING FOR BACKEND

**Priority**: P0 (Critical - Core UX Feature)
**Estimated Effort**: 3-4 days after backend ready
**Dependencies**: Backend API endpoints, Push notification service (optional)

---

## Current State

### What's Built (Frontend - Ready)

| Component | Location | Status |
|-----------|----------|--------|
| NotificationsListScreen | `/presentation/pages/NotificationsListScreen.tsx` | ✅ Built (disabled) |
| NotificationDetailScreen | `/presentation/pages/NotificationDetailScreen.tsx` | ✅ Built (disabled) |
| NotificationListItem | `/presentation/components/NotificationListItem.tsx` | ✅ Built |
| NotificationCategoryBadge | `/presentation/components/NotificationCategoryBadge.tsx` | ✅ Built |
| NotificationsIconWithBadge | `/presentation/components/NotificationsIconWithBadge.tsx` | ✅ Built |
| useNotificationBadgeCount | `/presentation/hooks/useNotificationBadgeCount.ts` | ✅ Built (returns 0) |
| API Datasource | `/data/datasources/notifications.api.ts` | ⏳ Placeholder |
| Repository | `/data/repositories/notifications.repository.impl.ts` | ⏳ Placeholder |
| DTOs | `/data/models/notifications.dtos.ts` | ✅ Defined |

**Routes**: 
- `/notifications` - List all notifications
- `/notifications/[notificationId]` - View single notification

### Current UI Behavior
- Shows "Coming Soon" banner
- Displays placeholder notification items
- Filter tabs (All/Unread) visible but non-functional
- Bell icon in header shows badge (currently always 0)
- Mark as read buttons disabled

---

## Backend Requirements

### Required API Endpoints

| Method | Endpoint | Purpose | Request Body | Response |
|--------|----------|---------|--------------|----------|
| GET | `/api/v1/tenants/{tenantId}/notifications` | List notifications | Query params | `NotificationListResponse` |
| GET | `/api/v1/tenants/{tenantId}/notifications/unread-count` | Badge count | - | `{ count: number }` |
| GET | `/api/v1/tenants/{tenantId}/notifications/{id}` | Get single | - | `NotificationDto` |
| PATCH | `/api/v1/tenants/{tenantId}/notifications/{id}/read` | Mark as read | - | `NotificationDto` |
| POST | `/api/v1/tenants/{tenantId}/notifications/mark-all-read` | Mark all read | - | `{ updated: number }` |
| DELETE | `/api/v1/tenants/{tenantId}/notifications/{id}` | Delete | - | `{ success: boolean }` |

### Query Parameters for List Endpoint

```
GET /api/v1/tenants/{tenantId}/notifications?
  page=1&
  limit=20&
  filter=unread&           // 'all' | 'unread'
  category=appointments&   // optional category filter
  sort=created_at&
  order=desc
```

### Expected DTOs

```typescript
// Notification Categories
type NotificationCategory = 
  | 'appointments'   // Reminders, cancellations, reschedules
  | 'billing'        // Payments, invoices, due reminders
  | 'clinical'       // Documents, prescriptions, lab results
  | 'system'         // Maintenance, security alerts
  | 'general';       // Other notifications

type NotificationImportance = 'low' | 'medium' | 'high' | 'urgent';

// Single Notification
interface NotificationDto {
  id: string;
  tenant_id: string;
  user_id: string;
  title: string;
  message: string;
  category: NotificationCategory;
  importance: NotificationImportance;
  created_at: string;           // ISO datetime
  read_at: string | null;       // null if unread
  related_resource_type?: string;  // e.g., 'appointment', 'invoice'
  related_resource_id?: string;    // ID of related resource
  action_url?: string;             // Deep link path
  metadata?: Record<string, any>;  // Additional data
}

// List Response with Pagination
interface NotificationListResponse {
  data: NotificationDto[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
  unread_count: number;
}
```

### Notification Event Types (for backend to generate)

| Event | Category | Importance | Trigger |
|-------|----------|------------|----------|
| `appointment_reminder` | appointments | medium | 24h before appointment |
| `appointment_confirmed` | appointments | low | Appointment booked |
| `appointment_cancelled` | appointments | high | Appointment cancelled |
| `appointment_rescheduled` | appointments | medium | Time changed |
| `payment_received` | billing | low | Payment processed |
| `invoice_generated` | billing | medium | New invoice created |
| `payment_due` | billing | high | Payment due in 3 days |
| `payment_overdue` | billing | urgent | Payment past due |
| `clinical_document_ready` | clinical | medium | Document uploaded |
| `prescription_ready` | clinical | medium | Prescription created |
| `lab_results_ready` | clinical | high | Lab results available |
| `system_maintenance` | system | low | Scheduled maintenance |
| `security_alert` | system | urgent | Security event |
| `password_changed` | system | medium | Password updated |

---

## Implementation Steps (When Backend Ready)

### Step 1: Update API Datasource

**File**: `/features/notifications/data/datasources/notifications.api.ts`

```typescript
import { apiClient } from '@/core/api/client';
import { NotificationDto, NotificationListResponse } from '../models/notifications.dtos';

export interface GetNotificationsParams {
  page?: number;
  limit?: number;
  filter?: 'all' | 'unread';
  category?: string;
}

export const notificationsApi = {
  getNotifications: async (
    tenantId: string, 
    params: GetNotificationsParams = {}
  ): Promise<NotificationListResponse> => {
    const response = await apiClient.get(
      `/api/v1/tenants/${tenantId}/notifications`,
      { params }
    );
    return response.data;
  },

  getUnreadCount: async (tenantId: string): Promise<number> => {
    const response = await apiClient.get(
      `/api/v1/tenants/${tenantId}/notifications/unread-count`
    );
    return response.data.count;
  },

  getNotification: async (tenantId: string, id: string): Promise<NotificationDto> => {
    const response = await apiClient.get(
      `/api/v1/tenants/${tenantId}/notifications/${id}`
    );
    return response.data;
  },

  markAsRead: async (tenantId: string, id: string): Promise<NotificationDto> => {
    const response = await apiClient.patch(
      `/api/v1/tenants/${tenantId}/notifications/${id}/read`
    );
    return response.data;
  },

  markAllAsRead: async (tenantId: string): Promise<{ updated: number }> => {
    const response = await apiClient.post(
      `/api/v1/tenants/${tenantId}/notifications/mark-all-read`
    );
    return response.data;
  },

  deleteNotification: async (tenantId: string, id: string): Promise<void> => {
    await apiClient.delete(`/api/v1/tenants/${tenantId}/notifications/${id}`);
  },
};
```

### Step 2: Enable Repository Hooks

**File**: `/features/notifications/data/repositories/notifications.repository.impl.ts`

```typescript
import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { notificationsApi, GetNotificationsParams } from '../datasources/notifications.api';

export const useNotifications = (tenantId: string, params: GetNotificationsParams) => {
  return useInfiniteQuery({
    queryKey: ['notifications', tenantId, params],
    queryFn: ({ pageParam = 1 }) => 
      notificationsApi.getNotifications(tenantId, { ...params, page: pageParam }),
    getNextPageParam: (lastPage) => 
      lastPage.pagination.page < lastPage.pagination.total_pages 
        ? lastPage.pagination.page + 1 
        : undefined,
    enabled: !!tenantId,
  });
};

export const useUnreadCount = (tenantId: string) => {
  return useQuery({
    queryKey: ['notifications', 'unread-count', tenantId],
    queryFn: () => notificationsApi.getUnreadCount(tenantId),
    enabled: !!tenantId,
    refetchInterval: 60000, // Refetch every minute
  });
};

export const useMarkAsRead = (tenantId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => notificationsApi.markAsRead(tenantId, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
};

export const useMarkAllAsRead = (tenantId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => notificationsApi.markAllAsRead(tenantId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
};
```

### Step 3: Update Badge Count Hook

**File**: `/features/notifications/presentation/hooks/useNotificationBadgeCount.ts`

```typescript
import { useUnreadCount } from '../../data/repositories/notifications.repository.impl';
import { useAuth } from '@/features/auth/presentation/context/AuthContext';

export const useNotificationBadgeCount = (): number => {
  const { user } = useAuth();
  const tenantId = user?.tenantId;
  
  const { data: count = 0 } = useUnreadCount(tenantId || '');
  return count;
};
```

### Step 4: Update Presentation Layer

**Files to update**:
- `NotificationsListScreen.tsx` - Remove Coming Soon, enable infinite scroll
- `NotificationDetailScreen.tsx` - Enable mark as read
- `NotificationListItem.tsx` - Add swipe to delete/mark read

---

## Testing Checklist

### API Integration Tests
- [ ] List notifications returns paginated data
- [ ] Unread count endpoint returns correct number
- [ ] Mark as read updates notification
- [ ] Mark all as read works
- [ ] Delete notification works
- [ ] Filter by category works
- [ ] Filter unread only works

### UI Tests
- [ ] Notification list displays correctly
- [ ] Unread notifications show indicator
- [ ] Badge count updates in real-time
- [ ] Pull to refresh works
- [ ] Infinite scroll pagination works
- [ ] Tap notification navigates to detail
- [ ] Mark as read button works
- [ ] Mark all as read button works
- [ ] Category filter tabs work
- [ ] Empty state displays correctly

### Deep Linking Tests
- [ ] Tap appointment notification → Opens appointment
- [ ] Tap billing notification → Opens invoice
- [ ] Tap clinical notification → Opens document

### Edge Cases
- [ ] Empty notification list
- [ ] 100+ notifications (performance)
- [ ] Network error handling
- [ ] Offline mode behavior

---

## Future Enhancements (Post-MVP)

### Push Notifications
- Integrate Expo Push Notifications
- Handle notification tap from background
- Badge update on push receive

### Real-time Updates
- WebSocket connection for instant updates
- Optimistic UI updates

### Notification Grouping
- Group by date (Today, Yesterday, This Week)
- Group by category
- Batch actions on groups

---

## Files to Update When Ready

```
/app/frontend/features/notifications/
├── data/
│   ├── datasources/notifications.api.ts         <- UNCOMMENT API calls
│   ├── models/notifications.dtos.ts             <- VERIFY DTOs match API
│   └── repositories/notifications.repository.impl.ts <- ENABLE hooks
├── presentation/
│   ├── pages/
│   │   ├── NotificationsListScreen.tsx          <- REMOVE Coming Soon, ENABLE features
│   │   └── NotificationDetailScreen.tsx         <- ENABLE mark as read
│   ├── components/
│   │   ├── NotificationListItem.tsx             <- ADD swipe actions
│   │   └── NotificationsIconWithBadge.tsx       <- CONNECT to real count
│   └── hooks/
│       └── useNotificationBadgeCount.ts         <- CONNECT to API
└── index.ts
```

---

## Last Updated
- Date: 2025-06-XX (Enhanced)
- By: Development Agent
