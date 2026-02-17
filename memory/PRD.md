# AyurParishkar Clinic Management App - PRD

## Project Overview
Healthcare scheduling mobile application built with React Native (Expo) connecting to a backend on Koyeb. The app handles appointments, clients, staff, treatments, billing, and clinical documentation for Ayurvedic clinics.

## Latest Status: Forgot Password Feature (Dec 2025) - COMPLETED ✅

### Forgot Password / Reset Password - FULLY IMPLEMENTED ✅

**Test Report:** `/app/test_reports/iteration_14.json`
**Code Review:** 100% Pass

**Routes:**
| Route | File | Description |
|-------|------|-------------|
| `/forgot-password` | `app/forgot-password.tsx` | Send password reset email |
| `/reset-password` | `app/reset-password.tsx` | Set new password from reset link |

**Features:**
1. **Forgot Password Screen**
   - Email input with validation
   - Sends reset email via Supabase `resetPasswordForEmail()`
   - Success state: "Check Your Email" confirmation
   - Error handling for rate limits, network errors

2. **Reset Password Screen**
   - Verifies recovery session from URL hash (web) or deep link (mobile)
   - Password validation: 8+ chars, uppercase, lowercase, number
   - Confirm password match validation
   - Error state: "Link Expired" with recovery options
   - Success state: "Password Updated!" with login redirect

**Auth DTOs Enhanced:**
- `PasswordResetRequest` - Email for reset request
- `PasswordResetConfirmation` - New password and confirmation
- `AuthErrorCode` - Typed error codes (INVALID_CREDENTIALS, TOKEN_EXPIRED, etc.)
- `mapAuthError()` - Map Supabase errors to error codes
- `getAuthErrorMessage()` - User-friendly error messages

**Files Created/Updated:**
- `/app/frontend/app/reset-password.tsx` (NEW)
- `/app/frontend/app/forgot-password.tsx` (testID attributes added)
- `/app/frontend/features/auth/data/models/auth.dtos.ts` (enhanced with error mapping)

---

## Previous Status: Doctor Dashboard Module (Dec 2025) - COMPLETED ✅

### Doctor Dashboard - FULLY IMPLEMENTED ✅

**Test Report:** `/app/test_reports/iteration_13.json`
**Code Review:** 100% Pass for module structure and compilation

**Module Architecture:**
```
/app/frontend/features/doctorDashboard/
├── data/
│   ├── datasources/
│   │   └── doctorKpis.api.ts           # Backend KPI API service
│   ├── models/
│   │   └── doctorKpis.dtos.ts          # DTOs, types, helpers
│   └── repositories/
│       └── doctorKpis.repository.impl.ts # React Query hooks
├── domain/
│   └── entities/
│       └── doctorKpis.entity.ts        # Domain entity & mappers
├── presentation/
│   └── components/
│       ├── KpiPeriodSelector.tsx       # 7d/30d/90d/Custom selector
│       ├── KpiStatCard.tsx             # KPI metric cards
│       ├── TimeMetricsBars.tsx         # Time metrics visualization
│       └── index.ts                    # Component exports
└── index.ts                            # Feature exports
```

