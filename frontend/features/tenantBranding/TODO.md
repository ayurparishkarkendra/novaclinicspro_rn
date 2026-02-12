# Module 11: Tenant Branding Feature - Implementation Guide

## Status: ⏳ WAITING FOR BACKEND

**Priority**: P2 (Medium - White-label feature)
**Estimated Effort**: 2-3 days after backend ready
**Dependencies**: Backend API endpoints, Media upload endpoints (for logos)

---

## Current State

### What's Built (Frontend - Ready)

| Component | Location | Status |
|-----------|----------|--------|
| TenantBrandingSettingsScreen | `/presentation/pages/TenantBrandingSettingsScreen.tsx` | ✅ Built (disabled) |
| ColorPaletteSelector | `/presentation/components/ColorPaletteSelector.tsx` | ✅ Built |
| TenantBrandingPreview | `/presentation/components/TenantBrandingPreview.tsx` | ✅ Built |
| API Datasource | `/data/datasources/tenantBranding.api.ts` | ⏳ Placeholder |
| Repository | `/data/repositories/tenantBranding.repository.impl.ts` | ⏳ Placeholder |
| DTOs | `/data/models/tenantBranding.dtos.ts` | ✅ Defined |

**Route**: `/clinic-admin/branding`

### Current UI Behavior
- Shows "Coming Soon" banner
- Displays 5 pre-defined color palettes
- Live preview of selected palette
- Logo upload sections visible but disabled
- Save button disabled
- Changes not persisted

---

## Backend Requirements

### Required API Endpoints

| Method | Endpoint | Purpose | Request Body | Response |
|--------|----------|---------|--------------|----------|
| GET | `/api/v1/tenants/{tenantId}/branding` | Get branding | - | `TenantBrandingDto` |
| PATCH | `/api/v1/tenants/{tenantId}/branding` | Update branding | `UpdateBrandingDto` | `TenantBrandingDto` |
| POST | `/api/v1/tenants/{tenantId}/branding/logo` | Upload logo | FormData | `{ url: string }` |
| DELETE | `/api/v1/tenants/{tenantId}/branding/logo/{type}` | Remove logo | - | `{ success: boolean }` |

### Expected DTOs

```typescript
// Logo Types
type LogoType = 'header' | 'app' | 'splash' | 'favicon';

// Color Scheme
interface BrandingColors {
  primary: string;      // Main brand color (hex)
  secondary: string;    // Secondary color (hex)
  accent: string;       // Accent/highlight color (hex)
  background?: string;  // Optional background override
  text?: string;        // Optional text color override
}

// Full Branding Response
interface TenantBrandingDto {
  tenant_id: string;
  name: string;           // Display name for branding
  colors: BrandingColors;
  logos: {
    header?: string;      // Header logo URL
    app?: string;         // App icon URL
    splash?: string;      // Splash screen logo URL
    favicon?: string;     // Favicon URL
  };
  custom_font_family?: string;  // Optional custom font
  is_custom: boolean;           // Using custom or default
  updated_at: string;
  updated_by: string;
}

// Update Request
interface UpdateBrandingDto {
  name?: string;
  colors?: Partial<BrandingColors>;
  custom_font_family?: string;
}

// Logo Upload Response
interface LogoUploadResponse {
  url: string;
  type: LogoType;
  file_size: number;
  dimensions: {
    width: number;
    height: number;
  };
}
```

### Pre-defined Color Palettes

These palettes are hardcoded in frontend for quick selection:

| ID | Name | Primary | Secondary | Accent | Use Case |
|----|------|---------|-----------|--------|----------|
| `ayurveda` | Ayurveda Classic | #2F6F4E | #8B5E3C | #D4A574 | Traditional clinics |
| `ocean` | Ocean Calm | #1E6091 | #40A8C4 | #89CFF0 | Modern healthcare |
| `wellness` | Wellness Spa | #7C3AED | #A78BFA | #C4B5FD | Spa/wellness centers |
| `nature` | Natural Green | #059669 | #34D399 | #A7F3D0 | Naturopathy clinics |
| `sunset` | Sunset Warmth | #EA580C | #FB923C | #FED7AA | Warm/welcoming feel |

---

## Implementation Steps (When Backend Ready)

### Step 1: Update API Datasource

**File**: `/features/tenantBranding/data/datasources/tenantBranding.api.ts`

```typescript
import { apiClient } from '@/core/api/client';
import { 
  TenantBrandingDto, 
  UpdateBrandingDto,
  LogoUploadResponse,
  LogoType 
} from '../models/tenantBranding.dtos';

export const tenantBrandingApi = {
  getBranding: async (tenantId: string): Promise<TenantBrandingDto> => {
    const response = await apiClient.get(
      `/api/v1/tenants/${tenantId}/branding`
    );
    return response.data;
  },

  updateBranding: async (
    tenantId: string, 
    data: UpdateBrandingDto
  ): Promise<TenantBrandingDto> => {
    const response = await apiClient.patch(
      `/api/v1/tenants/${tenantId}/branding`,
      data
    );
    return response.data;
  },

  uploadLogo: async (
    tenantId: string,
    type: LogoType,
    file: FormData
  ): Promise<LogoUploadResponse> => {
    const response = await apiClient.post(
      `/api/v1/tenants/${tenantId}/branding/logo`,
      file,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
        params: { type },
      }
    );
    return response.data;
  },

  removeLogo: async (
    tenantId: string, 
    type: LogoType
  ): Promise<void> => {
    await apiClient.delete(
      `/api/v1/tenants/${tenantId}/branding/logo/${type}`
    );
  },
};
```

