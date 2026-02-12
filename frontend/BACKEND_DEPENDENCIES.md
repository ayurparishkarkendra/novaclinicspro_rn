# Backend Dependencies - NovaClinicsPro Frontend

This document lists all frontend features that are waiting for backend API endpoints.

## Quick Reference Summary

| Module | Feature | Status | Priority | Backend Tag Required | Est. Effort |
|--------|---------|--------|----------|---------------------|-------------|
| 9 | Analytics | ✅ Working | - | Analytics | Done |
| 9 | Reports | ⏳ Waiting | P1 | Reports | 2-3 days |
| 9 | Audit Logs | ✅ Working | - | Audit Logs | Done |
| 10 | Notifications | ⏳ Waiting | P0 | Notifications | 3-4 days |
| 10 | Notification Preferences | ⏳ Waiting | P1 | Notification Preferences | 2 days |
| 11 | Localization | ⏳ Waiting | P2 | Localization | 3-4 days |
| 11 | Tenant Branding | ⏳ Waiting | P2 | Tenant Branding | 2-3 days |
| 11 | Global Settings | ⏳ Waiting | P1 | Global Settings | 3 days |

---

## Module 9: Analytics, Reports & Audit Logs

### Analytics ✅ WORKING
Backend endpoints exist and are being used.
- `GET /api/v1/analytics/performance/summary`
- `GET /api/v1/analytics/revenue/summary`
- `GET /api/v1/analytics/users/growth`

### Reports ⏳ WAITING
**Priority**: P1 (High)
**Required OpenAPI Tag**: `Reports`

**Required Endpoints**:
```
GET  /api/v1/tenants/{tenantId}/reports                    # List report types/history
GET  /api/v1/tenants/{tenantId}/reports/{reportId}         # Get specific report
POST /api/v1/tenants/{tenantId}/reports/generate           # Generate new report
GET  /api/v1/tenants/{tenantId}/reports/download/{reportId} # Download as PDF/CSV
```

**Report Types Needed**:
- Financial: Revenue, billing summaries, payment history
- Clinical: Treatment outcomes, patient statistics
- Operational: Staff performance, appointment metrics
- Compliance: Audit trails, consent records

**Frontend Ready**: `/features/reports/`
**Detailed TODO**: `/features/reports/TODO.md`

### Audit Logs ✅ WORKING
Backend endpoints exist and are being used.
- `GET /api/v1/audit-logs`
- Route: `/clinic-admin/audit-logs`

---

## Module 10: Notifications & Preferences

### Notifications ⏳ WAITING
**Priority**: P0 (Critical - Core UX feature)
**Required OpenAPI Tag**: `Notifications`

**Required Endpoints**:
```
GET   /api/v1/tenants/{tenantId}/notifications              # List notifications
GET   /api/v1/tenants/{tenantId}/notifications/unread-count # Get badge count
GET   /api/v1/tenants/{tenantId}/notifications/{id}         # Get single notification
PATCH /api/v1/tenants/{tenantId}/notifications/{id}/read    # Mark as read
POST  /api/v1/tenants/{tenantId}/notifications/mark-all-read # Mark all as read
DELETE /api/v1/tenants/{tenantId}/notifications/{id}        # Delete notification
```

**Notification Categories**:
- Appointments: Reminders, cancellations, reschedules
- Billing: Payment received, invoices, due reminders
- Clinical: Documents ready, prescriptions
- System: Maintenance, security alerts

**Frontend Ready**: `/features/notifications/`
**Detailed TODO**: `/features/notifications/TODO.md`

### Notification Preferences ⏳ WAITING
**Priority**: P1 (High - User control feature)
**Required OpenAPI Tag**: `Notification Preferences`

**Required Endpoints**:
```
GET   /api/v1/users/{userId}/notification-preferences       # List user preferences
PATCH /api/v1/users/{userId}/notification-preferences/{id}  # Update single preference
PUT   /api/v1/users/{userId}/notification-preferences/bulk  # Bulk update
```

**Frontend Ready**: `/features/notificationPreferences/`
**Detailed TODO**: `/features/notificationPreferences/TODO.md`

---

## Module 11: Localization, Branding & Settings

### Localization ⏳ WAITING
**Priority**: P2 (Medium - Internationalization)
**Required OpenAPI Tag**: `Localization`

**Required Endpoints**:
```
GET   /api/v1/localization/locales                  # List supported locales
GET   /api/v1/users/{userId}/locale                 # Get user's locale
PATCH /api/v1/users/{userId}/locale                 # Update user's locale
GET   /api/v1/tenants/{tenantId}/locale             # Get tenant default locale
PATCH /api/v1/tenants/{tenantId}/locale             # Update tenant locale
```

**Supported Locales (Planned)**:
- English (US/India), Hindi, Tamil, Telugu, Kannada, Malayalam, Marathi

**Frontend Ready**: `/features/localization/`
**Detailed TODO**: `/features/localization/TODO.md`

### Tenant Branding ⏳ WAITING
**Priority**: P2 (Medium - White-label feature)
**Required OpenAPI Tag**: `Tenant Branding`

**Required Endpoints**:
```
GET   /api/v1/tenants/{tenantId}/branding           # Get tenant branding
PATCH /api/v1/tenants/{tenantId}/branding           # Update branding
POST  /api/v1/tenants/{tenantId}/branding/logo      # Upload logo (optional)
```

**Frontend Ready**: `/features/tenantBranding/`
**Detailed TODO**: `/features/tenantBranding/TODO.md`

### Global Settings ⏳ WAITING
**Priority**: P1 (High - Feature flags & config)
**Required OpenAPI Tag**: `Global Settings`

**Required Endpoints**:
```
GET   /api/v1/settings/global                       # Get global settings (Super Admin)
PATCH /api/v1/settings/global                       # Update global settings
GET   /api/v1/tenants/{tenantId}/settings           # Get tenant overrides
PATCH /api/v1/tenants/{tenantId}/settings           # Update tenant overrides
```

**Frontend Ready**: `/features/globalSettings/`
**Detailed TODO**: `/features/globalSettings/TODO.md`

---

## Implementation Guide: How to Enable When Backend Ready

### Step-by-Step Process

1. **Backend Team**: Add the required tag and endpoints to OpenAPI spec

2. **Frontend Developer**: Update the API datasource file
   ```typescript
   // /features/{feature}/data/datasources/{feature}.api.ts
   // Uncomment the API calls and update endpoint paths
   ```

3. **Frontend Developer**: Enable repository hooks
   ```typescript
   // /features/{feature}/data/repositories/{feature}.repository.impl.ts
   // React Query hooks will automatically work once datasource is updated
   ```

4. **Frontend Developer**: Update presentation layer
   - Remove "Coming Soon" banner from screens
   - Enable form controls (buttons, toggles, inputs)
   - Connect form submissions to mutation hooks

5. **QA**: Test end-to-end flow
   - Verify data loads correctly
   - Test all CRUD operations
   - Verify error handling

---

## Current OpenAPI Tags Available (Working)

These tags exist in the backend and have working endpoints:

- Admin
- Analytics ✅
- Appointment Rules
- Appointments
- Applications
- Audit Logs ✅
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

## Contact & Coordination

**Frontend Files Location**: `/app/frontend/features/`
**Backend API Base**: `https://given-dolly-ayurparishkarkendra-e5891817.koyeb.app`

**When adding new endpoints, please**:
1. Follow existing OpenAPI spec patterns
2. Include pagination for list endpoints
3. Return consistent error formats
4. Document all request/response schemas

---

## Last Updated
- Date: 2025-06-XX (Updated)
- By: Development Agent
