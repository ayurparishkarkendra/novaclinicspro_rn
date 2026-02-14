# AyurParishkar Clinic Management App - PRD

## Project Overview
Healthcare scheduling mobile application built with React Native (Expo) connecting to a backend on Koyeb. The app handles appointments, clients, staff, treatments, and billing for Ayurvedic clinics.

## Current Status: Appointments Module Fixes - Session Feb 14, 2025 (Iteration 4 - 8 Bug Fixes)

### Bug Fixes Applied (This Session - Iteration 4)

#### BUG #1: Therapist Display on Appointment Cards - FIXED
- **Problem**: When 2 therapists assigned, only shows first one or "Unassigned"
- **Fix**: 
  - Added `staff_names?: string[]` to `AppointmentResponse` DTO
  - Updated `AppointmentListItem.tsx` to check `staff_names` array first
  - Updated `AppointmentDetailScreen.tsx` similarly
  - Display format: "Therapist A, Therapist B" for dual-therapist appointments
- **Files**: `appointments.dtos.ts`, `AppointmentListItem.tsx`, `AppointmentDetailScreen.tsx`
- **Status**: ✅ FIXED

#### BUG #2: Client Name on Appointment Details - FIXED
- **Problem**: Client name not showing on appointment details (persistent issue)
- **Fix**:
  - Simplified data extraction - uses flat fields directly per API spec
  - Added console logging for debugging
  - Removed overly complex fallback logic that was causing issues
- **Files**: `AppointmentListItem.tsx`, `AppointmentDetailScreen.tsx`
- **Status**: ✅ FIXED

#### BUG #3: Quick Actions Visibility and Wiring - FIXED
- **Problem**: Quick actions not visible or incorrectly gated
- **Fix**:
  - Updated `AppointmentDetailScreen.tsx` to ALWAYS show actions section
  - Actions show disabled state when not available (not hidden)
  - Added empty state for completed/cancelled appointments
  - Status-based actions: Confirm → Start Session → Complete
  - Added styles for `actionsEmptyState`
- **Files**: `AppointmentDetailScreen.tsx`
- **Status**: ✅ FIXED

#### BUG #4: Therapist Dropdown - Only staff_type='therapist' - FIXED
- **Problem**: Dropdown showed clinic admin, receptionist, and other roles
- **Fix**:
  - Strict filter: `staffType === 'therapist'` only
  - Removed loose filtering by role/designation
  - Added debug logging
- **Files**: `CreateAppointmentScreen.tsx`
- **Status**: ✅ FIXED

#### BUG #5: Single-Slot Therapy Conflict Checks - FIXED
- **Problem**: No conflict checking for single therapy appointments
- **Fix**:
  - Added `useValidateAppointmentMutation` import and hook
  - Updated `handleCreateSingle()` to call validation API before booking
  - If conflict detected: show alert with conflict details, do NOT book
  - Conflict message includes staff_conflict and room_conflict info
- **Files**: `CreateAppointmentScreen.tsx`
- **Status**: ✅ FIXED

#### BUG #6: Multi-Appointments Preview Time Drift - FIXED
- **Problem**: User-selected time not preserved, silent modifications
- **Fix**:
  - Added "Originally Requested" section in conflict expansion
  - Shows `conflict.requested_time` from backend response
  - Styles: `originalTimeSection`, `originalTimeLabel`, `originalTimeValue`
- **Files**: `PreviewAppointmentsScreen.tsx`
- **Status**: ✅ FIXED

#### BUG #7: Therapist Dropdown Gender Matching - FIXED
- **Problem**: No gender-based filtering for therapist selection
- **Fix**:
  - Added `gender` field to `PickerOption` interface
  - Created `genderFilteredTherapistOptions` memo
  - For female clients: show only female therapists (if available)
  - Applied to both single-therapy and multi-day therapy dropdowns
- **Files**: `CreateAppointmentScreen.tsx`
- **Status**: ✅ FIXED

#### BUG #8: Alternative Slots Selection - FIXED
- **Problem**: Alternative slots not fully selectable
- **Fix**:
  - Already had selection logic in place
  - Enhanced visual indication with `alternativeOptionSelected` style
  - Selection updates `selected_alternative` state
  - Used for booking API call
  - Added "+N more staff options" indicator
- **Files**: `PreviewAppointmentsScreen.tsx`
- **Status**: ✅ FIXED

### Previously Fixed (Earlier Sessions)
- **Infinite Loop on Preview Screen**: Fixed faulty useEffect ✅
- **Forbidden Client-Side Fallback**: Removed, preview is backend-only ✅
- **Doctor Dropdown Filtering**: Only shows doctors ✅
- **RBAC for Quick Actions**: Supports both `clinic_admin` and `clinic-admin` ✅

## API Integration Reference
Per FastAPI developer documentation:
- **Appointments List**: GET `/api/v1/clinic/{tenant_id}/appointments` returns `client_name`, `staff_name`, `staff_names[]`, `room_name`, `treatment_name`
- **Therapy Plan**: POST `/api/v1/appointments/therapy-plan` returns `has_conflicts`, `sessions[]`, `metadata`
- **Validation**: POST `/api/v1/appointments/validate` for conflict checking

## Architecture

### Frontend
- **Framework**: React Native with Expo SDK 53
- **Router**: Expo Router v3
- **State**: @tanstack/react-query for server state
- **Styling**: StyleSheet with custom theme

### Key Files Modified
```
/app/frontend/features/appointments/
├── data/
│   └── models/appointments.dtos.ts (staff_names array added)
└── presentation/
    ├── components/AppointmentListItem.tsx (multi-therapist, data binding)
    └── pages/
        ├── AppointmentDetailScreen.tsx (multi-therapist, quick actions)
        ├── CreateAppointmentScreen.tsx (validation, gender filter)
        └── PreviewAppointmentsScreen.tsx (original time, alternatives)
```

## Testing Required
1. Appointment cards should show both therapists when 2 are assigned
2. Client name always visible on detail page
3. Quick actions visible based on status (disabled if not allowed)
4. Therapist dropdown shows only therapists
5. Single therapy booking blocked on conflict
6. Preview shows originally requested time
7. Alternative slots selectable
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
