# Module 10: Notification Preferences Feature - Implementation Guide

## Status: ⏳ WAITING FOR BACKEND

**Priority**: P1 (High - User control feature)
**Estimated Effort**: 2 days after backend ready
**Dependencies**: Backend API endpoints, Notifications module

---

## Current State

### What's Built (Frontend - Ready)

| Component | Location | Status |
|-----------|----------|--------|
| NotificationPreferencesScreen | `/presentation/pages/NotificationPreferencesScreen.tsx` | ✅ Built (disabled) |
| NotificationPreferenceItem | `/presentation/components/NotificationPreferenceItem.tsx` | ✅ Built |
| NotificationChannelSection | `/presentation/components/NotificationChannelSection.tsx` | ✅ Built |
| API Datasource | `/data/datasources/notificationPreferences.api.ts` | ⏳ Placeholder |
| Repository | `/data/repositories/notificationPreferences.repository.impl.ts` | ⏳ Placeholder |
| DTOs | `/data/models/notificationPreferences.dtos.ts` | ✅ Defined |

**Route**: `/notification-preferences`

### Current UI Behavior
- Shows "Coming Soon" banner
- Displays all preference categories in preview mode
- All toggle switches disabled
- Save button disabled
- No API calls made

---

## Backend Requirements

### Required API Endpoints

| Method | Endpoint | Purpose | Request Body | Response |
|--------|----------|---------|--------------|----------|
| GET | `/api/v1/users/{userId}/notification-preferences` | List preferences | - | `NotificationPreferenceDto[]` |
| PATCH | `/api/v1/users/{userId}/notification-preferences/{id}` | Update single | `UpdatePreferenceDto` | `NotificationPreferenceDto` |
| PUT | `/api/v1/users/{userId}/notification-preferences/bulk` | Bulk update | `UpdatePreferenceDto[]` | `NotificationPreferenceDto[]` |

### Expected DTOs

```typescript
// Notification Channels
type NotificationChannel = 'in_app' | 'email' | 'sms' | 'push';

// Frequency Options
type NotificationFrequency = 'immediate' | 'daily_digest' | 'weekly_digest' | 'off';

// Event Types (matches notification events)
type NotificationEventType = 
  | 'appointment_reminder'
  | 'appointment_confirmed'
  | 'appointment_cancelled'
  | 'appointment_rescheduled'
  | 'payment_received'
  | 'invoice_generated'
  | 'payment_due'
  | 'payment_overdue'
  | 'clinical_document_ready'
  | 'prescription_ready'
  | 'lab_results_ready'
  | 'system_maintenance'
  | 'security_alert';

// Single Preference
interface NotificationPreferenceDto {
  id: string;
  user_id: string;
  event_type: NotificationEventType;
  channel: NotificationChannel;
  enabled: boolean;
  frequency: NotificationFrequency;
  created_at: string;
  updated_at: string;
}

// Update Request
interface UpdatePreferenceDto {
  id?: string;  // Optional for bulk create
  event_type: NotificationEventType;
  channel: NotificationChannel;
  enabled: boolean;
  frequency?: NotificationFrequency;
}
```

### Default Preferences (when user first visits)

Backend should create default preferences with these values:

| Event Type | In-App | Email | SMS | Push |
|------------|--------|-------|-----|------|
| appointment_reminder | ✅ | ✅ | ❌ | ✅ |
| appointment_confirmed | ✅ | ✅ | ❌ | ❌ |
| appointment_cancelled | ✅ | ✅ | ✅ | ✅ |
| appointment_rescheduled | ✅ | ✅ | ❌ | ✅ |
| payment_received | ✅ | ✅ | ❌ | ❌ |
| invoice_generated | ✅ | ✅ | ❌ | ❌ |
| payment_due | ✅ | ✅ | ✅ | ✅ |
| payment_overdue | ✅ | ✅ | ✅ | ✅ |
| clinical_document_ready | ✅ | ✅ | ❌ | ✅ |
| prescription_ready | ✅ | ✅ | ❌ | ✅ |
| security_alert | ✅ | ✅ | ✅ | ✅ |
| system_maintenance | ✅ | ❌ | ❌ | ❌ |

---

## Implementation Steps (When Backend Ready)

### Step 1: Update API Datasource

**File**: `/features/notificationPreferences/data/datasources/notificationPreferences.api.ts`

