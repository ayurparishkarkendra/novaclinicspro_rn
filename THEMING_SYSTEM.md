# Clinic-Type Theming System Documentation

## Overview

NovaClinicsPro now supports **multi-clinic theming** with a healthcare-grade design system that adapts to different clinic types while maintaining consistency and accessibility.

## Architecture

### Core Principles

1. **Semantic Tokens**: Components never use hard-coded hex values
2. **Clinic-Agnostic Base**: Core tokens work across all clinic types
3. **Theme Overlays**: Each clinic type maps its brand colors to semantic roles
4. **Accessibility-First**: WCAG 2.1 AA compliance across all themes
5. **Single Source of Truth**: `useClinicTheme()` hook provides complete theme

## File Structure

```
/app/frontend/core/theme/
├── semanticColors.ts      # Semantic token interface
├── clinicThemes.ts        # All clinic type theme definitions
├── useClinicTheme.tsx     # Theme provider & hook
├── spacing.ts             # 8pt spacing scale (existing)
├── typography.ts          # Typography primitives (existing)
└── colors.ts              # Legacy (keep for compatibility)

/app/frontend/core/components/ui/
├── BgGradient.tsx         # Background gradient component
└── index.ts               # UI components export
```

## Semantic Color Tokens

### Primary Colors
- `colors.primary.default` - Main brand color
- `colors.primary.light` - Lighter variant
- `colors.primary.dark` - Darker variant
- `colors.primary.onPrimary` - Text/icons on primary background
- `colors.primary.pressed` - Pressed state
- `colors.primary.disabled` - Disabled state
- `colors.primary.soft` - Subtle variant for backgrounds

### Secondary Colors
- `colors.secondary.default` - Accent color
- `colors.secondary.light` - Lighter variant
- `colors.secondary.dark` - Darker variant
- `colors.secondary.onSecondary` - Text/icons on secondary
- `colors.secondary.pressed` - Pressed state
- `colors.secondary.disabled` - Disabled state

### Background Colors
- `colors.background.default` - Main app background
- `colors.background.elevated` - Cards, elevated surfaces
- `colors.background.muted` - Subtle backgrounds
- `colors.background.inverse` - Dark sections

### Surface Colors
- `colors.surface.default` - Card/panel backgrounds
- `colors.surface.elevated` - Elevated cards
- `colors.surface.muted` - Subtle surfaces
- `colors.surface.overlay` - Modal overlays

### Border Colors
- `colors.border.default` - Standard borders
- `colors.border.subtle` - Very light borders
- `colors.border.strong` - Pronounced borders
- `colors.border.focus` - Focus indicators

### Text Colors
- `colors.text.primary` - Main text
- `colors.text.secondary` - Secondary text
- `colors.text.tertiary` - Tertiary/hint text
- `colors.text.disabled` - Disabled text
- `colors.text.inverse` - Text on dark backgrounds
- `colors.text.onPrimary` - Text on primary color
- `colors.text.link` - Link text

### Feedback Colors
- `colors.feedback.success` / `successLight`
- `colors.feedback.warning` / `warningLight`
- `colors.feedback.error` / `errorLight`
- `colors.feedback.info` / `infoLight`

### Interactive States
- `colors.interactive.hover`
- `colors.interactive.pressed`
- `colors.interactive.focus`
- `colors.interactive.disabled`

## Clinic Type Themes

### 1. Ayurveda Theme (Default)

**Color Philosophy**: Calm, clinical, trustworthy with subtle herbal influence

**Palette**:
- Primary: Muted herbal green `#2F6F4E`
- Secondary: Warm earthy accent `#C28A4B`
- Background: Off-white/cream `#F8F4EC`

**Use Cases**:
- Ayurveda clinics
- Holistic wellness centers
- Natural medicine practices

### 2. General Medicine Theme

**Color Philosophy**: Professional, clean, medical blue palette

**Palette**:
- Primary: Medical blue `#2563EB`
- Secondary: Purple accent `#7C3AED`
- Background: Light gray `#F9FAFB`

**Use Cases**:
- General practice clinics
- Multi-specialty hospitals
- Primary care centers

### 3. Dental Theme

**Color Philosophy**: Clean, bright, turquoise/teal palette

**Palette**:
- Primary: Turquoise `#0891B2`
- Secondary: Cyan `#06B6D4`
- Background: Very light cyan `#F0FDFF`

**Use Cases**:
- Dental clinics
- Orthodontics practices
- Oral surgery centers

### 4. Physiotherapy Theme

**Color Philosophy**: Energetic, warm, orange/coral palette

**Palette**:
- Primary: Vibrant orange `#EA580C`
- Secondary: Red accent `#DC2626`
- Background: Very light orange `#FFF8F1`

**Use Cases**:
- Physiotherapy clinics
- Sports medicine centers
- Rehabilitation facilities

## Usage Guide

### 1. Wrap Your App with ThemeProvider

```typescript
import { ThemeProvider } from '@/core/theme/useClinicTheme';

function App() {
  return (
    <ThemeProvider clinicType="AYURVEDA">
      {/* Your app content */}
    </ThemeProvider>
  );
}
```

### 2. Use the Theme Hook in Components

```typescript
import { useClinicTheme } from '@/core/theme/useClinicTheme';

function MyComponent() {
  const theme = useClinicTheme();

  return (
    <View style={{ backgroundColor: theme.colors.background.default }}>
      <Text style={{ color: theme.colors.text.primary }}>
        Hello World
      </Text>
    </View>
  );
}
```

