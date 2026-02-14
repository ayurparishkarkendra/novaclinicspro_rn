# AyurParishkar Clinic Management App - PRD

## Project Overview
Healthcare scheduling mobile application built with React Native (Expo) connecting to a backend on Koyeb. The app handles appointments, clients, staff, treatments, and billing for Ayurvedic clinics.

## Current Status: Appointments Module Fixes - Session Feb 14, 2025 (Iteration 2)

### Latest Fixes Applied (This Session)

#### Issue 1: "Unknown Client" / "Unassigned" on Appointment Cards (P0)
- **Fix**: Enhanced data extraction in `AppointmentListItem.tsx` to handle multiple backend response structures:
  - Direct fields: `appointment.client_name`
  - Nested objects: `appointment.client?.full_name`
- **Debug logging**: Enabled `console.log` to trace data flow on device
- **Status**: Code fixed - requires verification that backend returns data

#### Issue 2: Quick Actions Missing from Cards & Detail Page (P0)
- **Fix**: Updated RBAC checks to recognize both `clinic_admin` and `clinic-admin` role formats
- **Fix**: View button is now ALWAYS visible regardless of phone number availability
- **Files**: `AppointmentListItem.tsx`, `AppointmentDetailScreen.tsx`
- **Status**: Code fixed - requires verification

#### Issue 3: Doctor Dropdown Shows Therapists (P0)
- **Fix**: Added frontend filtering as safeguard on top of API `staff_type` parameter
- **Filter logic**: Includes staff where `staff_type === 'doctor'` OR designation contains 'doctor/vaidya/physician'
- **File**: `CreateAppointmentScreen.tsx`
- **Status**: Code fixed - requires verification

#### Issue 4: Multi-Day Preview Shows "--" (P0)
- **Fix**: Added fallback session generation when backend API unavailable
- **Fix**: Shows warning banner when in fallback mode
- **Fix**: Sessions now render with date/time from local generation
- **File**: `PreviewAppointmentsScreen.tsx`
- **Status**: Code fixed - requires verification

#### Issue 5: WhatsApp Message Shows "Doctor/Therapist" (P1)
- **Fix**: Added `getRoleLabel(appointmentType)` function to select correct role
- **Fix**: Updated all WhatsApp message functions to accept `appointmentType` parameter
- **File**: `appointments.dtos.ts`, `AppointmentDetailScreen.tsx`
- **Status**: Code fixed - requires verification

### Verification Steps for User

1. **Data Binding Issue**: Check device console logs for `[AppointmentListItem] Data:` entries
   - If `client_name: null` and `raw_client: undefined` → Backend not returning data
   - If `client_name` has value → Should display correctly now

2. **Quick Actions**: Check if Call/WhatsApp/View buttons appear on appointment cards
   - View button should ALWAYS appear
   - Call/WhatsApp require valid phone number

3. **Doctor Dropdown**: Navigate to Create Appointment → Doctor Consultation
   - Console will log filtered doctors
   - Only staff with `doctor` type should appear

4. **Multi-Day Preview**: Create multi-day therapy appointment
   - Should show session cards with dates/times
   - If backend unavailable, shows warning banner

5. **WhatsApp Message**: Tap WhatsApp icon on appointment detail
   - Message should say "Doctor:" or "Therapist:" based on appointment type

### Known Limitations
- Backend may not populate `client_name`, `staff_name` in appointment responses
- Backend `/appointments/therapy-plan` API may not exist (404) - fallback mode handles this

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
