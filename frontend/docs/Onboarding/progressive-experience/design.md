# Design Document — Onboarding Production Hardening

## Overview

This document describes the technical design for hardening the NovaClinics Pro onboarding wizard for initial production release. This revision reflects a **release-now, harden-later** approach: only the 7 absolute release blockers are in scope. All other hardening work (draft persistence, offline resilience, conflict resolution, analytics, etc.) is deferred to post-release sprints and documented here for completeness.

### Documentation Ownership

Canonical Progressive Experience documentation lives in:

```text
frontend/docs/Onboarding/progressive-experience/
```

The `.kiro` directory is an agent/spec workspace only:

```text
frontend/.kiro/specs/onboarding-production-hardening/
```

Accepted architecture and planning documents must be version-controlled in the canonical path and traceable to commits. The `.kiro` copy must not become an independently editable source of truth.

### Phase Terminology

Use `Progressive Experience Phase 0`, `Progressive Experience Phase 1`, `Progressive Experience Phase 2`, and so on for all future work.

Historical mapping:

```text
Legacy "Sprint 1" = Progressive Experience production-hardening checkpoint
Legacy "release gate" = Progressive Experience production-hardening checkpoint
```

### Progressive Experience Production-Hardening Checkpoint Scope (9 Items: 7 Engineering Changes + 2 Verification Tasks)

| # | Item | Requirement |
|---|---|---|
| 1 | Shared `SERVICE_CATALOGUE_ALIASES` constant | Req 1–2 |
| 2 | `StepDetailScreen` alias routing fix | Req 1 |
| 3 | `SetupWizardFlow` alias routing fix | Req 2 |
| 4 | Delete `TreatmentsAndTherapiesScreen.tsx` | Req 3 |
| 5 | Submit → `await refetch()` → advance ordering | Req 26 AC-8 |
| 6 | `isPending` lock on CTA + spinner | Req 26 AC-1–5 |
| 7 | `invalidateQueries` after step submit | Req 27 AC-1 |
| 8 | Android `BackHandler` intercept | Req 10 |
| 9 | Tenant resolution + backend idempotency verification | Req 11, Req 12 AC-6 |

### Deferred to Post-Release

WizardDraftStore · AsyncStorage persistence · lz-string · OfflineBanner · NetInfo · PendingMutationStore · Axios retry interceptor · Conflict resolution modal · Multi-device sync · Draft expiry · Analytics · Error centralisation · Payment recovery · Accessibility enhancements · Tenant cleanup logic · AppState lifecycle handling

**Key codebase facts:**
- The active wizard path is `SetupWizardFlow.tsx`. `SetupWizardScreen.tsx` is a redirect shim and `StepDetailScreen.tsx` is a legacy alternate flow.
- Step screens register save handlers via `onRegisterSaveHandler` prop; external steps (staff, rooms) have no save handler.
- Auth store pattern: `create<State>((set, get) => ({...}))`, async actions catch internally, selector hooks exported separately.

---

## Components and Interfaces

### Progressive Experience Production-Hardening Checkpoint Components

**`stepAliases.ts`** — shared constant array extracted from `SetupWizardFlow` and `StepDetailScreen` so both screens use the identical alias list.

```typescript
// frontend/features/onboarding/constants/stepAliases.ts
export const SERVICE_CATALOGUE_ALIASES = [
  'treatments_and_therapies',
  'services_and_specialities',
  'services',
  'services_offered',
  'treatment_services',
] as const;
export type ServiceCatalogueAlias = typeof SERVICE_CATALOGUE_ALIASES[number];
```

**`SetupWizardFlow.tsx` (modified)** — adds: alias routing via `SERVICE_CATALOGUE_ALIASES`, submission lock state, `submissionId` ref, `await refetch()` before step advance, Android `BackHandler`.

**`StepDetailScreen.tsx` (modified)** — adds: service-catalogue aliases to `redirectSteps` map.

### Deferred Components (Post-Release)

`wizard-draft.store.ts` · `pending-mutations.store.ts` · `OfflineBanner.tsx` · `DraftConflictModal.tsx`

---

## Data Models

### Tier 1 Data Changes

No data model changes are required for the Progressive Experience production-hardening checkpoint. The `updated_at` / `updatedAtMs` DTO additions are deferred to the post-release conflict resolution phase (see deferred section 1.4 above).

### Deferred Data Models (Post-Release)

`DraftEntry`, `PendingMutation`, `DraftPayload`, and related types are deferred to the post-release hardening sprint.

