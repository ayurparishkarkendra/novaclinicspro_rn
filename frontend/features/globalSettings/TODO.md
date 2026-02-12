# Module 11: Global Settings Feature - TODO

## Status: ⏳ WAITING FOR BACKEND

The Global Settings feature UI is built but **disabled** because the required API endpoints do not exist.

### What's Built (Frontend)
- `SystemSettingsScreen` - Super Admin global settings management
- `TenantSettingsScreen` - Clinic Admin tenant-specific overrides
- Routes: `/super-admin/system-settings`, `/clinic-admin/settings/global`

### Settings Categories

#### Feature Flags
| Flag | Description | Default |
|------|-------------|--------|
| enableAppointmentReminders | Automated appointment reminders | true |
| enableOnlineBooking | Patient self-booking | true |
| enableSmsNotifications | SMS notification channel | false |
| enableEmailNotifications | Email notification channel | true |
| enableAnalytics | Analytics dashboard | true |
| enableReports | Reports module | false |
| enableInventoryAlerts | Low stock alerts | true |
| enableBillingModule | Billing features | true |

#### Compliance Settings
| Setting | Description | Default |
|---------|-------------|--------|
| showConsentBanner | Display consent banner | true |
| dataRetentionDays | Data retention period | 365 |
| requirePatientConsent | Require explicit consent | true |
| hipaaMode | HIPAA compliance mode | false |
| gdprMode | GDPR compliance mode | false |

#### Default Values
| Setting | Description | Default |
|---------|-------------|--------|
| defaultAppointmentDuration | Minutes | 30 |
| defaultTimeZone | Timezone | Asia/Kolkata |
| defaultCurrency | Currency code | INR |
| defaultDateFormat | Date format | DD/MM/YYYY |
| defaultTimeFormat | Time format | 12h |

### Backend Dependencies - REQUIRED

The following endpoints are **expected** but **do not exist** in the OpenAPI spec:

| Expected Endpoint | Expected Tag | Purpose | Status |
|-------------------|--------------|---------|--------|
| `GET /api/v1/settings/global` | Global Settings | Get global settings | ❌ Not Found |
| `PATCH /api/v1/settings/global` | Global Settings | Update global settings | ❌ Not Found |
| `GET /api/v1/tenants/{tenantId}/settings` | Global Settings | Get tenant overrides | ❌ Not Found |
| `PATCH /api/v1/tenants/{tenantId}/settings` | Global Settings | Update tenant overrides | ❌ Not Found |

### Why We're Waiting
1. **No "Global Settings" tag exists** in the current OpenAPI spec
2. Per PRD rules: "If no suitable operation exists, render controls as disabled/unavailable"
3. The UI shows all settings with disabled toggles in preview mode

### Expected DTO Structure
```typescript
interface GlobalSettingsDto {
  id: string;
  featureFlags: FeatureFlags;
  compliance: ComplianceSettings;
  defaults: DefaultSettings;
  updatedAt: string;
  updatedBy: string;
}

interface TenantSettingsDto {
  tenantId: string;
  featureOverrides: Partial<FeatureFlags>;
  complianceOverrides: Partial<ComplianceSettings>;
  defaultOverrides: Partial<DefaultSettings>;
  updatedAt: string;
  updatedBy: string;
}
```

### RBAC Requirements
- **Super Admin**: Can modify global settings affecting all tenants
- **Clinic Admin**: Can only modify tenant-specific overrides
- **Other roles**: Read-only or no access

### When Backend Adds These Endpoints
1. Update `/features/globalSettings/data/datasources/globalSettings.api.ts`
2. Update `/features/globalSettings/data/repositories/globalSettings.repository.impl.ts`
3. Remove "Coming Soon" banner
4. Enable toggle switches
5. Implement feature flag consumption in other modules

### Files to Update When Ready
```
/app/frontend/features/globalSettings/
├── data/
│   ├── datasources/globalSettings.api.ts         <- Uncomment API calls
│   └── repositories/globalSettings.repository.impl.ts
└── presentation/
    ├── pages/SystemSettingsScreen.tsx            <- Enable toggles
    └── pages/TenantSettingsScreen.tsx            <- Enable toggles

/app/frontend/core/hooks/
└── useFeatureFlag.ts                             <- Create when ready
```

### Feature Flag Integration
When backend is ready, create a `useFeatureFlag` hook:
```typescript
// Example usage in components
const isBillingEnabled = useFeatureFlag('enableBillingModule');
if (!isBillingEnabled) return null;
```

---

## Last Updated
- Date: 2025-02-12
- By: Development Agent
