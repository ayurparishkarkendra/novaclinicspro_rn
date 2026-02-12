# Module 10: Notification Preferences Feature - TODO

## Status: ⏳ WAITING FOR BACKEND

The Notification Preferences feature UI is built but **disabled** because the required API endpoints do not exist.

### What's Built (Frontend)
- `NotificationPreferencesScreen` - User preference management
- `NotificationPreferenceItem` - Toggle component for each preference
- `NotificationChannelSection` - Group preferences by channel
- Route: `/notification-preferences`

### Backend Dependencies - REQUIRED

The following endpoints are **expected** but **do not exist** in the OpenAPI spec:

| Expected Endpoint | Expected Tag | Purpose | Status |
|-------------------|--------------|---------|--------|
| `GET /api/v1/users/{userId}/notification-preferences` | Notification Preferences | List user preferences | ❌ Not Found |
| `PATCH /api/v1/users/{userId}/notification-preferences/{id}` | Notification Preferences | Update single preference | ❌ Not Found |
| `PUT /api/v1/users/{userId}/notification-preferences/bulk` | Notification Preferences | Bulk update preferences | ❌ Not Found |

### Why We're Waiting
1. **No "Notification Preferences" tag exists** in the current OpenAPI spec
2. Per PRD rules: "If no suitable operation exists, render controls as disabled/unavailable"
3. The UI shows preview of all preference options with disabled toggles

### Expected Preference Structure
```typescript
interface NotificationPreferenceDto {
  id: string;
  user_id: string;
  event_type: NotificationEventType;  // e.g., 'appointment_reminder'
  channel: 'in_app' | 'email' | 'sms';
  frequency: 'immediate' | 'daily' | 'weekly' | 'off';
  enabled: boolean;
}
```

### Expected Event Types
- `appointment_reminder` - Before appointments
- `appointment_cancelled` - When cancelled
- `appointment_rescheduled` - Time changes
- `payment_received` - Payment confirmations
- `invoice_generated` - New invoices
- `payment_due` - Due date reminders
- `clinical_document_ready` - Documents available
- `prescription_ready` - Prescriptions ready
- `system_maintenance` - Scheduled maintenance
- `security_alert` - Security notifications

### When Backend Adds These Endpoints
1. Update `/features/notificationPreferences/data/datasources/notificationPreferences.api.ts`
2. Update `/features/notificationPreferences/data/repositories/notificationPreferences.repository.impl.ts`
3. Remove "Coming Soon" banner
4. Enable toggle switches

### Files to Update When Ready
```
/app/frontend/features/notificationPreferences/
├── data/
│   ├── datasources/notificationPreferences.api.ts    <- Uncomment API calls
│   └── repositories/notificationPreferences.repository.impl.ts
└── presentation/
    └── pages/NotificationPreferencesScreen.tsx       <- Enable toggles
```

---

## Last Updated
- Date: 2025-02-12
- By: Development Agent