---

## Architecture

### Layer Map (Clean Architecture)

```
Presentation Layer
  ├── pages/
  │   ├── SetupWizardFlow.tsx          ← orchestrator, modified heavily
  │   └── StepDetailScreen.tsx         ← modified (alias routing)
  ├── components/
  │   ├── OfflineBanner.tsx            ← NEW (deferred)
  │   └── DraftConflictModal.tsx       ← NEW (deferred)
  └── stores/
      ├── wizard-draft.store.ts        ← NEW (deferred)
      └── pending-mutations.store.ts   ← NEW (deferred)

Data Layer
  ├── datasources/
  │   └── onboarding.api.ts            ← modified (idempotency keys, X-Tenant-ID removal)
  └── repositories/
      └── onboarding.repository.impl.ts ← modified (query invalidation, new mutations)

Domain Layer
  └── models/
      └── onboarding.dtos.ts           ← NO checkpoint changes; updated_at / updatedAtMs deferred to post-release conflict resolution phase

Core Layer
  ├── api/
  │   └── axiosClient.ts               ← modified (retry interceptor, deferred)
  └── analytics/
      └── analytics.ts                 ← NEW stub (deferred)
```

### Dependency Rules (Req 22, 23)

| Layer | Can import | Cannot import |
|---|---|---|
| Stores | Nothing outside core utils | React hooks, React Query, Axios |
| Service functions (`datasources/`) | axiosClient, DTOs | React hooks, Zustand |
| Repository hooks (`repositories/`) | Service functions, React Query | Zustand stores directly |
| Presentation hooks (`presentation/hooks/`) | Repository hooks, Zustand stores | Service functions directly |
| Components / pages | Presentation hooks, Zustand selectors | APIs directly |

---

## Error Handling

### Tier 1 Error Handling

All errors in `handleNext` are caught and surfaced via `Alert.alert` using the existing pattern already in `SetupWizardFlow`. No new error infrastructure is needed for Tier 1.

The `submissionId` guard silently drops stale callbacks — no user-visible error in that case.

### Deferred Error Handling (Post-Release)

`syncWizardDraftToStorage` error handling, analytics reporting, and centralised `mapOnboardingError` utility are deferred to post-release sprints.

---

## Correctness Properties

### Property 1: No Double Submission

`handleNext` is a no-op if `submitMutation.isPending === true`. The CTA button is disabled and shows a spinner. `submitStepDataApi` is called at most once per user tap.

### Property 2: Step Advances Only After Refetch

`setCurrentStepIndex` is called only after `await refetch()` resolves inside `handleNext`. Step index never increments on stale cache data.

### Property 3: Stale Callbacks Are Silent No-ops

`submissionId` is captured at call time and compared in `onSuccess`/`onError`. Mismatched IDs (navigate-away-and-back race) are silently discarded.

### Property 4: Android Back Never Exits Wizard

`BackHandler` returns `true` on every hardware back press while `SetupWizardFlow` is mounted.

### Property 5: Alias Routing Is Exhaustive and Consistent

Both `StepDetailScreen.redirectSteps` and `SetupWizardFlow.renderStepContent` derive their lists from the single `SERVICE_CATALOGUE_ALIASES` constant. They cannot diverge.

### Deferred Properties (Post-Release)

Properties related to draft persistence and storage reliability (DraftEntry integrity, AsyncStorage error isolation) are deferred to the post-release hardening sprint.

---

## Progressive Experience Production-Hardening Checkpoint Implementation

### 1.1 Alias Routing — StepDetailScreen (Req 1)

**Current state:** `redirectSteps` map in `StepDetailScreen.tsx` contains `rooms_and_therapy_beds`, `treatment_rooms`, `treatments_and_therapies`, `staff_and_roles`, `staff_setup`, `staff_members`, `inventory_setup`. Missing: `services`, `services_offered`, `services_and_specialities`, `treatment_services`.

**Change:** Extend the `redirectSteps` map with a unified service-catalogue group:

