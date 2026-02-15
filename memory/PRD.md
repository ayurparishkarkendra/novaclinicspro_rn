# AyurParishkar Clinic Management App - PRD

## Project Overview
Healthcare scheduling mobile application built with React Native (Expo) connecting to a backend on Koyeb. The app handles appointments, clients, staff, treatments, and billing for Ayurvedic clinics.

## Current Status: Preview Screen Bug Fixes (Dec 2025)

### User Requirements (Final - Message #164)
User provided 5 specific P0 issues for the therapy plan preview screen:

1. **BUG #1: Conflict Card Therapist Label** ✅ FIXED
   - Issue: Conflict card shows duplicate "Unassigned" labels for unavailable therapists
   - Fix: `getSessionTherapistDisplay()` now returns "Staff not available" for staff conflicts

2. **BUG #2: Redundant `appointments.orginallyRequested` Row** ✅ FIXED
   - Issue: Expanded card shows raw key like `appointments.orginallyRequested: 12:00`
   - Fix: Removed the `originalTimeSection` rendering entirely from expanded conflict section

3. **BUG #3: Duplicate "No therapists available" Message** ✅ FIXED
   - Issue: Long message appears in expanded section, redundant with card message
   - Fix: Conflict message only shown ONCE in expanded section, not on main card

4. **BUG #4: "Select an alternative" Cards Not Tappable** ✅ FIXED
   - Issue: Alternative suggestion cards were not selectable
   - Fix: `onSelectAlternative` now receives full `AlternativeSlot` object and updates `effectiveTimes`

5. **BUG #5: Missing Global "Apply to all slots" Options** ✅ FIXED
   - Issue: No way to apply plan-level alternatives globally
   - Fix: Added `GlobalAlternativesSection` component that shows top high-coverage time patterns

### Architecture Changes

**Single Source of Truth Pattern:**
```typescript
// effectiveTimes: Map<session_number, EffectiveTime>
// This is the ONLY place to read session times from
const [effectiveTimes, setEffectiveTimes] = useState<Map<number, EffectiveTime>>(new Map());
```

**Key Invariants:**
1. UI components NEVER recompute times from metadata
2. Both global and per-session selections update the same state
3. `effectiveTimes` is initialized from API response, then modified by user selections
4. Final booking payload reads exclusively from `effectiveTimes`

**Plan-Level Alternative Detection:**
- Alternatives with `plan_level: true` are grouped and shown as global options
- Coverage is computed by counting how many sessions each time pattern works for
- Top 2 highest-coverage patterns are shown

---

## Fixes Applied (This Session - Dec 2025)

### PreviewAppointmentsScreen.tsx - Complete Refactor

**State Management:**
- Replaced `selected_alternative` per-session with centralized `effectiveTimes` Map
- Added `selectedGlobalPattern` to track global selection
- Added `initializeEffectiveTimes()` callback to hydrate state from API

**New Components:**
- `GlobalAlternativesSection`: Renders plan-level alternatives as tappable global options
- Updated `SessionCard`: Now reads from `effectiveTime` prop (single source of truth)

**Bug Fixes:**
- `getSessionTherapistDisplay()`: Returns "Staff not available" for staff conflicts (Bug #1)
- Removed `originalTimeSection` rendering (Bug #2)
- Consolidated conflict message to expanded section only (Bug #3)
- `onSelectAlternative` now properly updates state (Bug #4)
- `planLevelAlternatives` computed memo groups and displays global options (Bug #5)

**Cleanup:**
- Removed legacy `originalTimeSection`, `originalTimeLabel`, `originalTimeValue` styles
- Removed `selected_alternative` from SessionData interface
- Added new styles for global alternatives section

### en-US.json Translations Added
- `applyToAllSlots`: "Apply to all sessions"
- `highCoverageOptions`: "These times work for most sessions"
- `worksForSessions`: "Works for {{count}}/{{total}} sessions"

---

## API Response Format

### Session with Plan-Level Alternative
```typescript
interface AlternativeSlot {
  start: string;
  end: string;
  available_staff: Array<{ staff_id: string; full_name: string; staff_type: string }>;
  available_rooms: Array<{ room_id: string; name: string; room_type: string }>;
  score: number;
  plan_level?: boolean; // true = can be applied globally
}
```

### Status Values (Case-Insensitive)
- `SCHEDULED` / `scheduled`
- `CONFIRMED` / `confirmed`
- `IN_PROGRESS` / `in_progress`
- `COMPLETED` / `completed`
- `CANCELLED` / `cancelled`
- `NO_SHOW` / `no_show`

---

## Architecture

### Frontend
- **Framework**: React Native with Expo SDK 53
- **Router**: Expo Router v3
- **State**: @tanstack/react-query + local useState for effectiveTimes

### Key Files Modified
```
/app/frontend/features/appointments/presentation/pages/
└── PreviewAppointmentsScreen.tsx  (Complete refactor)

/app/frontend/core/localization/translations/
└── en-US.json  (Added 3 new keys)
```

---

## Test Data-TestIDs

| Component | TestID | Purpose |
|-----------|--------|---------|
| GlobalAlternativesSection | `global-alternatives-section` | Global options container |
| GlobalAlternativeOption | `global-alternative-{index}` | Each global option |
| SessionCard | `session-card-{session_number}` | Session card |
| AlternativeSlot | `alternative-slot-{session_number}-{index}` | Per-session alternative |

---

## Credentials
- **Clinic Admin**: hareshlekkala@gmail.com / Vishnu432!
- **Alt Admin**: sunithalekkala75@gmail.com / Vishnu432!

## Backend
- **Host**: Koyeb (https://given-dolly-ayurparishkarkendra-e5891817.koyeb.app)
- **Auth**: Supabase (evkcvntjpkxlcxgwychq.supabase.co)

---

## Testing Notes

The refactored screen requires testing with:
1. Sessions with NO conflicts (should display green checkmarks)
2. Sessions WITH conflicts and `plan_level: true` alternatives
3. Sessions WITH conflicts but only per-session alternatives
4. User selecting global option (should resolve multiple sessions)
5. User selecting per-session option (should clear global selection)
6. Final booking payload uses correct effective times
