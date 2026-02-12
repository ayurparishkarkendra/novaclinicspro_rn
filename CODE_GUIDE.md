# NovaClinicsPro - Code Guide

## 🗂️ Where to Find Everything

### **All Code is Located In:**
```
/app/frontend/
```

## 📱 Dashboard Pages (app/ folder)

### **Home Page - Dashboard Selector**
**File:** `/app/frontend/app/index.tsx`
**Route:** `/` (root)
**What it does:** Landing page with 4 dashboard cards, platform branding, and feature list

### **Super Admin Dashboard**
**File:** `/app/frontend/app/super-admin.tsx`
**Route:** `/super-admin`
**Features:**
- System overview (47 clinics, 45 subscriptions, $127.5K revenue)
- Quick actions for clinic management
- Recent clinic onboarding list
- Navigation to other dashboards

### **Clinic Admin Dashboard**
**File:** `/app/frontend/app/clinic-admin.tsx`
**Route:** `/clinic-admin`
**Features:**
- Today's overview (42 appointments, 28 staff, $3,240 revenue)
- Staff status with availability
- Inventory alerts
- Quick actions for daily operations

### **Doctor Dashboard**
**File:** `/app/frontend/app/doctor.tsx`
**Route:** `/doctor`
**Features:**
- Today's appointments (12 appointments, 7 pending prescriptions)
- Appointment list with patient details
- Pending prescriptions queue
- Quick actions for patient care

### **Therapist Dashboard**
**File:** `/app/frontend/app/therapist.tsx`
**Route:** `/therapist`
**Features:**
- Session overview (8 sessions, 24 active plans)
- Today's session schedule
- Multi-day therapy plans with progress bars
- Quick actions for therapy management

## 🎨 Reusable Components (core/components/)

### **StatCard Component**
**File:** `/app/frontend/core/components/StatCard.tsx`
**Usage:**
```typescript
<StatCard
  title="Total Appointments"
  value="42"
  icon="calendar"
  color={colors.primary.main}
  trend={{ value: '+8 vs yesterday', isPositive: true }}
/>
```

### **QuickActionButton Component**
**File:** `/app/frontend/core/components/QuickActionButton.tsx`
**Usage:**
```typescript
<QuickActionButton
  icon="person-add"
  label="Add Staff"
  onPress={() => console.log('Add Staff')}
  color={colors.primary.main}
/>
```

### **DashboardHeader Component**
**File:** `/app/frontend/core/components/DashboardHeader.tsx`
**Usage:**
```typescript
<DashboardHeader
  title="Doctor Dashboard"
  subtitle="Welcome back, Doctor"
  userName="Dr. James Anderson"
  onNotificationPress={() => {}}
  onProfilePress={() => {}}
/>
```

## 🎨 Design System (core/theme/)

### **Colors**
**File:** `/app/frontend/core/theme/colors.ts`
**Usage:**
```typescript
import { colors } from '../core/theme/colors';

// Primary colors
colors.primary.main    // #2563eb (blue)
colors.success.main    // #10b981 (green)
colors.warning.main    // #f59e0b (orange)
colors.error.main      // #ef4444 (red)

// Text colors
colors.text.primary    // #111827 (dark)
colors.text.secondary  // #6b7280 (grey)

// Background colors
colors.background.default  // #ffffff (white)
colors.background.paper    // #f9fafb (light grey)
```

### **Spacing**
**File:** `/app/frontend/core/theme/spacing.ts`
**Usage:**
```typescript
import { spacing } from '../core/theme/spacing';

spacing.xs    // 4px
spacing.sm    // 8px
spacing.md    // 16px
spacing.lg    // 24px
spacing.xl    // 32px
spacing.xxl   // 48px
```

### **Typography**
**File:** `/app/frontend/core/theme/typography.ts`
**Usage:**
```typescript
import { typography } from '../core/theme/typography';

<Text style={typography.h1}>Heading 1</Text>
<Text style={typography.h4}>Heading 4</Text>
<Text style={typography.body1}>Body text</Text>
<Text style={typography.caption}>Small text</Text>
```

## 📦 Package.json - Dependencies

**File:** `/app/frontend/package.json`

**Key Dependencies:**
- `expo`: ^54.0.33
- `react-native`: 0.81.5
- `expo-router`: ~6.0.22
- `@tanstack/react-query`: ^5.90.20
- `zustand`: ^5.0.11
- `axios`: ^1.13.5

## ⚙️ Configuration Files

### **Expo Configuration**
**File:** `/app/frontend/app.json`
**Contains:** App name, icons, splash screen, plugins

### **TypeScript Configuration**
**File:** `/app/frontend/tsconfig.json`
**Contains:** TypeScript compiler options

### **Environment Variables**
**File:** `/app/frontend/.env`
**Contains:**
- `EXPO_PACKAGER_HOSTNAME` - Preview URL
- `EXPO_PUBLIC_BACKEND_URL` - Backend API URL

## 🔍 Quick Code Search

To find specific code, use these commands:

```bash
# Find all dashboard files
ls /app/frontend/app/*.tsx

# View any file
cat /app/frontend/app/doctor.tsx

# Search for a specific term
grep -r "StatCard" /app/frontend/

# View file structure
tree /app/frontend -I node_modules
```

## 🖥️ Accessing Your Code

### **Option 1: From the Container**
All files are in: `/app/frontend/`

### **Option 2: View in Browser**
You can view the running app at:
https://clinic-setup.preview.emergentagent.com

### **Option 3: Download/Export**
You can download the entire project using git or file export tools.

## 📝 Example: How to Read a Dashboard File

Let's read the Doctor Dashboard:

```bash
# View the entire file
cat /app/frontend/app/doctor.tsx

# View first 100 lines
head -n 100 /app/frontend/app/doctor.tsx

# View specific lines (e.g., lines 50-100)
sed -n '50,100p' /app/frontend/app/doctor.tsx
```

## 🎯 Key Code Patterns

### **1. File-based Routing (Expo Router)**
```typescript
// File: app/doctor.tsx
// Automatically available at: /doctor

export default function DoctorDashboard() {
  return <View>...</View>;
}
```

### **2. Navigation**
```typescript
import { useRouter } from 'expo-router';

const router = useRouter();
router.push('/clinic-admin');  // Navigate to Clinic Admin
```

### **3. Styling**
```typescript
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.paper,
  },
  text: {
    ...typography.h4,
    color: colors.text.primary,
  },
});
```

### **4. Component Structure**
```typescript
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export const MyComponent: React.FC<Props> = ({ prop1, prop2 }) => {
  return (
    <View style={styles.container}>
      <Text>{prop1}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { /* styles */ },
});
```

## 🚀 Next Steps - Where to Add Code

### **Adding a New Dashboard**
1. Create: `/app/frontend/app/receptionist.tsx`
2. It will auto-route to: `/receptionist`

### **Adding a New Component**
1. Create: `/app/frontend/core/components/MyComponent.tsx`
2. Import anywhere: `import { MyComponent } from '../core/components/MyComponent'`

### **Adding a Feature (Clean Architecture)**
1. Create folder: `/app/frontend/features/clients/`
2. Add layers: `data/`, `domain/`, `presentation/`
3. Add page: `/app/frontend/app/clients.tsx`

## 📖 Documentation Files

- **This Guide**: `/app/CODE_GUIDE.md`
- **Project Structure**: `/app/PROJECT_STRUCTURE.md`
- **Dashboard Summary**: `/app/DASHBOARD_SUMMARY.md`
