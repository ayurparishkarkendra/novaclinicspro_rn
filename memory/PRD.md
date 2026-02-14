# AyurParishkar Clinic Management App - PRD

## Project Overview
Healthcare scheduling mobile application built with React Native (Expo) connecting to a backend on Koyeb. The app handles appointments, clients, staff, treatments, and billing for Ayurvedic clinics.

## Current Status: Appointments Module Fixes - Session Feb 14, 2025 (Iteration 3)

### Latest Fixes Applied (This Session - Iteration 3)

#### Critical Fix: Infinite Loop Bug (P0 BLOCKER) - FIXED
- **Problem**: `PreviewAppointmentsScreen.tsx` had a `useEffect` with unstable dependencies (`staffIds.join(',')`, `generateFallbackSessions` callback) causing infinite API calls
- **Fix**: 
  1. Added `hasFetched` state flag to prevent multiple API calls
  2. Memoized `staffIds` using `useMemo`
  3. Removed unstable callback from dependency array
  4. API call runs exactly once on mount
- **Status**: ✅ FIXED

#### Critical Fix: Forbidden Client-Side Fallback Logic (P0) - REMOVED
- **Problem**: Previous agent implemented client-side session generation which violated user requirement for backend-only data
- **Fix**: 
  1. Removed all `generateFallbackSessions` logic
  2. If backend API fails, show proper error state with Retry/Go Back buttons
  3. NO fake data is ever generated or displayed
  4. Preview screen is strictly backend-driven as required
- **Status**: ✅ FIXED

#### Data Binding Fix: AppointmentListItem & AppointmentDetailScreen (P0)
- **Problem**: Code was looking for nested objects (`appointment.client.full_name`) when API returns flat fields
- **Fix**: Updated both files to use the correct flat field structure per API spec:
  - `appointment.client_name` (not `appointment.client?.full_name`)
  - `appointment.staff_name` (not `appointment.staff?.full_name`)
  - `appointment.treatment_name` (not `appointment.treatment?.name`)
  - `appointment.room_name` (not `appointment.room?.name`)
- **Files**: `AppointmentListItem.tsx`, `AppointmentDetailScreen.tsx`
- **Status**: ✅ FIXED - Aligned with API spec

#### DTO Updates: TherapyPlanResponse Structure (P0)
- **Problem**: TypeScript types didn't match actual API response structure
- **Fix**: Updated `appointments.dtos.ts` to match API spec:
  - `TherapyPlanSession`: Uses `appointment_start`/`appointment_end` instead of `start`/`end`
  - `TherapyPlanResponse`: Now includes `metadata` object with `total_sessions`, `conflicted_sessions`, `available_sessions`
  - Conflict object structure matches API: `alternative_slots` inside `conflict` object
- **Status**: ✅ FIXED

### Previously Fixed (Still Working)
- **Doctor Dropdown Filtering**: Only shows doctors, not therapists ✅
- **RBAC for Quick Actions**: Supports both `clinic_admin` and `clinic-admin` role formats ✅
- **WhatsApp Role Labels**: Uses correct "Doctor" or "Therapist" based on appointment type ✅

## API Integration Guide Reference
Per FastAPI developer documentation:
- **Appointments List**: GET `/api/v1/clinic/{tenant_id}/appointments` returns `client_name`, `staff_name`, `room_name`, `treatment_name` directly
- **Therapy Plan**: POST `/api/v1/appointments/therapy-plan` returns structured response with `has_conflicts`, `sessions[]`, and `metadata`

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

## Testing Required

### Verification Steps
1. **Infinite Loop Test**: Navigate to multi-day appointment preview
   - Should load once, NOT loop infinitely
   - Check network tab - only ONE call to `/api/v1/appointments/therapy-plan`

2. **Data Binding Test**: View appointments list
   - Client names should show (not "Unknown Client") if API returns data
   - Console logs will show `[AppointmentListItem] Data:` for debugging

3. **Quick Actions Test**: View appointment cards
   - View button (chevron) should ALWAYS appear
   - Call/WhatsApp buttons appear when phone number exists

4. **Error Handling Test**: If therapy plan API fails
   - Should show error screen with "Retry" and "Go Back" buttons
   - Should NOT show fake/fallback session data

## Remaining Issues (If Any)
- If "Unknown Client" still shows, verify backend API response includes `client_name` field
- Quick Actions visibility depends on RBAC role from auth context
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
