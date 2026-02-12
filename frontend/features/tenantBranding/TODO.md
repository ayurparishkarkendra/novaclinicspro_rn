# Module 11: Tenant Branding Feature - TODO

## Status: ⏳ WAITING FOR BACKEND

The Tenant Branding feature UI is built but **disabled** because the required API endpoints do not exist.

### What's Built (Frontend)
- `TenantBrandingSettingsScreen` - Branding configuration for Clinic Admins
- `ColorPaletteSelector` - Pre-defined accessible color palettes
- `TenantBrandingPreview` - Live preview of branding changes
- Route: `/clinic-admin/branding`

### Pre-defined Color Palettes
| ID | Name | Primary | Secondary | Accent |
|----|------|---------|-----------|--------|
| ayurveda | Ayurveda Classic | #2F6F4E | #8B5E3C | #D4A574 |
| ocean | Ocean Calm | #1E6091 | #40A8C4 | #89CFF0 |
| wellness | Wellness Spa | #7C3AED | #A78BFA | #C4B5FD |
| nature | Natural Green | #059669 | #34D399 | #A7F3D0 |
| sunset | Sunset Warmth | #EA580C | #FB923C | #FED7AA |

### Backend Dependencies - REQUIRED

The following endpoints are **expected** but **do not exist** in the OpenAPI spec:

| Expected Endpoint | Expected Tag | Purpose | Status |
|-------------------|--------------|---------|--------|
| `GET /api/v1/tenants/{tenantId}/branding` | Tenant Branding | Get tenant branding | ❌ Not Found |
| `PATCH /api/v1/tenants/{tenantId}/branding` | Tenant Branding | Update branding | ❌ Not Found |

### Why We're Waiting
1. **No "Tenant Branding" tag exists** in the current OpenAPI spec
2. Per PRD rules: "If no suitable operation exists, render controls as disabled/unavailable"
3. The UI allows preview but changes cannot be persisted

### Expected DTO Structure
```typescript
interface TenantBrandingDto {
  tenantId: string;
  name: string;
  colors: {
    primary: string;    // Hex color
    secondary: string;  // Hex color
    accent: string;     // Hex color
  };
  logos: {
    headerLogo?: string;   // URL
    appLogo?: string;      // URL
    splashLogo?: string;   // URL
    favicon?: string;      // URL
  };
  customFontFamily?: string;
  updatedAt: string;
}
```

### Additional Features Needed
1. **Logo Upload**: Backend needs media upload endpoints
2. **Theme Provider**: Apply tenant theme to entire app
3. **Contrast Validation**: Ensure color combinations meet WCAG AA

### When Backend Adds These Endpoints
1. Update `/features/tenantBranding/data/datasources/tenantBranding.api.ts`
2. Update `/features/tenantBranding/data/repositories/tenantBranding.repository.impl.ts`
3. Remove "Coming Soon" banner
4. Enable save functionality
5. Implement logo upload (requires media endpoints)
6. Create `useTenantTheme` hook for app-wide theming

### Files to Update When Ready
```
/app/frontend/features/tenantBranding/
├── data/
│   ├── datasources/tenantBranding.api.ts         <- Uncomment API calls
│   └── repositories/tenantBranding.repository.impl.ts
└── presentation/
    └── pages/TenantBrandingSettingsScreen.tsx    <- Enable save

/app/frontend/core/
├── theme/tenantTheme.ts                          <- Create when ready
└── hooks/useTenantTheme.ts                       <- Create when ready
```

---

## Last Updated
- Date: 2025-02-12
- By: Development Agent
