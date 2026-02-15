# NovaClinicsPro - Project Structure

## 📁 Complete Directory Structure

```
/app/frontend/
│
├── 📱 app/                          # Expo Router - File-based routing
│   ├── index.tsx                    # Home page with dashboard selector
│   ├── super-admin.tsx              # Super Admin Dashboard
│   ├── clinic-admin.tsx             # Clinic Admin Dashboard  
│   ├── doctor.tsx                   # Doctor Dashboard
│   └── therapist.tsx                # Therapist Dashboard
│
├── 🎨 core/                         # Core utilities & reusables
│   │
│   ├── components/                  # Shared UI components
│   │   ├── DashboardHeader.tsx      # Header with profile & notifications
│   │   ├── StatCard.tsx             # Metric display cards
│   │   └── QuickActionButton.tsx    # Action button component
│   │
│   └── theme/                       # Design system
│       ├── colors.ts                # Color palette (primary, secondary, etc.)
│       ├── spacing.ts               # 8pt grid spacing system
│       └── typography.ts            # Typography scale (h1-h6, body, etc.)
│
├── 🖼️ assets/                       # Static assets
│   ├── fonts/                       # Custom fonts
│   └── images/                      # Images & icons
│
├── 📄 Configuration Files
│   ├── app.json                     # Expo configuration
│   ├── package.json                 # Dependencies
│   ├── tsconfig.json                # TypeScript config
│   ├── metro.config.js              # Metro bundler config
│   └── .env                         # Environment variables
│
└── 📚 Documentation
    ├── README.md
    └── PROJECT_STRUCTURE.md (this file)
```

## 🏗️ Architecture Layers (Ready for Expansion)

When building features, follow this Clean Architecture pattern:

```
features/
  └── {feature-name}/
      ├── data/                      # Data layer
      │   ├── datasources/           # API calls, local storage
      │   ├── models/                # DTOs, serialization
      │   └── repositories/          # Repository implementations
      │
      ├── domain/                    # Business logic layer
      │   ├── entities/              # Business entities
      │   ├── repositories/          # Repository interfaces
      │   └── usecases/              # Business use cases
      │
      └── presentation/              # UI layer
          ├── pages/                 # Screen components
          ├── components/            # Feature-specific components
          ├── providers/             # State management (Zustand/React Query)
          └── hooks/                 # Custom React hooks
```

## 📦 Installed Dependencies

### Core
- `expo` - Expo framework
- `react-native` - React Native core
- `expo-router` - File-based routing

### State Management
- `@tanstack/react-query` - Server state management
- `zustand` - Client state management
- `axios` - HTTP client

### UI & UX
- `@expo/vector-icons` - Icon library
- `react-native-safe-area-context` - Safe area handling
- `react-native-gesture-handler` - Gesture support
- `react-native-reanimated` - Animations

## 🎯 File Locations

### To view dashboard code:
- **Home page**: `/app/frontend/app/index.tsx`
- **Super Admin**: `/app/frontend/app/super-admin.tsx`
- **Clinic Admin**: `/app/frontend/app/clinic-admin.tsx`
- **Doctor**: `/app/frontend/app/doctor.tsx`
- **Therapist**: `/app/frontend/app/therapist.tsx`

### To view reusable components:
- **Stat Card**: `/app/frontend/core/components/StatCard.tsx`
- **Quick Action Button**: `/app/frontend/core/components/QuickActionButton.tsx`
- **Dashboard Header**: `/app/frontend/core/components/DashboardHeader.tsx`

### To view design system:
- **Colors**: `/app/frontend/core/theme/colors.ts`
- **Spacing**: `/app/frontend/core/theme/spacing.ts`
- **Typography**: `/app/frontend/core/theme/typography.ts`

## 🚀 Running the Project

```bash
# Navigate to frontend
cd /app/frontend

# Install dependencies (already done)
yarn install

# Start development server
yarn start

# Or with specific platform
yarn ios      # iOS simulator
yarn android  # Android emulator
yarn web      # Web browser
```

## 📝 Adding New Features

### Example: Adding a "Clients" feature

1. Create feature folder structure:
```bash
mkdir -p features/clients/{data,domain,presentation}
```

2. Add domain entities:
```typescript
// features/clients/domain/entities/client.entity.ts
export interface Client {
  id: string;
  name: string;
  email: string;
  // ... more fields
}
```

3. Add use cases:
```typescript
// features/clients/domain/usecases/get-clients.usecase.ts
export const getClients = async () => {
  // Business logic here
}
```

4. Add presentation page:
```typescript
// app/clients.tsx
import { View, Text } from 'react-native';

export default function ClientsPage() {
  return (
    <View>
      <Text>Clients List</Text>
    </View>
  );
}
```

This file will automatically be accessible at `/clients` route!

## 🔗 Backend Connection

Backend API is running at: **http://localhost:8001**

To connect frontend to backend:
```typescript
import axios from 'axios';

const api = axios.create({
  baseURL: process.env.EXPO_PUBLIC_BACKEND_URL + '/api',
});

// Example API call
const fetchData = async () => {
  const response = await api.get('/endpoint');
  return response.data;
};
```

## 📱 Access URLs

- **Web Preview**: https://preview-appointments.preview.emergentagent.com
- **Backend API**: Port 8001 (internal)
- **MongoDB**: Port 27017 (internal)
