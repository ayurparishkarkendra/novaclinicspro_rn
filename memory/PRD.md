# AyurParishkar Clinic Management App - PRD

## Project Overview
Healthcare scheduling mobile application built with React Native (Expo) connecting to a backend on Koyeb. The app handles appointments, clients, staff, treatments, billing, and clinical documentation for Ayurvedic clinics.

## Latest Status: 3 Navigation/UI Bug Fixes Complete (Feb 2026)

### Bug Fixes - ALL FIXED ✅

**Bug 1 - New Prescription Navigation:**
- **Issue**: Create/Cancel buttons didn't navigate away after action
- **Fix**: Removed Alert dialogs, direct navigation with `router.replace()` after create, `router.back()` for cancel
- **File Changed**: `features/prescriptions/presentation/pages/CreatePrescriptionScreen.tsx`

**Bug 2 - New Casesheet Navigation:**
- **Issue**: Save/Cancel buttons didn't navigate away after action
- **Fix**: Same approach - direct navigation after successful save, immediate back on cancel
- **File Changed**: `features/casesheets/presentation/pages/CreateCasesheetScreen.tsx`

**Bug 3 - Quick Actions Not Visible on Mobile:**
- **Issue**: Quick action buttons (Reschedule, No-Show, Cancel, Complete) missing on appointment cards
- **Fix**: 
  - Simplified conditional logic for showing quick actions
  - Improved role normalization to handle various role formats (clinic_admin, ClinicAdmin, CLINIC_ADMIN)
  - Replaced CSS `gap` with explicit margins for better React Native compatibility
- **File Changed**: `features/appointments/presentation/components/AppointmentListItem.tsx`

---

## Previous Status: 3 High-Priority Bug Fixes Complete (Feb 2026)

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