```typescript
// Audited service-catalogue aliases — source: backend template audit (Req 4)
const SERVICE_CATALOGUE_ALIASES = [
  'treatments_and_therapies',
  'services_and_specialities',
  'services',
  'services_offered',
  'treatment_services',
] as const;

const redirectSteps: Record<string, string> = {
  // service catalogue — all aliases point to the same screen
  ...Object.fromEntries(
    SERVICE_CATALOGUE_ALIASES.map(code => [code, '/clinic-admin/settings/treatments'])
  ),
  // rooms
  rooms_and_therapy_beds: '/clinic-admin/settings/rooms',
  treatment_rooms: '/clinic-admin/settings/rooms',
  // staff
  staff_and_roles: '/clinic-admin/staff',
  staff_setup: '/clinic-admin/staff',
  staff_members: '/clinic-admin/staff',
  // inventory
  inventory_setup: '/clinic-admin/inventory',
};
```

### 1.2 Alias Routing — SetupWizardFlow (Req 2)

**Current state:** `renderStepContent()` switch handles `treatments_and_therapies` and `services_and_specialities` in one branch, showing a redirect card. Missing: `services`, `services_offered`, `treatment_services`.

**Change:** Extract `SERVICE_CATALOGUE_ALIASES` as a shared constant (same array as above, placed in `frontend/features/onboarding/constants/stepAliases.ts`) and replace the hardcoded case list:

```typescript
// In renderStepContent()
if (SERVICE_CATALOGUE_ALIASES.includes(currentStep.code as any)) {
  return <RedirectCard
    title={t('onboarding.wizard.steps.treatmentsAndTherapies')}
    description={t('onboarding.wizard.redirectCard.treatmentsDescription')}
    ctaLabel={t('onboarding.wizard.redirectCard.goToTreatments')}
    onPress={() => router.push('/clinic-admin/settings/treatments')}
  />;
}
```

`RedirectCard` is a new shared sub-component extracted from the existing inline JSX, accepting `title`, `description`, `ctaLabel`, `onPress`.

### 1.3 Delete TreatmentsAndTherapiesScreen (Req 3)

Delete `frontend/features/onboarding/presentation/pages/steps/TreatmentsAndTherapiesScreen.tsx`. Verify build passes.

### 1.4 Backend DTO — `updated_at` Field

> **Deferred.** The `updated_at` field in `StepValidationDTO` and the `updatedAtMs` mapping are required only for draft conflict resolution (Req 16, Req 29), which is deferred to post-release. No changes to `onboarding.dtos.ts` or `onboarding-status.entity.ts` are needed for the Progressive Experience production-hardening checkpoint.

---

## Data Flow Diagrams

### Submit → Refetch → Advance (Progressive Experience production-hardening checkpoint)

```
User taps Next
  └─► handleNext() fires
        ├─► isPending === true? → NO-OP (button was disabled, this is a guard)
        ├─► generate submissionId (UUID)
        ├─► await submitStepDataApi(tenantId, stepCode, data, submissionId)
        │     └─► Idempotency-Key: submissionId sent in header
        ├─► await refetch()   ← CRITICAL: must complete before advancing
        ├─► submissionId still current? → if not, silent no-op (stale callback)
        └─► setCurrentStepIndex(prev => prev + 1)  OR  router.replace(dashboard)
```

### Deferred Data Flows (Post-Release)

Draft lifecycle, offline mutation queue, and conflict resolution flows are deferred to the post-release hardening sprint.

---

## File Change Summary

| File | Action | Notes |
|---|---|---|
| `frontend/features/onboarding/constants/stepAliases.ts` | CREATE | Shared alias constant |
| `frontend/features/onboarding/presentation/pages/StepDetailScreen.tsx` | MODIFY | Alias routing fix |
| `frontend/features/onboarding/presentation/pages/SetupWizardFlow.tsx` | MODIFY | Alias routing, submission lock, await-refetch ordering, Android back, query invalidation |
| `frontend/features/onboarding/presentation/pages/steps/TreatmentsAndTherapiesScreen.tsx` | DELETE | Dead file |
| `frontend/features/onboarding/data/repositories/onboarding.repository.impl.ts` | MODIFY | `invalidateQueries` in `useSubmitStepMutation.onSuccess` |

All other file changes (WizardDraftStore, OfflineBanner, PendingMutationStore, axiosClient retry, DraftConflictModal, analytics, error utils, i18n, auth store cleanup) are deferred.

---

## Testing Strategy

### Progressive Experience Production-Hardening Checkpoint Tests (must pass before shipping)