**API Endpoint Integrated:**
| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/v1/clinic/{tenant_id}/staff/{staff_id}/kpis` | GET | JWT | Doctor KPI metrics |

**Query Parameters:**
- `period`: `7d` | `30d` | `90d` | `custom`
- `from_date`: ISO date (required if period='custom')
- `to_date`: ISO date (required if period='custom')

**KPI Metrics Displayed:**
1. **Consultations Card**: total_completed, completion_rate, no_show_rate, cancellation_rate
2. **Patients Card**: total_unique, new_patients, returning_patients, retention_rate
3. **Clinical Productivity Card**: casesheets_created, prescriptions_written, treatment_sheets_created, documents_signed
4. **Time Metrics**: avg_consultation_duration, peak_hours (top 3), busiest_days (top 3)

**Features:**
- Period selector with 7d/30d/90d/Custom options
- Custom date range modal with validation (max 365 days)
- Loading states with spinner while fetching
- Error handling for API failures (400/401/403/404/500) with friendly messages
- Empty states for no data periods
- Pull-to-refresh support
- Reuses existing staffDashboards components (AppointmentListItem, EmptyDashboardState, etc.)

**Dashboard Screen:** `/app/frontend/app/doctor.tsx`

---

## Previous Status: Patient Feedback & Rating System (Feb 2026) - COMPLETED ✅

### Patient Feedback Module - FULLY IMPLEMENTED ✅

**Test Report:** `/app/test_reports/iteration_12.json`
**Code Review:** 100% Pass for module structure and compilation

**Module Architecture:**
```
/app/frontend/features/feedback/
├── data/
│   ├── datasources/
│   │   └── feedback.api.ts           # Backend API service
│   ├── models/
│   │   └── feedback.dtos.ts          # DTOs & types
│   └── repositories/
│       └── feedback.repository.impl.ts  # React Query hooks
├── domain/
│   ├── entities/
│   │   └── feedback.entity.ts        # Business logic helpers
│   └── repositories/
│       └── feedback.repository.ts    # Repository interface
├── presentation/
│   ├── components/
│   │   ├── StarRatingInput.tsx       # Interactive star rating
│   │   ├── StarRatingDisplay.tsx     # Read-only star display
│   │   ├── RatingDistributionBars.tsx # Bar chart visualization
│   │   ├── FeedbackKpiCard.tsx       # KPI metric card
│   │   ├── FeedbackListItem.tsx      # Feedback list entry
│   │   ├── PeriodSelector.tsx        # Time period filter
│   │   ├── StaffPerformanceTable.tsx # Staff performance table
│   │   └── index.ts                  # Component exports
│   └── pages/
│       ├── FeedbackFormScreen.tsx    # Public patient form
│       ├── StaffFeedbackListScreen.tsx # Staff feedback list
│       ├── StaffFeedbackSection.tsx  # Dashboard KPI section
│       └── ClinicFeedbackSummarySection.tsx # Admin summary
└── index.ts                          # Feature exports
```

**Routes Added:**
| Route | Component | Description |
|-------|-----------|-------------|
| `/feedback/[token]` | FeedbackFormScreen | Public patient feedback form |
| `/clinic-admin/feedback` | StaffFeedbackListScreen | Admin feedback list view |

**API Endpoints Integrated:**
| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/v1/feedback/{token}` | GET | None | Get feedback form data |
| `/api/v1/feedback/{token}` | POST | None | Submit patient feedback |
| `/api/v1/clinic/{tenant_id}/staff/{staff_id}/kpis` | GET | JWT | Staff KPI metrics |
| `/api/v1/feedback/clinic/{tenant_id}/staff/{staff_id}/feedback` | GET | JWT | Staff feedback list |
| `/api/v1/feedback/clinic/{tenant_id}/summary` | GET | JWT | Clinic feedback summary |

**Features Implemented:**

1. **Patient Feedback Form** (Public)
   - Conditional sections: Doctor, Therapist(s), Clinic
   - Star rating input (1-5) with sub-questions
   - Comment fields with 500 character limit
   - Google Review opt-in checkbox
   - Error handling: Invalid/expired/already used tokens
   - Success state with Google Review redirect (if eligible)

2. **Staff KPI Dashboard Section**
   - Integrated into Doctor and Therapist dashboards
   - Period selector (7d/30d/90d)
   - KPI metrics: Average rating, total responses, response rate
   - Trend indicator (↑ improving / ↓ declining / → stable)
   - Rating distribution bar chart
   - Question score breakdown
   - "View All Feedback" navigation

3. **Clinic Admin Feedback Summary**
   - Integrated into Clinic Admin dashboard
   - Overall rating card with response count
   - Rating distribution visualization
   - Google Reviews conversion stats
   - Staff performance table (doctors/therapists tabs)
   - Ambience scores (cleanliness, comfort, staff, scheduling, value)

4. **Staff Feedback List**
   - Paginated feedback entries
   - Period/date filtering
   - "Needs Attention" badges for low ratings
   - Question scores display
   - Comments with timestamps

**Dashboard Integrations:**
- `app/doctor.tsx` - Added StaffFeedbackSection
- `app/therapist.tsx` (TherapistDashboardScreen) - Added StaffFeedbackSection
- `app/clinic-admin/index.tsx` - Added ClinicFeedbackSummarySection

**Files Created:** 18 new files
**ESLint Status:** 0 errors
**TypeScript Status:** 0 errors in feedback module

---

## Previous Status: Push Notifications Backend Integration (Dec 2025) - COMPLETED ✅

### Push Notification System - FULLY IMPLEMENTED ✅

**Test Report:** `/app/test_reports/iteration_10.json`
**Code Review:** 100% Pass (all 14 features verified)

