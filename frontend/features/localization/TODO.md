# Module 11: Localization Feature - Implementation Guide

## Status: ⏳ WAITING FOR BACKEND

**Priority**: P2 (Medium - Internationalization)
**Estimated Effort**: 3-4 days after backend ready (includes translation setup)
**Dependencies**: Backend API endpoints, Translation files

---

## Current State

### What's Built (Frontend - Ready)

| Component | Location | Status |
|-----------|----------|--------|
| UserLocaleSettingsScreen | `/presentation/pages/UserLocaleSettingsScreen.tsx` | ✅ Built (disabled) |
| TenantLocaleSettingsScreen | `/presentation/pages/TenantLocaleSettingsScreen.tsx` | ✅ Built (disabled) |
| LocaleSelect | `/presentation/components/LocaleSelect.tsx` | ✅ Built |
| API Datasource | `/data/datasources/localization.api.ts` | ⏳ Placeholder |
| Repository | `/data/repositories/localization.repository.impl.ts` | ⏳ Placeholder |
| DTOs | `/data/models/localization.dtos.ts` | ✅ Defined |

**Routes**: 
- `/localization` - User personal locale settings
- `/tenant-localization` - Clinic-wide locale settings (Admin only)

### Current UI Behavior
- Shows "Coming Soon" banner
- Displays 8 hardcoded Indian locales in picker
- Selection changes visible but not persisted
- No API calls made

---

## Backend Requirements

### Required API Endpoints

| Method | Endpoint | Purpose | Request Body | Response |
|--------|----------|---------|--------------|----------|
| GET | `/api/v1/localization/locales` | List supported locales | - | `SupportedLocale[]` |
| GET | `/api/v1/users/{userId}/locale` | Get user's locale | - | `UserLocaleDto` |
| PATCH | `/api/v1/users/{userId}/locale` | Update user's locale | `UpdateLocaleDto` | `UserLocaleDto` |
| GET | `/api/v1/tenants/{tenantId}/locale` | Get tenant locale | - | `TenantLocaleDto` |
| PATCH | `/api/v1/tenants/{tenantId}/locale` | Update tenant locale | `UpdateLocaleDto` | `TenantLocaleDto` |

### Expected DTOs

```typescript
// Supported Locale
interface SupportedLocale {
  code: string;           // e.g., 'hi-IN'
  language: string;       // e.g., 'Hindi'
  region: string;         // e.g., 'India'
  native_label: string;   // e.g., 'हिन्दी'
  display_label: string;  // e.g., 'Hindi (India)'
  is_rtl: boolean;        // Right-to-left flag
  is_default: boolean;    // Is system default
  date_format: string;    // e.g., 'DD/MM/YYYY'
  time_format: string;    // e.g., '12h' | '24h'
  currency_code: string;  // e.g., 'INR'
  number_format: {        // Regional number formatting
    decimal_separator: string;
    thousands_separator: string;
  };
}

// User Locale Settings
interface UserLocaleDto {
  user_id: string;
  locale_code: string;
  timezone: string;       // e.g., 'Asia/Kolkata'
  date_format?: string;   // Override
  time_format?: string;   // Override
  updated_at: string;
}

// Tenant Locale Settings
interface TenantLocaleDto {
  tenant_id: string;
  default_locale_code: string;
  supported_locales: string[];  // Locales available to users
  timezone: string;
  date_format: string;
  time_format: string;
  currency_code: string;
  updated_at: string;
}

// Update Request
interface UpdateLocaleDto {
  locale_code: string;
  timezone?: string;
  date_format?: string;
  time_format?: string;
}
```

### Supported Locales (Target)

| Code | Language | Native Label | Region |
|------|----------|--------------|--------|
| en-US | English | English | United States |
| en-IN | English | English | India |
| hi-IN | Hindi | हिन्दी | India |
| ta-IN | Tamil | தமிழ் | India |
| te-IN | Telugu | తెలుగు | India |
| kn-IN | Kannada | ಕನ್ನಡ | India |
| ml-IN | Malayalam | മലയാളം | India |
| mr-IN | Marathi | मराठी | India |
| bn-IN | Bengali | বাংলা | India |
| gu-IN | Gujarati | ગુજરાતી | India |

---

## Implementation Steps (When Backend Ready)

### Step 1: Update API Datasource

**File**: `/features/localization/data/datasources/localization.api.ts`

```typescript
import { apiClient } from '@/core/api/client';
import { 
  SupportedLocale, 
  UserLocaleDto, 
  TenantLocaleDto,
  UpdateLocaleDto 
} from '../models/localization.dtos';

export const localizationApi = {
  getSupportedLocales: async (): Promise<SupportedLocale[]> => {
    const response = await apiClient.get('/api/v1/localization/locales');
    return response.data;
  },

  getUserLocale: async (userId: string): Promise<UserLocaleDto> => {
    const response = await apiClient.get(`/api/v1/users/${userId}/locale`);
    return response.data;
  },

  updateUserLocale: async (
    userId: string, 
    data: UpdateLocaleDto
  ): Promise<UserLocaleDto> => {
    const response = await apiClient.patch(
      `/api/v1/users/${userId}/locale`, 
      data
    );
    return response.data;
  },

  getTenantLocale: async (tenantId: string): Promise<TenantLocaleDto> => {
    const response = await apiClient.get(
      `/api/v1/tenants/${tenantId}/locale`
    );
    return response.data;
  },

  updateTenantLocale: async (
    tenantId: string, 
    data: UpdateLocaleDto
  ): Promise<TenantLocaleDto> => {
    const response = await apiClient.patch(
      `/api/v1/tenants/${tenantId}/locale`, 
      data
    );
    return response.data;
  },
};
```