### Step 2: Enable Repository Hooks

**File**: `/features/tenantBranding/data/repositories/tenantBranding.repository.impl.ts`

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tenantBrandingApi } from '../datasources/tenantBranding.api';

export const useTenantBranding = (tenantId: string) => {
  return useQuery({
    queryKey: ['tenant-branding', tenantId],
    queryFn: () => tenantBrandingApi.getBranding(tenantId),
    enabled: !!tenantId,
  });
};

export const useUpdateBranding = (tenantId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateBrandingDto) =>
      tenantBrandingApi.updateBranding(tenantId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenant-branding', tenantId] });
    },
  });
};

export const useUploadLogo = (tenantId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ type, file }: { type: LogoType; file: FormData }) =>
      tenantBrandingApi.uploadLogo(tenantId, type, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenant-branding', tenantId] });
    },
  });
};
```

### Step 3: Create Theme Provider

**Create**: `/core/theme/TenantThemeProvider.tsx`

```typescript
import React, { createContext, useContext, useMemo } from 'react';
import { useTenantBranding } from '@/features/tenantBranding/data/repositories/tenantBranding.repository.impl';
import { useAuth } from '@/features/auth/presentation/context/AuthContext';

interface TenantTheme {
  colors: {
    primary: string;
    secondary: string;
    accent: string;
  };
  logos: {
    header?: string;
    app?: string;
  };
}

const TenantThemeContext = createContext<TenantTheme | null>(null);

export const TenantThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { data: branding } = useTenantBranding(user?.tenantId || '');

  const theme = useMemo(() => ({
    colors: branding?.colors || {
      primary: '#2F6F4E',
      secondary: '#8B5E3C',
      accent: '#D4A574',
    },
    logos: branding?.logos || {},
  }), [branding]);

  return (
    <TenantThemeContext.Provider value={theme}>
      {children}
    </TenantThemeContext.Provider>
  );
};

export const useTenantTheme = () => {
  const context = useContext(TenantThemeContext);
  if (!context) throw new Error('useTenantTheme must be used within TenantThemeProvider');
  return context;
};
```

### Step 4: Update Presentation Layer

- Remove "Coming Soon" banner
- Enable palette selection
- Enable logo upload
- Connect save button
- Show live preview with selected theme

---

## Logo Specifications

| Logo Type | Recommended Size | Format | Max File Size |
|-----------|-----------------|--------|---------------|
| Header | 200x50 px | PNG/SVG | 500KB |
| App Icon | 512x512 px | PNG | 1MB |
| Splash | 600x600 px | PNG | 1MB |
| Favicon | 32x32 px | PNG/ICO | 100KB |

---

## Testing Checklist

### API Integration Tests
- [ ] Get branding returns current settings
- [ ] Update colors persists changes
- [ ] Upload logo works for all types
- [ ] Remove logo works
- [ ] Invalid color format rejected

### UI Tests
- [ ] Palette cards display correctly
- [ ] Selecting palette updates preview
- [ ] Color picker allows custom colors
- [ ] Logo upload shows progress
- [ ] Logo preview shows uploaded image
- [ ] Save button shows loading state
- [ ] Success/error toasts display

### Theme Application Tests
- [ ] Primary color applies to buttons
- [ ] Secondary color applies to headers
- [ ] Logo appears in header
- [ ] Theme persists across screens
- [ ] Theme loads on app start

### Accessibility Tests
- [ ] Color contrast meets WCAG AA
- [ ] Text remains readable with all palettes
- [ ] Focus states visible

---

## Files to Create/Update When Ready

```
/app/frontend/
├── core/
│   ├── theme/
│   │   ├── TenantThemeProvider.tsx          <- CREATE
│   │   └── useThemedStyles.ts               <- CREATE
│   └── hooks/
│       └── useTenantTheme.ts                <- CREATE
└── features/tenantBranding/
    ├── data/
    │   ├── datasources/tenantBranding.api.ts <- UNCOMMENT API calls
    │   └── repositories/tenantBranding.repository.impl.ts <- ENABLE hooks
    └── presentation/
        ├── pages/
        │   └── TenantBrandingSettingsScreen.tsx <- REMOVE Coming Soon, ENABLE features
        └── components/
            ├── ColorPaletteSelector.tsx         <- ENABLE selection
            ├── LogoUploader.tsx                 <- CREATE
            └── TenantBrandingPreview.tsx        <- CONNECT to live theme
```

---

## Last Updated
- Date: 2025-06-XX (Enhanced)
- By: Development Agent