**Route:** `/notifications/preferences` → `NotificationPreferencesScreen`

**Architecture:**
- **Abstracted Service Layer**: `IPushNotificationService` interface for easy FCM migration
- **Expo Implementation**: `ExpoPushNotificationService` as default provider
- **React Hook**: `usePushNotifications` for state management

**Notification Triggers Implemented:**
| Trigger | Description | Status |
|---------|-------------|--------|
| `appointment_new` | When patient books appointment | ✅ Ready |
| `appointment_updated` | When appointment is rescheduled | ✅ Ready |
| `appointment_cancelled` | When appointment is cancelled | ✅ Ready |
| `appointment_no_show` | When patient doesn't show | ✅ Ready |
| `schedule_summary` | Daily schedule (opt-in) | ✅ Ready |
| `schedule_batch_update` | Multiple schedule changes | ✅ Ready |
| `critical_update` | System alerts, emergencies | ✅ Ready |
| `leave_approved` | Leave request approved | ✅ Ready |
| `leave_rejected` | Leave request rejected | ✅ Ready |

**Per-Therapist Preferences:**
- New Appointments (ON by default)
- Updates & Reschedules (ON by default)
- Cancellations & No-Shows (ON by default)
- Daily Schedule Summary (OFF by default)
- Critical Updates (ON, recommended)
- Leave Updates (ON by default)
- Quiet Hours with time customization

**Android Notification Channels:**
- `default` - General notifications
- `appointments` - High priority appointment alerts
- `critical` - Maximum priority system alerts (bypasses DND)
- `schedule` - Low priority daily summaries

**Note:** Push notifications require physical device/simulator for full functionality. Web preview shows UI only.

---

## Previous Status: Therapist Dashboard Module (Feb 2026) - COMPLETED ✅

### Therapist Dashboard Implementation - FULLY IMPLEMENTED ✅

**Test Report:** `/app/test_reports/iteration_9.json`
**Code Review:** 100% Pass (all 12 features verified)

**Route:** `/therapist` → `TherapistDashboardScreen`

**API Validation Summary:**
| Feature | API Status | Implementation |
|---------|------------|----------------|
| Worklist/Schedule | ✅ SUPPORTED | Full implementation via therapist dashboard API |
| KPIs | ✅ SUPPORTED | Derived from session data |
| Leave Requests | ✅ SUPPORTED | Full CRUD via staff leave API |
| Documents | ❌ NOT SUPPORTED | Disabled stub with message |
| Bank Details | ❌ NOT SUPPORTED | Disabled stub with message |
| Salary/Payslips | ❌ NOT SUPPORTED | Disabled stub with message |
| Learning | ❌ NOT SUPPORTED | Coming Soon stub |

**Implemented Sections:**

1. **Performance KPI Row** (`TherapistKpiRow.tsx`)
   - Displays metrics: Total Sessions, Completed, No Shows, Cancelled
   - Period selector: Today (default)
   - Metrics derived from worklist data

2. **Worklist/Schedule Section** (`WorklistSection.tsx`)
   - Period tabs: Today, Next 7 Days, Past 7 Days
   - Session cards with time, patient name, treatment type, status
   - Empty state with appropriate messaging
   - View All navigation to treatment sessions

3. **HR & Self-Service Section** (`HrSection.tsx`)
   - My Documents: Shows "Not available in this environment" (disabled)
   - Bank Details: Shows "Not available in this environment" (disabled)
   - Salary & Payslips: Shows "Not available in this environment" (disabled)
   - Leave Requests: **ENABLED** - Full functionality

4. **Leave Management Section** (`LeaveSection.tsx`)
   - Leave history list with status badges
   - Apply for leave modal with:
     - Leave type selection (Sick, Casual, Vacation, Personal, Other)
     - Start/End date inputs
     - Reason field (optional)
   - Cancel leave functionality for pending/approved requests

5. **Learning & Growth Section** (`LearningSection.tsx`)
   - Shows "Coming Soon" badge
   - Placeholder cards for future features: Training Modules, Certifications, Skill Progress