| File | Test | Type |
|---|---|---|
| `SetupWizardFlow.test.tsx` | Rapid "Next" taps while `isPending` → `submitStepDataApi` called once | Unit |
| `SetupWizardFlow.test.tsx` | Step index does NOT advance until `refetch()` resolves | Integration |
| `SetupWizardFlow.test.tsx` | Stale `submissionId` callback is a no-op | Unit |
| `SetupWizardFlow.test.tsx` | Android back on step > 0 calls `handlePrevious`, not `router.back()` | Unit |
| `SetupWizardFlow.test.tsx` | Android back on step 0 does not navigate | Unit |
| `StepDetailScreen.test.tsx` | `services`, `services_offered`, `treatment_services` redirect to `/clinic-admin/settings/treatments` | Unit |
| `SetupWizardFlow.test.tsx` | `services`, `services_and_specialities`, `treatment_services` render Treatments redirect card | Unit |

### E2E Manual Verification Before Release

| Run | Clinic type | Device | Network | Critical checks |
|---|---|---|---|---|
| A | Demo | Android (emulator OK) | Fast (WiFi) | All steps complete, go-live reached |
| B | Real (direct setup) | Android (emulator OK) | Fast (WiFi) | `tenant_id` in JWT, all steps complete |
| C | Either | Android **physical** | Slow (3G throttle) | No double-submit, `Idempotency-Key` present in headers, step advances only after refetch |
| D | Either | Android **physical** | Intermittent (airplane mode) | No crash, no data loss, step advances when reconnected |

### Release Checklist

```
[ ] Run A passed (demo clinic, fast network)
[ ] Run B passed (real clinic, fast network)
[ ] Run C passed (slow network, physical Android)
[ ] Run D passed (intermittent connectivity, physical Android)

[ ] Backend idempotency confirmed:
      - Sent 2× identical POST /steps/{code} with same Idempotency-Key to staging
      - Second response returned cached result, no duplicate record created

[ ] Duplicate submission test:
      - Tapped "Next" 3× rapidly during a slow submission
      - Confirmed submitStepDataApi called exactly once (network log)

[ ] Submit → refetch → step advance ordering:
      - Throttled network to ~1 Mbps
      - Wizard does NOT advance step index while refetch is in-flight

[ ] Tenant resolution verified:
      - JWT contains tenant_id for both PROVISIONAL and live tenants, OR
      - Fallback header mechanism confirmed working on staging

Signed off by: ______________ Date: ______________
```

### Backend Dependencies for E2E Validation

The frontend hardening in this sprint depends on the following backend behaviours before E2E sign-off:

1. Auth/session tenant resolution
   - `/auth/me` or the active session bootstrap response must include a non-null tenant identifier for both PROVISIONAL/demo tenants and live tenants.
   - Until that is deployed and verified on staging, onboarding endpoints must continue accepting `X-Tenant-ID: {tenantId}` as a fallback header.

2. Onboarding status contract
   - `GET /api/v1/onboarding/{tenantId}/status` must return `visible_steps` in backend-defined order.
   - `per_step_validation[stepCode].status` must reflect the latest step submit result immediately after refetch.
   - Service-catalogue aliases may include: `treatments_and_therapies`, `services_and_specialities`, `services`, `services_offered`, `treatment_services`.

3. Step submission contract
   - `POST /api/v1/onboarding/{tenantId}/steps/{stepCode}` must accept `{ data, mark_complete }`.
   - The endpoint must accept `Idempotency-Key` and cache/dedupe duplicate requests with the same key for the same tenant/step/payload.
   - A duplicate request with the same `Idempotency-Key` must not create duplicate validation records or double-increment completion counters.

4. Complete setup contract
   - `POST /api/v1/onboarding/{tenantId}/complete` must finalize setup only after required steps are complete.
   - The auth/session refresh after completion must expose the updated application or tenant status used by the dashboard gate.

5. External management screens used by redirect steps
   - Treatments: `/clinic-admin/settings/treatments` must persist at least one treatment/service so the corresponding onboarding status becomes completed.
   - Rooms: `/clinic-admin/settings/rooms` must persist rooms/beds and update onboarding status.
   - Staff: `/clinic-admin/staff` must persist staff and update onboarding status.
   - Inventory: `/clinic-admin/inventory` must persist inventory and update onboarding status.

6. Staging observability needed for release sign-off
   - Request logs must expose `Idempotency-Key`, tenant ID source (JWT vs `X-Tenant-ID` fallback), step code, and dedupe/cache outcome.
   - Status-query logs should make it possible to confirm one completed transition per step after duplicate submits.

### Deferred Tests (Post-Release)

WizardDraftStore unit and property tests · tenant isolation integration tests · OfflineBanner tests · PendingMutationStore tests · multi-device sync tests — all deferred to post-release hardening sprint.

