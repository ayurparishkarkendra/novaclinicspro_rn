# AyurParishkar Clinic Management App - PRD

## Project Overview
Healthcare scheduling mobile application built with React Native (Expo) connecting to a backend on Koyeb. The app handles appointments, clients, staff, treatments, and billing for Ayurvedic clinics.

## Current Status: Appointments Module - P0 Bug Fixes (Dec 2025)

### User Requirements (Final - Message #153)
User provided 4 specific P0 issues that MUST be addressed:

1. **Quick Actions Placement**
   - Expandable section on appointment cards with: Reschedule, No-Show, Cancel, Complete
   - Quick actions always visible at bottom of detail page (show "No actions available" fallback)

2. **Visit History Details**
   - Display prescription and payment info in visit history
   - Show explicit "No prescription" / "No payment recorded" fallbacks

3. **Preview Screen Time Correction**
   - Display time exactly as selected without timezone conversion
   - Backend returns UTC time that should be displayed as-is

4. **Preview Screen Therapist Data**
   - Display actual therapists from `staff_assignments` array
   - Remove any hardcoded/demo data

---

## Fixes Applied (This Session - Dec 2025)

### FIX #1: Quick Actions Placement - COMPLETED ✅

**AppointmentListItem.tsx:**
- Added `onReschedule` callback prop for navigation to reschedule flow
- Expandable section shows 4 user-required buttons: Reschedule, No-Show, Cancel, Complete
- Buttons conditionally shown based on appointment status:
  - `scheduled`/`confirmed`: Reschedule, No-Show, Cancel
  - `in_progress`: Complete
- Fixed case-insensitive status comparison (API returns UPPERCASE)
- Fixed JSX syntax error (missing `</TouchableOpacity>` closing tag)

**AppointmentsListScreen.tsx:**
- Added `useUpdateAppointmentStatusMutation` and `useCancelAppointmentMutation` hooks
- Implemented `handleStatusUpdate` callback for No-Show/Complete actions
- Implemented `handleCancel` callback with confirmation dialog
- Implemented `handleReschedule` callback (navigates to detail page)
- Passed all callbacks to `AppointmentListItem` component

**AppointmentDetailScreen.tsx:**
- Quick Actions section ALWAYS visible at bottom of detail page
- Shows "No actions available" message when no actions apply (completed/cancelled/no_show)
- Fixed case-insensitive status comparisons throughout

### FIX #2: Visit History Details - COMPLETED ✅

**AppointmentDetailScreen.tsx:**
- Updated `VisitHistoryItem` component to display:
  - Prescription info: "💊 Prescription given" or "No prescription"
  - Payment info: "💰 Paid - ₹{amount}" or "No payment recorded"
- Added styles: `visitHistoryMeta`, `visitHistoryMetaText`, `visitHistoryMetaPresent`, `visitHistoryMetaAbsent`

### FIX #3: Preview Screen Time Correction - VERIFIED ✅

**PreviewAppointmentsScreen.tsx:**
- `safeFormatTime` function correctly extracts time from ISO string without timezone conversion
- Parses `T16:00:00Z` → displays `4:00 pm` (correct)
- No changes needed - implementation was already correct

### FIX #4: Preview Screen Therapist Data - VERIFIED ✅

**PreviewAppointmentsScreen.tsx:**
- `getSessionTherapistNames` helper extracts names from `staff_assignments` array
- Falls back to deprecated `staff_name` field
- Shows "Unassigned" only when no data available
- No changes needed - implementation was already correct

### Supporting Changes

**appointments.dtos.ts:**
- `getStatusLabel()` - Added case-insensitive lookup
- `getStatusColor()` - Added case-insensitive lookup
- Added `client_name` optional property to `TherapyPlanResponse`

**en-US.json:**
- Added translation keys: `noActionsAvailable`, `appointmentCompleted`, `clientNoShow`, `scheduledTime`, `originallyRequested`

---

## API Response Format

### Status Values (Case-Insensitive Handling Added)
API returns UPPERCASE status values that must be compared case-insensitively:
- `SCHEDULED` / `scheduled`
- `CONFIRMED` / `confirmed`
- `IN_PROGRESS` / `in_progress`
- `COMPLETED` / `completed`
- `CANCELLED` / `cancelled`
- `NO_SHOW` / `no_show`

### Multi-Therapist Support
```typescript
interface AppointmentResponse {
  staff_assignments?: Array<{ id: string; name: string }> | null;
  // ... other fields
}
```

---

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
│   └── models/appointments.dtos.ts
│       - getStatusLabel() case-insensitive
│       - getStatusColor() case-insensitive
│       - TherapyPlanResponse.client_name optional
└── presentation/
    ├── components/
    │   └── AppointmentListItem.tsx
    │       - Expandable quick actions section
    │       - onReschedule callback
    │       - Case-insensitive status checks
    └── pages/
        ├── AppointmentsListScreen.tsx
        │   - Status update mutations
        │   - Cancel/Reschedule handlers
        ├── AppointmentDetailScreen.tsx
        │   - Always-visible quick actions
        │   - Visit history with prescription/payment
        └── PreviewAppointmentsScreen.tsx
            - Time formatting (verified correct)
            - Therapist display (verified correct)
```

---

## Test Data-TestIDs

| Component | TestID | Purpose |
|-----------|--------|---------|
| AppointmentListItem | `expanded-action-reschedule` | Reschedule button |
| AppointmentListItem | `expanded-action-noshow` | No-Show button |
| AppointmentListItem | `expanded-action-cancel` | Cancel button |
| AppointmentListItem | `expanded-action-complete` | Complete button |
| AppointmentDetailScreen | `detail-actions-section` | Quick actions section |
| AppointmentDetailScreen | `actions-empty-state` | No actions message |
| AppointmentDetailScreen | `visit-history-item-{id}` | Visit history items |

---

## Credentials
- **Clinic Admin**: hareshlekkala@gmail.com / Vishnu432!
- **Alt Admin**: sunithalekkala75@gmail.com / Vishnu432!

## Backend
- **Host**: Koyeb (https://given-dolly-ayurparishkarkendra-e5891817.koyeb.app)
- **Auth**: Supabase (evkcvntjpkxlcxgwychq.supabase.co)

---

## Next Steps for User Testing

1. **Quick Actions on List Page**
   - Expand appointment card
   - Verify Reschedule, No-Show, Cancel buttons appear (for scheduled/confirmed)
   - Verify Complete button appears (for in_progress)

2. **Quick Actions on Detail Page**
   - Open any appointment detail
   - Scroll to bottom - Quick Actions section should ALWAYS be visible
   - Verify appropriate buttons or "No actions available" message

3. **Visit History**
   - Open appointment detail with visit history
   - Verify prescription and payment info appears (or fallback messages)

4. **Preview Screen Time**
   - Create new therapy plan
   - Verify time displayed matches selected time exactly

5. **Preview Screen Therapist**
   - Create therapy plan with assigned therapist
   - Verify correct therapist name appears (not "Demo" or hardcoded)