**Module Architecture:**
```
/app/frontend/features/therapistDashboard/
├── data/
│   ├── datasources/therapistDashboard.api.ts    # API calls
│   ├── models/therapistDashboard.dtos.ts        # DTOs & helpers
│   └── repositories/therapistDashboard.repository.impl.ts  # React Query hooks
├── domain/
│   ├── entities/therapistDashboard.entity.ts    # Business logic helpers
│   └── repositories/therapistDashboard.repository.ts  # Interface
├── presentation/
│   ├── components/
│   │   ├── TherapistKpiRow.tsx
│   │   ├── WorklistSection.tsx
│   │   ├── WorklistItemCard.tsx
│   │   ├── HrSection.tsx
│   │   ├── LeaveSection.tsx
│   │   └── LearningSection.tsx
│   └── pages/TherapistDashboardScreen.tsx
└── index.ts                                     # Feature exports
```

**APIs Used:**
- `GET /api/v1/clinic/{tenant_id}/staff/me/dashboard/therapist` - Dashboard/worklist
- `GET /api/v1/clinic/{tenant_id}/staff/{staff_id}/leave` - List leave requests
- `POST /api/v1/clinic/{tenant_id}/staff/{staff_id}/leave` - Create leave request
- `PATCH /api/v1/clinic/{tenant_id}/leave/{leave_id}/cancel` - Cancel leave

---

## Previous Status: Bug Fixes (Dec 2025) - COMPLETED

### Bug Fixes Session (Dec 2025) - 3 CRITICAL BUGS FIXED ✅

**Bugs Fixed This Session:**

| Bug # | Issue | Status | Fix Summary |
|-------|-------|--------|-------------|
| Bug 1 | Reschedule API 422 Error (missing appointment_start) | ✅ FIXED | API now sends both `new_start` and `appointment_start` fields |
| Bug 2 | Confirmation modal showing i18n keys (appointments.confirmNoShow) | ✅ FIXED | Added missing translation keys to en-US.json |
| Bug 3 | Complete button missing | ✅ FIXED | Added tick icon with color change on touch + confirmation dialog |

### Implementation Details

**Bug 1 - Reschedule API 422 Fix:**
- File: `features/appointments/data/datasources/appointments.api.ts`
- Backend expects `appointment_start` field but frontend was sending `new_start`
- Fix: API transform ensures both fields are included in payload
- Also fixed overloaded mutation hook to support both usage patterns

**Bug 2 - i18n Translation Keys:**
- File: `core/localization/translations/en-US.json`
- Added missing keys:
  - `appointments.confirmNoShow`: "Are you sure the patient did not show up?"
  - `appointments.confirmComplete`: "Mark this appointment as completed?"
  - `appointments.confirmReschedule`: "Open reschedule options for this appointment?"

**Bug 3 - Complete Tick Icon:**
- File: `features/appointments/presentation/components/AppointmentListItem.tsx`
- Added `CompleteTickIcon` component with:
  - Press state for visual feedback (color changes from success.main to success.dark)
  - Positioned next to navigation arrow for confirmed/in_progress appointments
  - Confirmation dialog with proper i18n text
  - data-testid="action-complete-tick" for testing

---

## Previous Bug Fixes (Feb 2026) - ALL FRONTEND BUGS FIXED ✅

**Bugs Fixed: 8 of 9 (1 backend-only bug excluded)**

| Bug # | Issue | Status | Fix Summary |
|-------|-------|--------|-------------|
| Bug 1 | Reschedule navigates instead of modal | ✅ FIXED | Added reschedule modal with DateTimePicker directly on list page |
| Bug 2 | No-Show sends lowercase `'no_show'` | ✅ FIXED | Changed to uppercase `'NO_SHOW'` |
| Bug 3 | Complete button missing + icons/tooltips | ✅ FIXED | Icon-based buttons with tooltips, spread horizontally, all with confirmations |
| Bug 4 | Previous Visits cards toggle on tap | ✅ FIXED | Removed TouchableOpacity wrapper and chevron |
| Bug 5 | Backend auto-complete after 24hrs | ⏭️ SKIPPED | Backend task - handled separately |
| Bug 6 | Custom time picker hidden when no alternatives | ✅ FIXED | Moved picker outside conditional |
| Bug 7 | Selected custom time not reflected in UI | ✅ FIXED | Added visual feedback for selected time |
| Bug 8 | Slow UI updates after API actions | ✅ FIXED | Optimistic updates in mutations |
| Bug 9 | Treatment sheet 422 error | ✅ FIXED | Added `tenant_id` as query parameter |

### Key Implementation Details