### Step 2: Set Up i18n Framework

**Create**: `/core/localization/i18n.ts`

```typescript
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Import translation files
import enUS from './translations/en-US.json';
import hiIN from './translations/hi-IN.json';
// ... other locales

const resources = {
  'en-US': { translation: enUS },
  'hi-IN': { translation: hiIN },
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: Localization.locale,
    fallbackLng: 'en-US',
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;

// Helper function
export const changeLanguage = async (localeCode: string) => {
  await i18n.changeLanguage(localeCode);
  await AsyncStorage.setItem('userLocale', localeCode);
};
```

### Step 3: Create Translation Files

**Create**: `/core/localization/translations/en-US.json`

```json
{
  "common": {
    "save": "Save",
    "cancel": "Cancel",
    "loading": "Loading...",
    "error": "An error occurred"
  },
  "navigation": {
    "dashboard": "Dashboard",
    "appointments": "Appointments",
    "clients": "Clients",
    "staff": "Staff",
    "settings": "Settings"
  },
  "appointments": {
    "title": "Appointments",
    "newAppointment": "New Appointment",
    "reschedule": "Reschedule",
    "cancel": "Cancel Appointment"
  }
}
```

**Create**: `/core/localization/translations/hi-IN.json`

```json
{
  "common": {
    "save": "सहेजें",
    "cancel": "रद्द करें",
    "loading": "लोड हो रहा है...",
    "error": "एक त्रुटि हुई"
  },
  "navigation": {
    "dashboard": "डैशबोर्ड",
    "appointments": "अपॉइंटमेंट",
    "clients": "ग्राहक",
    "staff": "स्टाफ",
    "settings": "सेटिंग्स"
  }
}
```

### Step 4: Create Locale Hook

**Create**: `/core/hooks/useLocale.ts`

```typescript
import { useTranslation } from 'react-i18next';
import { useUserLocale } from '@/features/localization/data/repositories/localization.repository.impl';
import { useAuth } from '@/features/auth/presentation/context/AuthContext';
import { useEffect } from 'react';
import { changeLanguage } from '../localization/i18n';

export const useLocale = () => {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const { data: userLocale } = useUserLocale(user?.id || '');

  useEffect(() => {
    if (userLocale?.locale_code) {
      changeLanguage(userLocale.locale_code);
    }
  }, [userLocale?.locale_code]);

  return {
    t,
    currentLocale: i18n.language,
    changeLocale: changeLanguage,
  };
};
```

### Step 5: Update Presentation Layer

- Remove "Coming Soon" banner
- Enable locale picker
- Connect save button to API
- Apply locale changes immediately

---

## Testing Checklist

### API Integration Tests
- [ ] Get supported locales returns list
- [ ] Get user locale returns current setting
- [ ] Update user locale persists change
- [ ] Get tenant locale works (admin only)
- [ ] Update tenant locale works (admin only)

### UI Tests
- [ ] Locale picker shows all options
- [ ] Selection updates preview text
- [ ] Save button persists change
- [ ] App language changes after save
- [ ] Date/time formats update
- [ ] Currency formats update

### Translation Tests
- [ ] All screens have translations
- [ ] Fallback to English works
- [ ] Dynamic content translates
- [ ] Pluralization works correctly

### Edge Cases
- [ ] RTL layout (if applicable)
- [ ] Long text truncation
- [ ] Missing translation keys
- [ ] Locale change mid-session

---

## Files to Create/Update When Ready

```
/app/frontend/
├── core/
│   ├── localization/
│   │   ├── i18n.ts                          <- CREATE
│   │   └── translations/
│   │       ├── en-US.json                   <- CREATE
│   │       ├── hi-IN.json                   <- CREATE
│   │       ├── ta-IN.json                   <- CREATE
│   │       └── ... (other locales)
│   └── hooks/
│       └── useLocale.ts                     <- CREATE
└── features/localization/
    ├── data/
    │   ├── datasources/localization.api.ts  <- UNCOMMENT API calls
    │   └── repositories/localization.repository.impl.ts <- ENABLE hooks
    └── presentation/
        └── pages/
            ├── UserLocaleSettingsScreen.tsx <- REMOVE Coming Soon
            └── TenantLocaleSettingsScreen.tsx <- REMOVE Coming Soon
```

---

## Additional Dependencies

```bash
# Install i18n packages
yarn add i18next react-i18next
```

---

## Last Updated
- Date: 2025-06-XX (Enhanced)
- By: Development Agent