---

## Theme Compliance

All new and modified files must use `useClinicTheme()` exclusively — zero hardcoded colours, spacing values, font sizes, or border radii (except `flex: 1`, `zIndex`, `minHeight: 44`, `minWidth: 44`, animation timing).

---

## Git Delivery Strategy

All onboarding feature work must start from the latest committed `dev` baseline in both repositories. If either working tree is dirty, do not switch branches in that folder; use a clean clone or a separate worktree.

### 1. Start from latest `dev`

Run separately in frontend and backend:

```bash
git switch dev
git pull --ff-only origin dev
git status
```

Expected:

```text
On branch dev
Your branch is up to date with 'origin/dev'.
nothing to commit, working tree clean
```

### 2. Create paired feature branches

Use the same feature branch name in frontend and backend. For the current onboarding initiative, use:

```text
feature/progressive-experience-recovery
```

Create locally and verify:

```bash
git switch -c feature/progressive-experience-recovery
git branch --show-current
git status
```

### 3. Create remote branches immediately

```bash
git push -u origin feature/progressive-experience-recovery
```

Run in both frontend and backend.

### 4. Commit in logical groups

Before each commit:

```bash
git status
git diff --stat
git diff --check
```

Stage only reviewed files:

```bash
git add <specific-files>
```

Review staged content:

```bash
git diff --cached --stat
git diff --cached --name-status
```

Commit and push:

```bash
git commit -m "<clear onboarding task message>"
git push
```

Do not use `git add .` unless every modified and untracked file has been reviewed.

### 5. Keep feature branch updated from `dev`

After the feature branch is pushed, prefer:

```bash
git fetch origin
git merge origin/dev
```

Resolve conflicts, rerun tests, and push. Use rebase only when the branch has not been shared and the history rewrite is safe.

### 6. Final feature verification

Frontend:

```bash
git status
npm test -- --runInBand
npx tsc --noEmit
git diff --check
git log --oneline --decorate -10
```

Backend:

```bash
git status
alembic heads
alembic current
pytest -q
git diff --check
git log --oneline --decorate -10
```

The feature branch must be clean before integration.

### 7. Merge feature into `test`

Update `test`:

```bash
git switch test
git pull --ff-only origin test
```

Check merge compatibility:

```bash
git merge-tree --write-tree test feature/progressive-experience-recovery
echo $?
```

Expected:

```text
0
```

Merge with an explicit merge commit:

```bash
git merge --no-ff feature/progressive-experience-recovery \
  -m "Merge feature/progressive-experience-recovery into test"
git push origin test
```

Run separately in frontend and backend.

### 8. Integrated testing on `test`

Keep both repositories on `test`.

Frontend:

```bash
npm test -- --runInBand
npx tsc --noEmit
```

Backend:

```bash
alembic upgrade head
pytest -q
```

Then run the complete onboarding frontend-backend journey and UAT. Do not promote to `dev` until integrated testing passes.

### 9. Promote validated `test` to `dev`

Inspect divergence:

```bash
git fetch origin
git log --oneline --left-right dev...test
```

If `dev` is only behind:

```bash
git switch dev
git pull --ff-only origin dev
git merge --ff-only test
git push origin dev
```

If branches diverged:

```bash
git switch dev
git pull --ff-only origin dev
git merge-tree --write-tree dev test
echo $?
```

If clean:

```bash
git merge --no-ff test -m "Merge validated test into dev"
git push origin dev
```

Apply the same process to frontend and backend.

### 10. Confirm feature branch is merged

```bash
git merge-base --is-ancestor \
  feature/progressive-experience-recovery test
echo $?
```

Expected:

```text
0
```

### 11. Delete merged feature branches

After validation and promotion:

```bash
git switch dev
git branch -d feature/progressive-experience-recovery
git push origin --delete feature/progressive-experience-recovery
git fetch --all --prune
```

Do this separately in frontend and backend.

### 12. Final branch verification

```bash
git branch -a -vv
git status
```

Expected long-lived active branches:

- `main`
- `dev`
- `test`

The completed onboarding feature branch should no longer exist locally or remotely.

### Multi-Agent Working Rule

One agent = one branch = one clean clone or worktree.

Claude's Doctor Module work and Codex's Onboarding work must never share the same working folder. Codex must work only in the Progressive Experience frontend/backend folders and branches. Unrelated Doctor Module files must not be staged, moved, committed, reset, or deleted.