**Bug 1 - Reschedule Modal:**
- Added full reschedule modal in `AppointmentsListScreen.tsx`
- Uses `@react-native-community/datetimepicker` for native date/time selection
- Validates future date/time before API call
- Updated `useRescheduleAppointmentMutation` to accept dynamic `appointmentId` and `tenantId`

**Bug 3 - Quick Actions UI:**
- Replaced text buttons with icon-based buttons (`QuickActionIconButton`)
- Icons: `calendar-outline` (Reschedule), `person-remove-outline` (No-Show), `close-circle-outline` (Cancel), `checkmark-circle-outline` (Complete)
- Buttons spread horizontally using `flex: 1` and `justifyContent: 'space-between'`
- All actions wrapped with `Alert.alert()` confirmation dialogs

---

## Previous Status: 3 Navigation/UI Bug Fixes Complete (Feb 2026)

### Clinical Documents Module - FULLY IMPLEMENTED ✅

**Test Report:** `/app/test_reports/iteration_6.json`
**Code Review:** 100% Pass (all 10 features verified)

**Implemented Features:**
1. **Header/Footer Branding** - CasesheetDetailScreen renders clinic branding from `header_snapshot` and `footer_snapshot`
2. **Create Treatment Sheet from Casesheet** - Modal with duration picker (7, 14, 21, 30, 45, 60 days) + custom input
3. **Casesheet Extensions UI** - Add/remove/edit extensions with predefined templates:
   - Vital Signs (BP, pulse, temp, respiratory rate, SpO2, weight)
   - Prakriti Assessment (Vata, Pitta, Kapha scoring)
   - Nadi Pariksha (pulse diagnosis)
   - Custom Notes

**Known Issue (Pre-existing):**
- Expo Router web navigation causes session loss on page reload
- Root cause: ProtectedRoute checks auth before bootstrap completes
- Does NOT affect mobile app or functionality, only web-based UI testing

---

## CLINICAL DOCUMENTS IMPLEMENTATION

### Module Architecture (Clean Architecture)

Each clinical document module follows the prescribed structure:
```
features/{module}/
├── data/
│   ├── datasources/{module}.api.ts      (API calls)
│   ├── models/{module}.dtos.ts          (DTOs)
│   └── repositories/{module}.repository.impl.ts (React Query hooks)
├── domain/
│   ├── entities/{entity}.entity.ts      (Domain entities)
│   ├── repositories/{module}.repository.ts (Interfaces)
│   └── usecases/                        (Business logic)
└── presentation/
    ├── components/                       (UI components)
    └── pages/                            (Screens)
```

### 1. Casesheets Module ✅ COMPLETE

**Domain Layer:**
- `casesheet.entity.ts` - Entity with status helpers (`canEditCasesheet`, `getAllowedCasesheetTransitions`)
- `casesheets.repository.ts` - Repository interface
- Use cases: list, get, create, update, transition-status, print, archive

**Presentation Layer:**
- `CasesheetsListScreen.tsx` - List with filters
- `CasesheetDetailScreen.tsx` - Read-only detail view
- `CasesheetEditScreen.tsx` - Edit form (DRAFT only or SIGNED for DOCTOR)
- `CreateCasesheetScreen.tsx` - New casesheet form
- `CasesheetForm.tsx` - Dynamic SOAP form component
- `CasesheetStatusBadge.tsx` - Status indicator

**Routes:**
- `/clinic-admin/clients/[clientId]/casesheets` - List
- `/clinic-admin/clients/[clientId]/casesheets/new` - Create
- `/clinic-admin/clients/[clientId]/casesheets/[casesheetId]` - Detail
- `/clinic-admin/clients/[clientId]/casesheets/[casesheetId]/edit` - Edit

### 2. Prescriptions Module ✅ COMPLETE

**Domain Layer:**
- `prescription.entity.ts` - Entity with `canEditPrescription`, `canSharePrescription`, `canRepeatPrescription`
- `prescriptions.repository.ts` - Repository interface
- Use cases: list, get, create, update, delete, share, repeat

**Presentation Layer:**
- `PrescriptionsListScreen.tsx` - List with filters
- `PrescriptionDetailScreen.tsx` - Detail view with medications list
- `PrescriptionEditScreen.tsx` - Edit form
- `CreatePrescriptionScreen.tsx` - New prescription form
- `PrescriptionForm.tsx` - Medication items form
- `PrescriptionShareModal.tsx` - Share via SMS/WhatsApp/Email
- `PrescriptionStatusBadge.tsx` - Status indicator

