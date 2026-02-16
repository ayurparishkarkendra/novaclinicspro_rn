# AyurParishkar Clinic Management App - PRD

## Project Overview
Healthcare scheduling mobile application built with React Native (Expo) connecting to a backend on Koyeb. The app handles appointments, clients, staff, treatments, billing, and clinical documentation for Ayurvedic clinics.

## Latest Status: Clinical Documents Module - TypeScript Fixes (Dec 2025)

### Clinical Documents Module - VERIFICATION READY

Completed all TypeScript error fixes for the Clinical Documents module (Casesheets, Prescriptions, Treatment Sheets).

**Fixed Issues:**
- API client imports (`apiClient` → `axiosClient`)
- Duplicate export errors in index.ts files
- Added missing typography styles (`subtitle1`, `subtitle2`)
- Fixed AuthUserSession entity (added `id`, `fullName`)
- Fixed Expo Router typed routes
- Fixed useDebounce hook timeout type
- Fixed expo-localization API

**Verification Status:** ✅ No TypeScript errors in Clinical Documents module

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