### 3. Create Styled Components

```typescript
const styles = (theme: ClinicTheme) => StyleSheet.create({
  container: {
    backgroundColor: theme.colors.surface.default,
    borderColor: theme.colors.border.default,
    borderWidth: 1,
    borderRadius: 8,
    padding: theme.spacing.md,
  },
  title: {
    ...theme.typography.h4,
    color: theme.colors.text.primary,
  },
  button: {
    backgroundColor: theme.colors.primary.default,
    padding: theme.spacing.md,
    borderRadius: 8,
  },
  buttonText: {
    ...theme.typography.button,
    color: theme.colors.primary.onPrimary,
  },
});
```

### 4. Use BgGradient Component

```typescript
import { BgGradient } from '@/core/components/ui/BgGradient';

function Screen() {
  return (
    <View style={{ flex: 1 }}>
      <BgGradient />
      {/* Content sits on top of gradient */}
    </View>
  );
}
```

## Best Practices

### DO ✅

1. **Always use semantic tokens**
   ```typescript
   // Good
   color: theme.colors.primary.default
   
   // Bad
   color: '#2F6F4E'
   ```

2. **Use the theme hook**
   ```typescript
   const theme = useClinicTheme();
   ```

3. **Reference spacing from theme**
   ```typescript
   padding: theme.spacing.md
   ```

4. **Use typography tokens**
   ```typescript
   style={theme.typography.h4}
   ```

5. **Ensure WCAG AA contrast**
   - All color combinations tested for accessibility
   - Use `onPrimary`, `onSecondary` for text on colored backgrounds

### DON'T ❌

1. **Hard-code hex colors**
   ```typescript
   // Bad
   backgroundColor: '#F8F4EC'
   ```

2. **Hard-code font sizes**
   ```typescript
   // Bad
   fontSize: 18
   ```

3. **Bypass the theme system**
   ```typescript
   // Bad
   if (clinicType === 'AYURVEDA') { ... }
   ```

4. **Use non-semantic names**
   ```typescript
   // Bad
   color: theme.colors.green500
   ```

## Adding a New Clinic Type

### Step 1: Define the Theme

Edit `/app/frontend/core/theme/clinicThemes.ts`:

```typescript
export const dermatologyTheme: SemanticColors = {
  primary: {
    default: '#YourPrimaryColor',
    // ... complete all required fields
  },
  // ... complete all sections
};
```

### Step 2: Add to ClinicType Enum

```typescript
export type ClinicType = 
  | 'AYURVEDA' 
  | 'GENERAL_MEDICINE' 
  | 'DENTAL' 
  | 'PHYSIOTHERAPY'
  | 'DERMATOLOGY'; // Add new type
```

### Step 3: Update getClinicTheme Function

```typescript
export const getClinicTheme = (clinicType: ClinicType): SemanticColors => {
  switch (clinicType) {
    // ... existing cases
    case 'DERMATOLOGY':
      return dermatologyTheme;
    default:
      return ayurvedaTheme;
  }
};
```

### Step 4: Verify Accessibility

- Run contrast checker on all text/background combinations
- Ensure WCAG 2.1 AA compliance (4.5:1 for normal text, 3:1 for large text)
- Test with screen readers
- Verify touch targets meet minimum sizes (44pt iOS / 48pt Android)

## Component Migration Guide

### Migrating Existing Components

**Before**:
```typescript
import { colors } from '../core/theme/colors';

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background.default, // Old system
  },
});
```

**After**:
```typescript
import { useClinicTheme } from '../core/theme/useClinicTheme';

function MyComponent() {
  const theme = useClinicTheme();
  
  const styles = StyleSheet.create({
    container: {
      backgroundColor: theme.colors.background.default, // New system
    },
  });
}
```

## Testing

### Visual Testing

1. Open `/theme-demo` page
2. Toggle between clinic types
3. Verify all colors render correctly
4. Check gradient backgrounds
5. Test component examples

### Accessibility Testing

1. Enable screen reader
2. Navigate through components
3. Verify all interactive elements are accessible
4. Check contrast ratios
5. Test touch target sizes

## Regulatory Compliance

### Accessibility (WCAG 2.1 AA)
- ✅ Contrast ratios meet AA standards
- ✅ Touch targets minimum 44pt (iOS) / 48pt (Android)
- ✅ Focus indicators visible on all interactive elements
- ✅ Screen reader compatible

### HIPAA Compliance
- ✅ No PHI in styling or theme configuration
- ✅ Theme selection doesn't leak patient data
- ✅ Colors and styles don't encode sensitive information

### Data Privacy (GDPR, DPDPA)
- ✅ Theme preference stored with user consent
- ✅ No tracking of color interaction
- ✅ Theme data can be exported/deleted per user rights

## Demo Page

Access the interactive theme demo at:
```
/theme-demo
```

Features:
- Live theme preview
- Color palette visualization
- Component examples
- Typography samples
- Gradient toggle
- Accessibility information

## Support

For questions or issues:
1. Check this documentation
2. Review the demo page examples
3. Inspect existing themed components
4. Consult the theme files directly

---

**Version**: 1.0.0  
**Last Updated**: February 2025  
**Status**: Production Ready ✅