**Routes:**
- `/clinic-admin/clients/[clientId]/prescriptions` - List
- `/clinic-admin/clients/[clientId]/prescriptions/new` - Create
- `/clinic-admin/clients/[clientId]/prescriptions/[prescriptionId]` - Detail
- `/clinic-admin/clients/[clientId]/prescriptions/[prescriptionId]/edit` - Edit

### 3. Treatment Sheets Module ✅ COMPLETE

**Domain Layer:**
- `treatmentSheet.entity.ts` - Entity with row status tracking
- `treatmentSheets.repository.ts` - Repository interface
- Use cases: get, create, create-from-casesheet, transition-status, update-row, complete-row, print, archive, sync

**Presentation Layer:**
- `TreatmentSheetDetailScreen.tsx` - Detail with row management
- `TreatmentSheetStatusBadge.tsx` - Status indicator
- `TreatmentSheetListItem.tsx` - List item component
- `TreatmentSheetRowItem.tsx` - Row display/edit
- `TreatmentSheetProgress.tsx` - Progress tracker
- `EmptyTreatmentSheetsState.tsx` - Empty state

**Routes:**
- `/clinic-admin/clients/[clientId]/treatment-sheets` - Info page (access via casesheets)
- `/clinic-admin/clients/[clientId]/treatment-sheets/[treatmentSheetId]` - Detail

---

## STATUS LIFECYCLE RULES

### Document Status Transitions
```
DRAFT → FINAL → SIGNED
```

### Editability Rules
- **DRAFT**: Full editing allowed
- **FINAL**: Read-only, status transitions only
- **SIGNED**: Read-only (DOCTOR can edit with restrictions)

### Archive Rules
- Only DRAFT and FINAL documents can be archived
- SIGNED documents are immutable

---

## PREVIOUS IMPLEMENTATION (Feb 2025)

### Appointment Flow Fixes - COMPLETE
- Card layout fixes with navigation
- Quick actions (Reschedule, No-Show, Cancel, Complete)
- Visit recording
- Conflict resolution with alternatives
- Apply-to-all functionality
- Custom time selection

---

## CREDENTIALS
- **Clinic Admin**: hareshlekkala@gmail.com / Vishnu432!
- **Alt Admin**: sunithalekkala75@gmail.com / Vishnu432!

## BACKEND
- **Host**: Koyeb (https://given-dolly-ayurparishkarkendra-e5891817.koyeb.app)

---

## API Endpoints Used

### Clinical Documents
- `POST /clinic/{tenant_id}/casesheets/{client_id}` - Create casesheet
- `GET /clinic/{tenant_id}/casesheets/{client_id}` - List casesheets
- `GET /clinic/{tenant_id}/casesheets/{casesheet_id}` - Get casesheet
- `PATCH /clinic/{tenant_id}/casesheets/{casesheet_id}` - Update casesheet
- `POST /clinic/{tenant_id}/casesheets/{casesheet_id}/status` - Transition status
- `GET /clinic/{tenant_id}/casesheets/{casesheet_id}/print` - Print casesheet
- `DELETE /clinic/{tenant_id}/casesheets/{casesheet_id}` - Archive

- `POST /clinic/{tenant_id}/prescriptions` - Create prescription
- `GET /clinic/{tenant_id}/prescriptions` - List prescriptions
- `GET /clinic/{tenant_id}/prescriptions/{prescription_id}` - Get prescription
- `PATCH /clinic/{tenant_id}/prescriptions/{prescription_id}` - Update
- `DELETE /clinic/{tenant_id}/prescriptions/{prescription_id}` - Delete
- `POST /clinic/{tenant_id}/prescriptions/{prescription_id}/share` - Share

- `POST /clinic/{tenant_id}/treatment-sheets` - Create treatment sheet
- `GET /clinic/{tenant_id}/treatment-sheets/{treatment_sheet_id}` - Get
- `POST /clinic/{tenant_id}/treatment-sheets/{treatment_sheet_id}/status` - Transition
- `PATCH /clinic/{tenant_id}/treatment-sheets/rows/{row_id}` - Update row
- `POST /clinic/{tenant_id}/treatment-sheets/rows/{row_id}/complete` - Complete row

### Appointments (existing)
- `POST /api/v1/appointments/therapy-plan` - Generate plan with alternatives
- `POST /api/v1/appointments` - Create single appointment
- `PATCH /api/v1/appointments/{id}` - Update status
