# Module 11: Global Settings Feature - Implementation Guide

## Status: ⏳ WAITING FOR BACKEND

**Priority**: P1 (High - Feature flags & configuration)
**Estimated Effort**: 3 days after backend ready
**Dependencies**: Backend API endpoints

---

## Current State

### What's Built (Frontend - Ready)

| Component | Location | Status |
|-----------|----------|--------|
| SystemSettingsScreen | `/presentation/pages/SystemSettingsScreen.tsx` | ✅ Built (disabled) |
| TenantSettingsScreen | `/presentation/pages/TenantSettingsScreen.tsx` | ✅ Built (disabled) |
| SettingsSection | `/presentation/components/SettingsSection.tsx` | ✅ Built |
| SettingsToggle | `/presentation/components/SettingsToggle.tsx` | ✅ Built |
| API Datasource | `/data/datasources/globalSettings.api.ts` | ⏳ Placeholder |
| Repository | `/data/repositories/globalSettings.repository.impl.ts` | ⏳ Placeholder |
| DTOs | `/data/models/globalSettings.dtos.ts` | ✅ Defined |

**Routes**: 
- `/super-admin/system-settings` - Global settings (Super Admin only)
- `/clinic-admin/settings/global` - Tenant overrides (Clinic Admin)

### Current UI Behavior
- Shows "Coming Soon" banner
- Displays all settings categories in preview mode
- All toggle switches disabled
- All input fields disabled
- Save button disabled
- No API calls made

---

## Backend Requirements

### Required API Endpoints

| Method | Endpoint | Purpose | RBAC | Request Body | Response |
|--------|----------|---------|------|--------------|----------|
| GET | `/api/v1/settings/global` | Get global settings | Super Admin | - | `GlobalSettingsDto` |
| PATCH | `/api/v1/settings/global` | Update global settings | Super Admin | `UpdateGlobalSettingsDto` | `GlobalSettingsDto` |
| GET | `/api/v1/tenants/{tenantId}/settings` | Get tenant overrides | Clinic Admin | - | `TenantSettingsDto` |
| PATCH | `/api/v1/tenants/{tenantId}/settings` | Update tenant overrides | Clinic Admin | `UpdateTenantSettingsDto` | `TenantSettingsDto` |

### Expected DTOs

```typescript
// Feature Flags - Control module availability
interface FeatureFlags {
  enableAppointmentReminders: boolean;  // Automated reminders
  enableOnlineBooking: boolean;         // Patient self-booking
  enableSmsNotifications: boolean;      // SMS channel
  enableEmailNotifications: boolean;    // Email channel
  enablePushNotifications: boolean;     // Push notifications
  enableAnalytics: boolean;             // Analytics module
  enableReports: boolean;               // Reports module
  enableInventoryAlerts: boolean;       // Low stock alerts
  enableBillingModule: boolean;         // Billing features
  enableTreatmentSheets: boolean;       // Treatment sheets
  enablePrescriptions: boolean;         // Prescription module
  enableDocuments: boolean;             // Document management
}

// Compliance Settings - Security & privacy
interface ComplianceSettings {
  showConsentBanner: boolean;           // Display consent banner
  dataRetentionDays: number;            // Data retention period
  requirePatientConsent: boolean;       // Require explicit consent
  hipaaMode: boolean;                   // HIPAA compliance features
  gdprMode: boolean;                    // GDPR compliance features
  auditLogRetentionDays: number;        // Audit log retention
  sessionTimeoutMinutes: number;        // Auto-logout timeout
  requireMfa: boolean;                  // Require 2FA
}

// Default Values - System-wide defaults
interface DefaultSettings {
  defaultAppointmentDuration: number;   // Minutes (15, 30, 45, 60)
  defaultTimeZone: string;              // e.g., 'Asia/Kolkata'
  defaultCurrency: string;              // e.g., 'INR'
  defaultDateFormat: string;            // e.g., 'DD/MM/YYYY'
  defaultTimeFormat: '12h' | '24h';     // Time display format
  defaultLocale: string;                // e.g., 'en-IN'
  maxAppointmentsPerDay: number;        // Per-staff limit
  maxConcurrentBookings: number;        // Simultaneous bookings
}

// Global Settings (Super Admin)
interface GlobalSettingsDto {
  id: string;
  featureFlags: FeatureFlags;
  compliance: ComplianceSettings;
  defaults: DefaultSettings;
  updated_at: string;
  updated_by: string;
}

// Tenant Settings (Clinic Admin) - Only overrides
interface TenantSettingsDto {
  tenant_id: string;
  featureOverrides: Partial<FeatureFlags>;     // Only changed flags
  complianceOverrides: Partial<ComplianceSettings>;
  defaultOverrides: Partial<DefaultSettings>;
  inherit_global: boolean;              // Use global settings
  updated_at: string;
  updated_by: string;
}

// Update Requests
interface UpdateGlobalSettingsDto {
  featureFlags?: Partial<FeatureFlags>;
  compliance?: Partial<ComplianceSettings>;
  defaults?: Partial<DefaultSettings>;
}

interface UpdateTenantSettingsDto {
  featureOverrides?: Partial<FeatureFlags>;
  complianceOverrides?: Partial<ComplianceSettings>;
  defaultOverrides?: Partial<DefaultSettings>;
  inherit_global?: boolean;
}
```

