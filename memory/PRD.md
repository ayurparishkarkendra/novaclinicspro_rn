# AyurParishkar Clinic Management App - PRD

## Project Overview
Healthcare scheduling mobile application built with React Native (Expo) connecting to a backend on Koyeb. The app handles appointments, clients, staff, treatments, and billing for Ayurvedic clinics.

## Current Status: Critical Frontend Fixes (Feb 15, 2025)

### User Requirements - Single Pass Critical Fix (MANDATORY)

User provided comprehensive fixes required for Appointment List, Details, and Preview screens. ALL items below were addressed in one implementation pass:

---

## SECTION A - APPOINTMENT LIST PAGE (CARD FIXES) ✅ COMPLETE

### A1. Card Layout Fixes ✅
- **REMOVED** expand/collapse arrow
- **KEPT** ONE right arrow for navigation, vertically centered
- Restored clean card layout

### A2. Quick Actions ✅
Actions appear ONLY on the appointment card (not duplicated in details):
- Reschedule (scheduled/confirmed)
- No-Show (scheduled/confirmed)
- Cancel (scheduled/confirmed)
- **Complete** (confirmed/in_progress) - **WAS MISSING, NOW ADDED**

### A3. Visit Recording ✅
- Complete action triggers `onStatusUpdate(appointmentId, 'completed')`
- Only way to record a visit

---

## SECTION B - APPOINTMENT DETAILS PAGE (REDESIGN) ✅ COMPLETE

### B1. Removed Redundant Data ✅
**DELETED** from Appointment Details screen:
- Date
- Time
- Duration
- Staff
(This info already exists on the list card)

### B2. Visit History Section ✅
Replaced removed section with **Previous Visit Cards** containing:
- Visit Date & Time
- Visit Type (Consultation / Treatment)
- Case Sheet link (active/inactive indicator)
- Prescription link (active/inactive indicator)
- Payment details (status & amount)
- Navigation arrow

---

## SECTION C - CONFLICT & ALTERNATIVE FIXES ✅ COMPLETE

### C1. Conflict Message Cleanup ✅
- **REMOVED** `appointments.originallyRequested:*` completely
- **REMOVED** duplicate "Unassigned" → replaced with "Staff not available"
- **REMOVED** long conflict text from expanded sections
- **ONE** short, single-line message displayed on the card only

### C2. Alternative Selection Resolves Conflict ✅
When alternative is tapped:
- Selection persisted in shared state (`effectiveTimes`)
- `effective_start / effective_end` updated
- `is_resolved = true` set for that session
- Card turns green with ✓
- Conflict UI removed for that session

### C3. Time Correctness ✅
- Preview shows selected time
- Created appointment uses `effective_start / effective_end` ONLY
- **NO FALLBACK** to 9:30 AM or preferred_time_hour

---

## SECTION D - "APPLY TO ALL" & CUSTOM TIME ✅ COMPLETE

### D1. Apply-to-All ✅
- Shows "Apply X:XX PM to all sessions"
- Tapping applies to all eligible days
- Uncovered days remain conflicted
- Coverage displayed as "Works for X/Y sessions"

### D2. Custom Time Row ✅ IMPLEMENTED
- Added "Choose a different time…" row below alternatives
- Opens time picker modal on tap
- Validates using existing `getAvailableSlotsApi` (single-slot API)
- If valid → updates session's effectiveTime, marks resolved
- If invalid → shows conflict alert

---

## SECTION E - DELETION REQUIREMENTS ✅ COMPLETE

**DELETED:**
- Any UI rendering `appointments.originallyRequested`
- Any logic recomputing time from metadata
- Any duplicate conflict rendering
- Unused imports (Linking, Alert, openWhatsApp from AppointmentListItem)
- Unused styles (infoRow, card, etc. where applicable)

---

## KEY ARCHITECTURE CHANGES

### Single Source of Truth (SessionState)
```typescript
interface EffectiveTime {
  start: string;
  end: string;
  staff_id: string | null;
  staff_name: string | null;
  room_id: string | null;
  room_name: string | null;
  is_resolved: boolean;
}

// Central state for all session times
const [effectiveTimes, setEffectiveTimes] = useState<Map<number, EffectiveTime>>(new Map());
```

### All UI Components Read From:
- `effective_start / effective_end`

### Forbidden Sources:
- `preferred_time_hour`
- `start_date`
- `original appointment_start` after selection
- alternative index
- UI-derived guesses

---

## FILES MODIFIED

```
/app/frontend/features/appointments/presentation/
├── components/
│   └── AppointmentListItem.tsx     (COMPLETE REWRITE - A1, A2, A3)
├── pages/
│   ├── AppointmentDetailScreen.tsx (REDESIGN - B1, B2)
│   └── PreviewAppointmentsScreen.tsx (BUG FIXES - C1, C2, C3, D1)

/app/frontend/core/localization/translations/
└── en-US.json                       (Added new i18n keys)
```

---

## ACCEPTANCE TEST SCENARIOS

### Scenario 1: Time Selection
- [ ] Select 4:00 PM alternative
- [ ] Preview shows 4:00 PM
- [ ] Confirm
- [ ] Appointment list shows 4:00 PM
- [ ] No conflict banners

### Scenario 2: Apply-to-All with Partial Coverage
- [ ] Covered sessions resolved
- [ ] Uncovered sessions still conflicted

### Scenario 3: Complete Action
- [ ] Tap Complete on confirmed/in_progress appointment
- [ ] Visit recorded
- [ ] Status updated correctly

---

## CREDENTIALS
- **Clinic Admin**: hareshlekkala@gmail.com / Vishnu432!
- **Alt Admin**: sunithalekkala75@gmail.com / Vishnu432!

## BACKEND
- **Host**: Koyeb (https://given-dolly-ayurparishkarkendra-e5891817.koyeb.app)
- **Frontend Preview**: https://appt-flow-test.preview.emergentagent.com

---

## API Endpoints (No Changes)
- `POST /api/v1/appointments/therapy-plan` - Generate plan with alternatives
- `POST /api/v1/appointments` - Create single appointment
- `PATCH /api/v1/appointments/{id}` - Update status
1. Sessions with NO conflicts (should display green checkmarks)
2. Sessions WITH conflicts and `plan_level: true` alternatives
3. Sessions WITH conflicts but only per-session alternatives
4. User selecting global option (should resolve multiple sessions)
5. User selecting per-session option (should clear global selection)
6. Final booking payload uses correct effective times
