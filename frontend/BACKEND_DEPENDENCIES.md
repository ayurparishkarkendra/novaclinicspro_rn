# Backend Dependencies - NovaClinicsPro Frontend

This document lists all frontend features that are waiting for backend API endpoints.

## Summary

| Module | Feature | Status | Backend Tag Required |
|--------|---------|--------|---------------------|
| 9 | Analytics | ✅ Working | Analytics |
| 9 | Reports | ⏳ Waiting | Reports |
| 10 | Notifications | ⏳ Waiting | Notifications |
| 10 | Notification Preferences | ⏳ Waiting | Notification Preferences |
| 11 | Localization | ⏳ Waiting | Localization |
| 11 | Tenant Branding | ⏳ Waiting | Tenant Branding |
| 11 | Global Settings | ⏳ Waiting | Global Settings |

---

## Module 9: Analytics, Reports & Audit Logs

### Analytics ✅ WORKING
Backend endpoints exist and are being used.

### Reports ⏳ WAITING
**Required OpenAPI Tag**: `Reports`

**Required Endpoints**:
```
GET  /api/v1/tenants/{tenantId}/reports
GET  /api/v1/tenants/{tenantId}/reports/{reportId}
POST /api/v1/tenants/{tenantId}/reports/generate
GET  /api/v1/tenants/{tenantId}/reports/download/{reportId}
```

**Frontend Files Ready**:
- `/features/reports/presentation/pages/ReportsHomeScreen.tsx`
- See: `/features/reports/TODO.md`

---

## Module 10: Notifications & Preferences

### Notifications ⏳ WAITING
**Required OpenAPI Tag**: `Notifications`

**Required Endpoints**:
```
GET   /api/v1/tenants/{tenantId}/notifications
GET   /api/v1/tenants/{tenantId}/notifications/{id}
PATCH /api/v1/tenants/{tenantId}/notifications/{id}/read
POST  /api/v1/tenants/{tenantId}/notifications/mark-all-read
```

**Frontend Files Ready**:
- `/features/notifications/presentation/pages/NotificationsListScreen.tsx`
- `/features/notifications/presentation/pages/NotificationDetailScreen.tsx`
- See: `/features/notifications/TODO.md`

### Notification Preferences ⏳ WAITING
**Required OpenAPI Tag**: `Notification Preferences`

**Required Endpoints**:
```
GET   /api/v1/users/{userId}/notification-preferences
PATCH /api/v1/users/{userId}/notification-preferences/{id}
PUT   /api/v1/users/{userId}/notification-preferences/bulk
```

**Frontend Files Ready**:
- `/features/notificationPreferences/presentation/pages/NotificationPreferencesScreen.tsx`
- See: `/features/notificationPreferences/TODO.md`

---

## Module 11: Localization, Branding & Settings

### Localization ⏳ WAITING
**Required OpenAPI Tag**: `Localization`

**Required Endpoints**:
```
GET   /api/v1/localization/locales
GET   /api/v1/users/{userId}/locale
PATCH /api/v1/users/{userId}/locale
GET   /api/v1/tenants/{tenantId}/locale
PATCH /api/v1/tenants/{tenantId}/locale
```

**Frontend Files Ready**:
- `/features/localization/presentation/pages/UserLocaleSettingsScreen.tsx`
- `/features/localization/presentation/pages/TenantLocaleSettingsScreen.tsx`
- See: `/features/localization/TODO.md`

### Tenant Branding ⏳ WAITING
**Required OpenAPI Tag**: `Tenant Branding`

**Required Endpoints**:
```
GET   /api/v1/tenants/{tenantId}/branding
PATCH /api/v1/tenants/{tenantId}/branding
```

**Frontend Files Ready**:
- `/features/tenantBranding/presentation/pages/TenantBrandingSettingsScreen.tsx`
- See: `/features/tenantBranding/TODO.md`

### Global Settings ⏳ WAITING
**Required OpenAPI Tag**: `Global Settings`

**Required Endpoints**:
```
GET   /api/v1/settings/global
PATCH /api/v1/settings/global
GET   /api/v1/tenants/{tenantId}/settings
PATCH /api/v1/tenants/{tenantId}/settings
```

**Frontend Files Ready**:
- `/features/globalSettings/presentation/pages/SystemSettingsScreen.tsx`
- `/features/globalSettings/presentation/pages/TenantSettingsScreen.tsx`
- See: `/features/globalSettings/TODO.md`

---

## How to Enable When Backend Ready

1. **Add the tag** to the OpenAPI spec with the required endpoints
2. **Update the API datasource file** in `/features/{feature}/data/datasources/` - uncomment the API calls
3. **Update the repository file** in `/features/{feature}/data/repositories/` - the React Query hooks will automatically work
4. **Remove "Coming Soon" banner** from the presentation pages
5. **Test** the feature end-to-end

Each feature folder contains a detailed `TODO.md` file with:
- Expected DTO structures
- Specific files to update
- Additional requirements

---

## Current OpenAPI Tags Available

These tags exist in the backend and have working endpoints:

- Admin
- Analytics ✅
- Appointment Rules
- Appointments
- Applications
- Audit Logs
- Clinics
- Clients
- Documents
- Inventory
- RBAC
- Staff
- Subscriptions
- Tenants
- Treatment Sheets
- Treatments
- Trials
- Users
- Visits

---

## Last Updated
- Date: 2025-02-12
- By: Development Agent