```typescript
import { apiClient } from '@/core/api/client';
import { 
  NotificationPreferenceDto, 
  UpdatePreferenceDto 
} from '../models/notificationPreferences.dtos';

export const notificationPreferencesApi = {
  getPreferences: async (userId: string): Promise<NotificationPreferenceDto[]> => {
    const response = await apiClient.get(
      `/api/v1/users/${userId}/notification-preferences`
    );
    return response.data;
  },

  updatePreference: async (
    userId: string, 
    id: string, 
    data: UpdatePreferenceDto
  ): Promise<NotificationPreferenceDto> => {
    const response = await apiClient.patch(
      `/api/v1/users/${userId}/notification-preferences/${id}`,
      data
    );
    return response.data;
  },

  bulkUpdatePreferences: async (
    userId: string, 
    data: UpdatePreferenceDto[]
  ): Promise<NotificationPreferenceDto[]> => {
    const response = await apiClient.put(
      `/api/v1/users/${userId}/notification-preferences/bulk`,
      data
    );
    return response.data;
  },
};
```

### Step 2: Enable Repository Hooks

**File**: `/features/notificationPreferences/data/repositories/notificationPreferences.repository.impl.ts`

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationPreferencesApi } from '../datasources/notificationPreferences.api';

export const useNotificationPreferences = (userId: string) => {
  return useQuery({
    queryKey: ['notification-preferences', userId],
    queryFn: () => notificationPreferencesApi.getPreferences(userId),
    enabled: !!userId,
  });
};

export const useUpdatePreference = (userId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdatePreferenceDto }) =>
      notificationPreferencesApi.updatePreference(userId, id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notification-preferences', userId] });
    },
  });
};

export const useBulkUpdatePreferences = (userId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdatePreferenceDto[]) =>
      notificationPreferencesApi.bulkUpdatePreferences(userId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notification-preferences', userId] });
    },
  });
};
```

### Step 3: Update Presentation Layer

**File**: `/features/notificationPreferences/presentation/pages/NotificationPreferencesScreen.tsx`

- Remove "Coming Soon" banner
- Enable all toggle switches
- Implement toggle change handlers
- Add save button functionality
- Show loading states
- Show success/error toasts

---

## UI Design Specifications

### Screen Layout

```
┌─────────────────────────────────┐
│ ← Notification Preferences      │
├─────────────────────────────────┤
│ ┌─────────────────────────────┐ │
│ │ 📅 Appointments             │ │
│ ├─────────────────────────────┤ │
│ │ Appointment Reminders       │ │
│ │ ○ In-App  ○ Email  ○ SMS    │ │
│ ├─────────────────────────────┤ │
│ │ Appointment Cancelled       │ │
│ │ ○ In-App  ○ Email  ○ SMS    │ │
│ └─────────────────────────────┘ │
│                                 │
│ ┌─────────────────────────────┐ │
│ │ 💰 Billing                  │ │
│ ├─────────────────────────────┤ │
│ │ Payment Received            │ │
│ │ ○ In-App  ○ Email  ○ SMS    │ │
│ └─────────────────────────────┘ │
│                                 │
│ [ Save Preferences ]            │
└─────────────────────────────────┘
```

### Interaction Patterns

1. **Immediate Toggle**: Each toggle updates immediately (optimistic UI)
2. **Batch Save**: Alternative pattern with "Save" button
3. **Category Toggle**: "Enable all" / "Disable all" for each category
4. **Channel Toggle**: "Enable all email" / "Disable all SMS"

---

## Testing Checklist

### API Integration Tests
- [ ] Get preferences returns all event types
- [ ] Update single preference works
- [ ] Bulk update preferences works
- [ ] New user gets default preferences

### UI Tests
- [ ] All categories display correctly
- [ ] Toggle switch updates preference
- [ ] Loading state shows during save
- [ ] Success toast on save
- [ ] Error handling for failed save
- [ ] Navigate back preserves changes

### Edge Cases
- [ ] First-time user (no existing preferences)
- [ ] Network error during save
- [ ] Rapid toggle clicks (debounce)
- [ ] Back navigation with unsaved changes

---

## Files to Update When Ready

```
/app/frontend/features/notificationPreferences/
├── data/
│   ├── datasources/notificationPreferences.api.ts    <- UNCOMMENT API calls
│   ├── models/notificationPreferences.dtos.ts        <- VERIFY DTOs
│   └── repositories/notificationPreferences.repository.impl.ts <- ENABLE hooks
├── presentation/
│   ├── pages/
│   │   └── NotificationPreferencesScreen.tsx         <- REMOVE Coming Soon, ENABLE toggles
│   └── components/
│       ├── NotificationPreferenceItem.tsx            <- ENABLE toggle
│       └── NotificationChannelSection.tsx            <- ENABLE section toggle
└── index.ts
```

---

## Last Updated
- Date: 2025-06-XX (Enhanced)
- By: Development Agent
