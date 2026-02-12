# Module 11: Localization Feature - TODO

## Status: ⏳ WAITING FOR BACKEND

The Localization feature UI is built but **disabled** because the required API endpoints do not exist.

### What's Built (Frontend)
- `UserLocaleSettingsScreen` - Personal language preference
- `TenantLocaleSettingsScreen` - Clinic-wide default language
- `LocaleSelect` - Locale picker component with 8 Indian locales
- Routes: `/localization`, `/tenant-localization`

### Supported Locales (Hardcoded for Preview)
- English (US) - en-US
- English (India) - en-IN
- Hindi - hi-IN
- Tamil - ta-IN
- Telugu - te-IN
- Kannada - kn-IN
- Malayalam - ml-IN
- Marathi - mr-IN

### Backend Dependencies - REQUIRED

The following endpoints are **expected** but **do not exist** in the OpenAPI spec:

| Expected Endpoint | Expected Tag | Purpose | Status |
|-------------------|--------------|---------|--------|
| `GET /api/v1/localization/locales` | Localization | List supported locales | ❌ Not Found |
| `GET /api/v1/users/{userId}/locale` | Localization | Get user's locale | ❌ Not Found |
| `PATCH /api/v1/users/{userId}/locale` | Localization | Update user's locale | ❌ Not Found |
| `GET /api/v1/tenants/{tenantId}/locale` | Localization | Get tenant default locale | ❌ Not Found |
| `PATCH /api/v1/tenants/{tenantId}/locale` | Localization | Update tenant locale | ❌ Not Found |

### Why We're Waiting
1. **No "Localization" tag exists** in the current OpenAPI spec
2. Per PRD rules: "If no suitable operation exists, render controls as disabled/unavailable"
3. The UI shows locale options but changes cannot be persisted

### Additional Requirements When Backend Ready
1. **Translation Resources**: Need translation JSON files for each supported locale
2. **i18n Integration**: Implement `t('key')` function across all screens
3. **RTL Support**: Handle right-to-left layouts for applicable languages
4. **Date/Number Formatting**: Apply regional formatting based on locale

### Expected DTO Structure
```typescript
interface SupportedLocale {
  code: string;       // e.g., 'hi-IN'
  language: string;   // e.g., 'Hindi'
  region: string;     // e.g., 'India'
  label: string;      // e.g., 'हिन्दी (भारत)'
  isRtl: boolean;
  isDefault: boolean;
}
```

### When Backend Adds These Endpoints
1. Update `/features/localization/data/datasources/localization.api.ts`
2. Update `/features/localization/data/repositories/localization.repository.impl.ts`
3. Remove "Coming Soon" banner
4. Implement actual locale persistence
5. Add translation resource loading

### Files to Update When Ready
```
/app/frontend/features/localization/
├── data/
│   ├── datasources/localization.api.ts           <- Uncomment API calls
│   └── repositories/localization.repository.impl.ts
└── presentation/
    ├── pages/UserLocaleSettingsScreen.tsx        <- Enable save
    └── pages/TenantLocaleSettingsScreen.tsx      <- Enable save

/app/frontend/core/localization/
├── i18n.ts                                       <- Create when ready
└── translations/
    ├── en-US.json
    ├── hi-IN.json
    └── ... (other locales)
```

---

## Last Updated
- Date: 2025-02-12
- By: Development Agent
