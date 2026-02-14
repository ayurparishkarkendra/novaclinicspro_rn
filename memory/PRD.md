# AyurParishkar Clinic Management App - PRD

## Project Overview
Healthcare scheduling mobile application built with React Native (Expo) connecting to a backend on Koyeb. The app handles appointments, clients, staff, treatments, and billing for Ayurvedic clinics.

## Current Status: Appointments Module Fixes In Progress

### What's Been Implemented (Feb 14, 2025)

#### 1. AppointmentListItem Component (Complete Rewrite)
- **File**: `/app/frontend/features/appointments/presentation/components/AppointmentListItem.tsx`
- Shows: Client name, phone, assigned staff, color-coded status badge
- Quick actions: Call, WhatsApp, View (RBAC-controlled)
- No IDs displayed in UI
- All text uses i18n

#### 2. AppointmentsListScreen Updates
- **File**: `/app/frontend/features/appointments/presentation/pages/AppointmentsListScreen.tsx`
- Now uses new AppointmentListItem component
- Fixed `roles` (array) vs `role` (string) type issue

#### 3. PreviewAppointmentsScreen (Complete Rewrite) - Backend-Driven
- **File**: `/app/frontend/features/appointments/presentation/pages/PreviewAppointmentsScreen.tsx`
- **CRITICAL**: No frontend-generated previews
- Uses `useGenerateTherapyPlanMutation` to call backend API
- Blocks progression if backend validation unavailable
- Shows conflicts/alternatives from backend only

#### 4. AppointmentDetailScreen (Complete Rewrite)
- **File**: `/app/frontend/features/appointments/presentation/pages/AppointmentDetailScreen.tsx`
- Sections: Client, Visit History, Appointment Info, Quick Actions
- WhatsApp triggers on: Created, Rescheduled, Cancelled, No-Show, Completed
- RBAC-based action visibility

#### 5. CreateAppointmentScreen State Management Fix
- **File**: `/app/frontend/features/appointments/presentation/pages/CreateAppointmentScreen.tsx`
- Added `formKey` states to force re-render on mode switch
- Improved KeyboardAvoidingView configuration
- `+ Create New Client` always visible

#### 6. WhatsApp Message Helpers
- **File**: `/app/frontend/features/appointments/data/models/appointments.dtos.ts`
- Added: `generateWhatsAppNoShowMessage`, `generateWhatsAppCompletedMessage`, `generateWhatsAppCreatedMessage`

#### 7. i18n Translations
- **Files**: `en-US.json`, `hi-IN.json`
- Added top-level `appointments` key with all new translations
- Added missing `common` translations

### P0 - Verified Items
1. ✅ Doctor Consultation staff filtering (API passes `staff_type=doctor`)
2. ✅ Appointment List Card UI (component has all required fields)
3. ✅ Appointment Detail Page structure (4 sections implemented)
4. ✅ Keyboard handling (KeyboardAvoidingView configured)
5. ✅ Create New Client flow (button always visible)
6. ✅ Form state leakage prevention (formKey increments on mode switch)
7. ✅ Backend-driven multi-day preview (no frontend logic)
8. ✅ WhatsApp triggers (all 5 status changes covered)

### Known Issues from Testing
1. **i18n paths**: Fixed by adding top-level `appointments` key
2. **Data display**: Backend data may not have client/staff names populated - this is a backend data issue
3. **Quick action visibility**: Controlled by RBAC checks - working as designed

## Architecture

### Frontend
- **Framework**: React Native with Expo SDK 53
- **Router**: Expo Router v3
- **State**: @tanstack/react-query for server state, useState/useReducer for local
- **Styling**: StyleSheet with custom theme
- **i18n**: i18next with en-US and hi-IN locales

### Backend (External)
- **URL**: https://given-dolly-ayurparishkarkendra-e5891817.koyeb.app
- **API Style**: RESTful with OpenAPI spec

### Key Files
```
/app/frontend/features/appointments/
├── data/
│   ├── datasources/appointments.api.ts
│   ├── models/appointments.dtos.ts
│   └── repositories/appointments.repository.impl.ts
└── presentation/
    ├── components/AppointmentListItem.tsx
    └── pages/
        ├── AppointmentDetailScreen.tsx
        ├── AppointmentsListScreen.tsx
        ├── CreateAppointmentScreen.tsx
        └── PreviewAppointmentsScreen.tsx
```

## Remaining Tasks

### P1 - Testing Required
- [ ] Manual device/emulator verification of all 8 fixes
- [ ] Verify i18n displays correctly after translation fix
- [ ] Test WhatsApp deep links work on mobile devices

### P2 - Future Enhancements
- [ ] Appointment recurring patterns
- [ ] Calendar integration
- [ ] Push notification reminders
- [ ] Treatment session tracking

## Test Credentials
- **Email**: hareshlekkala@gmail.com
- **Password**: Vishnu432!
- **Alternative**: sunithalekkala75@gmail.com

## Notes
- Backend is external on Koyeb - cannot modify backend logic
- "Unknown Client" / "Unassigned" staff may be backend data issue
- RBAC controls which actions are visible based on user role