### Default Values for New Tenants

| Category | Setting | Default Value |
|----------|---------|---------------|
| Feature Flags | enableAppointmentReminders | `true` |
| Feature Flags | enableOnlineBooking | `true` |
| Feature Flags | enableSmsNotifications | `false` |
| Feature Flags | enableEmailNotifications | `true` |
| Feature Flags | enableAnalytics | `true` |
| Feature Flags | enableReports | `false` |
| Feature Flags | enableInventoryAlerts | `true` |
| Feature Flags | enableBillingModule | `true` |
| Compliance | showConsentBanner | `true` |
| Compliance | dataRetentionDays | `365` |
| Compliance | requirePatientConsent | `true` |
| Compliance | hipaaMode | `false` |
| Compliance | gdprMode | `false` |
| Compliance | sessionTimeoutMinutes | `30` |
| Defaults | defaultAppointmentDuration | `30` |
| Defaults | defaultTimeZone | `Asia/Kolkata` |
| Defaults | defaultCurrency | `INR` |
| Defaults | defaultDateFormat | `DD/MM/YYYY` |
| Defaults | defaultTimeFormat | `12h` |

---

## Implementation Steps (When Backend Ready)

### Step 1: Update API Datasource

**File**: `/features/globalSettings/data/datasources/globalSettings.api.ts`

```typescript
import { apiClient } from '@/core/api/client';
import { 
  GlobalSettingsDto, 
  TenantSettingsDto,
  UpdateGlobalSettingsDto,
  UpdateTenantSettingsDto 
} from '../models/globalSettings.dtos';

export const globalSettingsApi = {
  // Super Admin endpoints
  getGlobalSettings: async (): Promise<GlobalSettingsDto> => {
    const response = await apiClient.get('/api/v1/settings/global');
    return response.data;
  },

  updateGlobalSettings: async (
    data: UpdateGlobalSettingsDto
  ): Promise<GlobalSettingsDto> => {
    const response = await apiClient.patch('/api/v1/settings/global', data);
    return response.data;
  },

  // Clinic Admin endpoints
  getTenantSettings: async (tenantId: string): Promise<TenantSettingsDto> => {
    const response = await apiClient.get(
      `/api/v1/tenants/${tenantId}/settings`
    );
    return response.data;
  },

  updateTenantSettings: async (
    tenantId: string,
    data: UpdateTenantSettingsDto
  ): Promise<TenantSettingsDto> => {
    const response = await apiClient.patch(
      `/api/v1/tenants/${tenantId}/settings`,
      data
    );
    return response.data;
  },
};
```

### Step 2: Create Feature Flag Hook

**Create**: `/core/hooks/useFeatureFlag.ts`

```typescript
import { useGlobalSettings, useTenantSettings } from '@/features/globalSettings/data/repositories/globalSettings.repository.impl';
import { useAuth } from '@/features/auth/presentation/context/AuthContext';
import { FeatureFlags } from '@/features/globalSettings/data/models/globalSettings.dtos';

type FeatureFlagKey = keyof FeatureFlags;

export const useFeatureFlag = (flag: FeatureFlagKey): boolean => {
  const { user } = useAuth();
  const { data: globalSettings } = useGlobalSettings();
  const { data: tenantSettings } = useTenantSettings(user?.tenantId || '');

  // Priority: Tenant override > Global setting > Default (false)
  const tenantValue = tenantSettings?.featureOverrides?.[flag];
  const globalValue = globalSettings?.featureFlags?.[flag];

  if (tenantValue !== undefined) return tenantValue;
  if (globalValue !== undefined) return globalValue;
  return false;
};

// Usage in components:
// const isBillingEnabled = useFeatureFlag('enableBillingModule');
// if (!isBillingEnabled) return null;
```

### Step 3: Create Settings Context

**Create**: `/core/context/SettingsContext.tsx`

```typescript
import React, { createContext, useContext } from 'react';
import { useGlobalSettings, useTenantSettings } from '@/features/globalSettings/data/repositories/globalSettings.repository.impl';
import { useAuth } from '@/features/auth/presentation/context/AuthContext';

interface SettingsContextValue {
  isFeatureEnabled: (flag: string) => boolean;
  getDefaultValue: (key: string) => any;
  isLoading: boolean;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { data: globalSettings, isLoading: globalLoading } = useGlobalSettings();
  const { data: tenantSettings, isLoading: tenantLoading } = useTenantSettings(user?.tenantId || '');

  const isFeatureEnabled = (flag: string) => {
    const tenantValue = tenantSettings?.featureOverrides?.[flag as keyof typeof tenantSettings.featureOverrides];
    const globalValue = globalSettings?.featureFlags?.[flag as keyof typeof globalSettings.featureFlags];
    return tenantValue ?? globalValue ?? false;
  };

  const getDefaultValue = (key: string) => {
    const tenantValue = tenantSettings?.defaultOverrides?.[key as keyof typeof tenantSettings.defaultOverrides];
    const globalValue = globalSettings?.defaults?.[key as keyof typeof globalSettings.defaults];
    return tenantValue ?? globalValue;
  };

  return (
    <SettingsContext.Provider value={{ isFeatureEnabled, getDefaultValue, isLoading: globalLoading || tenantLoading }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) throw new Error('useSettings must be used within SettingsProvider');
  return context;
};
```

### Step 4: Update Presentation Layer

- Remove "Coming Soon" banner
- Enable toggle switches
- Enable input fields
- Connect save button to API
- Show loading states
- Show RBAC-appropriate options

---

## RBAC Matrix

| Role | View Global | Edit Global | View Tenant | Edit Tenant |
|------|-------------|-------------|-------------|-------------|
| Super Admin | ✅ | ✅ | ✅ | ✅ |
| Clinic Admin | ❌ | ❌ | ✅ | ✅ |
| Staff | ❌ | ❌ | ✅ (Read-only) | ❌ |

---

## Testing Checklist

### API Integration Tests
- [ ] Get global settings works (Super Admin)
- [ ] Update global settings works (Super Admin)
- [ ] Get tenant settings works (Clinic Admin)
- [ ] Update tenant settings works (Clinic Admin)
- [ ] RBAC permissions enforced

### UI Tests
- [ ] Feature flags display correctly
- [ ] Toggle switches update state
- [ ] Input fields accept valid values
- [ ] Validation errors display
- [ ] Save button shows loading
- [ ] Success/error toasts display

### Feature Flag Tests
- [ ] Disabled module hides from navigation
- [ ] Disabled module returns 403 if accessed directly
- [ ] Tenant override takes precedence
- [ ] Global default applied when no override

### Edge Cases
- [ ] Empty tenant settings (new tenant)
- [ ] Invalid setting values rejected
- [ ] Concurrent edit handling
- [ ] Offline mode behavior

---

## Files to Create/Update When Ready

```
/app/frontend/
├── core/
│   ├── context/
│   │   └── SettingsContext.tsx              <- CREATE
│   └── hooks/
│       └── useFeatureFlag.ts                <- CREATE
└── features/globalSettings/
    ├── data/
    │   ├── datasources/globalSettings.api.ts <- UNCOMMENT API calls
    │   └── repositories/globalSettings.repository.impl.ts <- ENABLE hooks
    └── presentation/
        ├── pages/
        │   ├── SystemSettingsScreen.tsx      <- REMOVE Coming Soon, ENABLE controls
        │   └── TenantSettingsScreen.tsx      <- REMOVE Coming Soon, ENABLE controls
        └── components/
            ├── SettingsSection.tsx           <- ENABLE toggles
            └── SettingsToggle.tsx            <- ENABLE switch
```

---

## Feature Flag Usage Examples

After implementation, use feature flags throughout the app:

```typescript
// In navigation
const BillingTab = () => {
  const isEnabled = useFeatureFlag('enableBillingModule');
  if (!isEnabled) return null;
  return <Tab.Screen name="Billing" component={BillingScreen} />;
};

// In screens
const AppointmentsScreen = () => {
  const remindersEnabled = useFeatureFlag('enableAppointmentReminders');
  return (
    <View>
      {/* ... */}
      {remindersEnabled && <ReminderSettings />}
    </View>
  );
};

// In components
const SmsButton = () => {
  const smsEnabled = useFeatureFlag('enableSmsNotifications');
  return (
    <Button disabled={!smsEnabled}>
      Send SMS
    </Button>
  );
};
```

---

## Last Updated
- Date: 2025-06-XX (Enhanced)
- By: Development Agent
