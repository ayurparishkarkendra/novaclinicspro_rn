# Implementation Plan: Onboarding Production Hardening — Progressive Experience Production-Hardening Checkpoint

## Overview

Seven absolute release blockers, in delivery order. Each task maps directly to a design section in `design.md` and specific acceptance criteria in `requirements.md`. No deferred items (WizardDraftStore, OfflineBanner, PendingMutationStore, Axios retry, conflict resolution, analytics, i18n, accessibility, payment recovery) are included.

Language: **TypeScript / React Native (Expo)**

---

## Phase Terminology

Use `Progressive Experience Phase 0`, `Progressive Experience Phase 1`, `Progressive Experience Phase 2`, and so on for future work.

Historical mapping:

```text
Legacy "Sprint 1" = Progressive Experience production-hardening checkpoint
Legacy "release gate" = Progressive Experience production-hardening checkpoint
```

---

## Tasks

### Recovery Checkpoint R0: COMPLETE

- [x] R0.1 Move/copy accepted specs to tracked canonical location
  - Canonical path: `frontend/docs/Onboarding/progressive-experience/`
  - `.kiro` must not remain the sole source of truth.
  - Do not mark complete until the docs are committed or otherwise traceable in Git.

- [x] R0.2 Update references
  - Requirements, design, tasks, reconciliation, and recovery checkpoint must point to the canonical tracked docs path.
  - Kiro copies must be treated as workspace mirrors.

- [x] R0.3 Verify clean paired branch baselines
  - Frontend and backend must start from latest `origin/dev`.
  - Use `feature/progressive-experience-recovery` in both repositories.
  - Do not reuse stale `origin/feature/progressive-experience-phase-1`.

- [x] R0.4 Verify backend idempotency status
  - Current status: `VERIFIED_IN_DEV`.
  - Backend recovery commits `c5082fb`, `f145dbf`, `a2a818b`, `bc6d446`, and `a82103d` implement Platform Foundation idempotency, onboarding step submission integration, migration `20260712_000001`, approved tenant-scoped persistence naming, fresh database migration-chain repair, and focused tests.
  - Fresh local `novaclinics_test` rebuild reaches `20260712_000001 (head)`.
  - Staging same-key replay/tenant-isolation checks remain release blockers, not implementation-readiness blockers.

- [x] R0.5 Define tenant-resolution staging checks
  - Cover `/auth/me`, onboarding/provisional tenants, live tenants, tenant switching, `X-Tenant-ID` compatibility, and cross-tenant submission safety.
  - Staging execution is blocked until staging URL, credentials, and safe tenants are provided.

- [x] R0.6 Complete or formally defer Hindi localization
  - Hindi Progressive Experience localization is complete in `hi-IN.json`.
  - Key parity check confirms 77 Hindi keys and 77 English keys with no missing or extra keys.
  - Interpolation variables are preserved.

- [x] R0.7 Issue GO/NO-GO report
  - Recovery / implementation readiness: `GO`.
  - Production promotion readiness: `NO-GO`.
  - Baseline frontend Jest/TypeScript failures and staging-only tenant/replay checks remain tracked release blockers.
  - Next authorized work: execute the first incomplete task group in this file.

- [x] 1. Create shared `SERVICE_CATALOGUE_ALIASES` constant
  - Create `frontend/features/onboarding/constants/stepAliases.ts`
  - Export `SERVICE_CATALOGUE_ALIASES` as a `const` array containing all **five** service-catalogue step codes: `treatments_and_therapies`, `services_and_specialities`, `services`, `services_offered`, `treatment_services`
  - Export the `ServiceCatalogueAlias` derived type
  - Add a source comment documenting the backend template audit origin (per Req 4 AC-3) — note that additional aliases may be added here after the backend template audit is complete
  - _Requirements: 1 AC-3, 2 AC-2, 4 AC-3_

- [x] 2. Fix alias routing in `StepDetailScreen`
  - [x] 2.1 Extend `redirectSteps` map in `StepDetailScreen.tsx`
    - Import `SERVICE_CATALOGUE_ALIASES` from `stepAliases.ts`
    - Replace any existing `treatments_and_therapies` / `services_and_specialities` entries with a spread of all aliases pointing to `/clinic-admin/settings/treatments`
    - Retain all existing non-service-catalogue entries (`rooms_and_therapy_beds`, `treatment_rooms`, `staff_and_roles`, `staff_setup`, `staff_members`, `inventory_setup`) unchanged
    - _Requirements: 1 AC-1, 1 AC-2, 1 AC-3_

  - [x]* 2.2 Write unit tests for `StepDetailScreen` alias routing
    - Test that `services`, `services_offered`, and `treatment_services` each redirect to `/clinic-admin/settings/treatments`
    - Test that an unrecognised step code continues existing behaviour (no redirect match)
    - _Requirements: 1 AC-1, 1 AC-2_
    - **Property 5: Alias Routing Is Exhaustive and Consistent**
    - **Validates: Requirements 1 AC-3, 2 AC-2**

- [x] 3. Fix alias routing in `SetupWizardFlow`
  - [x] 3.1 Update `renderStepContent` switch in `SetupWizardFlow.tsx`
    - Import `SERVICE_CATALOGUE_ALIASES` and `ServiceCatalogueAlias` from `stepAliases.ts`
    - Replace the existing hardcoded case list (`treatments_and_therapies`, `services_and_specialities`) with a single `if (SERVICE_CATALOGUE_ALIASES.includes(currentStep.code as ServiceCatalogueAlias))` branch at the top of `renderStepContent`
    - The branch must render the **existing** inline redirect card JSX unchanged — do NOT extract a new `RedirectCard` component (that introduces unnecessary scope for a release sprint)
    - The redirect card heading must display the string `"Treatments & Therapies"` regardless of which alias triggered the render
    - The redirect button must navigate to `/clinic-admin/settings/treatments`
    - All colours and spacing must come from `useClinicTheme()` — zero hardcoded values
    - _Requirements: 2 AC-1, 2 AC-2, 2 AC-3_

  - [x]* 3.2 Write unit tests for `SetupWizardFlow` alias routing
    - Test that `services`, `services_and_specialities`, and `treatment_services` each render the Treatments redirect card
    - Test that the card heading label is "Treatments & Therapies" for all aliases
    - _Requirements: 2 AC-1, 2 AC-3_
    - **Property 5: Alias Routing Is Exhaustive and Consistent**
    - **Validates: Requirements 2 AC-2**

- [x] 4. Delete `TreatmentsAndTherapiesScreen.tsx`
  - Delete `frontend/features/onboarding/presentation/pages/steps/TreatmentsAndTherapiesScreen.tsx`
  - Run the TypeScript build (`npx tsc --noEmit`) — must pass with zero type errors (confirms no live import depended on this file)
  - Run ESLint on the onboarding feature directory — must pass with no import/no-unresolved errors
  - Run the full onboarding test suite (`npm test -- --config=tests/onboarding/jest.config.js`) — all pre-existing tests must still pass
  - _Requirements: 3 AC-1, 3 AC-2_

- [x] 5. Checkpoint — alias routing complete
  - Focused alias-routing verification passed:
    `npm test -- --runInBand tests/onboarding/StepDetailScreen.test.tsx tests/onboarding/SetupWizardFlow.test.tsx`
    reported 2 passed suites and 17 passed tests.
  - `TreatmentsAndTherapiesScreen.tsx` remains absent.
  - Release-level frontend Jest/TypeScript baseline debt remains tracked in the recovery checkpoint and does not block implementation sequencing.

- [x] 6. Implement duplicate submission lock and `submissionId` guard in `SetupWizardFlow`
  - [x] 6.1 Add `isPending` CTA lock and loading spinner
    - Disable the "Next" CTA button and set `accessibilityState={{ disabled: true }}` when `submitMutation.isPending === true`
    - Disable the "Complete" and "Go Live" CTA buttons when `useCompleteSetupMutation.isPending === true`
    - Render a loading spinner / `ActivityIndicator` in place of the button label while any relevant mutation is pending
    - Use `useClinicTheme()` for all spinner/button style values
    - _Requirements: 26 AC-1, 26 AC-2, 26 AC-4_

  - [x] 6.2 Add `submissionId` ref and stale-callback guard
    - Generate a UUID v4 `submissionId` each time the user taps "Next" (only when `isPending` is `false`)
    - Store it in a `useRef` local to `SetupWizardFlow`
    - In `onSuccess` and `onError` callbacks, compare the callback's captured `submissionId` against the current ref value; if they differ, silently return without updating UI state or navigating
    - Reset (new UUID) on each new explicit submission attempt
    - _Requirements: 26 AC-6, 26 AC-7_

  - [x] 6.3 Add `Idempotency-Key` header to step submission API call
    - In `frontend/features/onboarding/data/datasources/onboarding.api.ts`, update `submitStepDataApi` to accept an optional `idempotencyKey?: string` parameter
    - When provided, send it as the `Idempotency-Key` request header: `headers: { 'Idempotency-Key': idempotencyKey }`
    - In `SetupWizardFlow.tsx`, pass `submissionIdRef.current` as the `idempotencyKey` argument on every `submitStepDataApi` call — the same UUID generated in task 6.2 is reused here, so a network retry of the same tap carries the same key
    - When the user initiates a **new** submission attempt (new tap, new `submissionId` generated), a fresh UUID is naturally used — no extra logic needed
    - _Requirements: 12 AC-1, 12 AC-2, 12 AC-5_

  - [x]* 6.4 Write unit tests for duplicate submission prevention
    - Test that rapid successive "Next" taps while `isPending === true` call `submitStepDataApi` exactly once
    - Test that a stale `submissionId` callback is a no-op (no navigation, no state update)
    - Test that the `Idempotency-Key` header value sent in the request matches `submissionIdRef.current`
    - _Requirements: 26 AC-5, 26 AC-6, 12 AC-1_
    - _Requirements: 26 AC-5, 26 AC-6_
    - **Property 1: No Double Submission**
    - **Validates: Requirements 26 AC-1, 26 AC-5**
    - **Property 3: Stale Callbacks Are Silent No-ops**
    - **Validates: Requirements 26 AC-6**

- [x] 7. Implement submit → `await refetch()` → advance ordering in `SetupWizardFlow`
  - [x] 7.1 Enforce sequential submit → refetch → advance in `handleNext`
    - In `handleNext`, after `useSubmitStepMutation` resolves successfully, call `refetch()` on the onboarding status query and `await` its completion before calling `setCurrentStepIndex` or `router.replace(dashboard)`
    - The wizard must NOT advance step index before the refetch resolves
    - Errors in refetch should be caught and surfaced via `Alert.alert` consistent with existing error handling
    - _Requirements: 26 AC-8_

  - [x]* 7.2 Write integration test for submit → refetch → advance ordering
    - Mock `submitStepDataApi` with a delayed resolution and verify `currentStepIndex` does NOT increment until the mocked `refetch()` resolves
    - Confirm the ordering: submit resolves → refetch response received → step index increments
    - _Requirements: 26 AC-8_
    - **Property 2: Step Advances Only After Refetch**
    - **Validates: Requirements 26 AC-8**

- [x] 8. Add query invalidation after step submit
  - [x] 8.1 Call `invalidateQueries` in `useSubmitStepMutation.onSuccess`
    - In `onboarding.repository.impl.ts`, inside `useSubmitStepMutation`'s `onSuccess` callback, add `queryClient.invalidateQueries({ queryKey: onboardingKeys.status(tenantId) })`
    - **Tenant source:** Repository hooks cannot import Zustand stores directly (see architecture dependency rules in `design.md`). Therefore, `tenantId` must be passed as an argument from the call site (e.g., extend `useSubmitStepMutation` to accept `tenantId` as a parameter), rather than reading from `useAuthStore()` inside the repository hook.
    - Do not hard-code or inline a query key string
    - _Requirements: 27 AC-1_

  - [x]* 8.2 Write integration test for query invalidation
    - After a step submission succeeds, verify that a subsequent render of `SetupWizardFlow` using the refetched query shows the updated `per_step_validation[stepCode].status`
    - _Requirements: 27 AC-1, 27 AC-6_

- [x] 9. Checkpoint — submission ordering and invalidation complete
  - Focused submission and invalidation verification passed:
    `npm test -- --runInBand tests/onboarding/SetupWizardFlow.test.tsx tests/onboarding/onboarding.repository.test.tsx tests/onboarding/onboarding.api.test.ts`
    reported 3 passed suites and 16 passed tests.
  - Verified coverage includes duplicate submission lock, `Idempotency-Key` forwarding, stale callback guards, submit -> refetch -> advance ordering, and `onboardingKeys.status(tenantId)` invalidation.
  - Jest open-handle behavior remains baseline test-environment debt after the pass summary.

- [x] 10. Implement Android hardware back button intercept in `SetupWizardFlow`
  - [x] 10.1 Register `BackHandler` listener on mount
    - In `SetupWizardFlow.tsx`, add a `useEffect` that calls `BackHandler.addEventListener('hardwareBackPress', handler)` on mount and removes it via the returned cleanup on unmount
    - The handler must return `true` (consuming the event) on every press while the component is mounted, preventing the default OS back behaviour
    - _Requirements: 10 AC-3_

  - [x] 10.2 Navigate to previous step on back press (non-first step)
    - In the `BackHandler` handler, when `currentStepIndex > 0`, call the existing `handlePrevious` function to navigate to the previous wizard step
    - Do NOT call `router.back()` or any other navigation method — use only `handlePrevious`
    - _Requirements: 10 AC-1_

  - [x] 10.3 Consume event without navigation when on first step
    - In the `BackHandler` handler, when `currentStepIndex === 0`, return `true` without calling any navigation function; the wizard must NOT exit
    - _Requirements: 10 AC-2_

  - [x]* 10.4 Write unit tests for Android back button handling
    - Test that pressing back when on step > 0 calls `handlePrevious` and does not call `router.back()` or `router.replace()`
    - Test that pressing back when on step 0 does not navigate and does not exit the wizard
    - _Requirements: 10 AC-1, 10 AC-2, 10 AC-3_
    - **Property 4: Android Back Never Exits Wizard**
    - **Validates: Requirements 10 AC-3**

- [ ] 11. Tenant resolution and backend idempotency — verification tasks
  - Status: Implementation complete. Automated verification complete. Awaiting staging verification.

  | Acceptance Item | Planned | Already Implemented | Verified | Remaining |
  |---|---|---|---|---|
  | Authenticated tenant resolution | Verify `/auth/me` and tenant context for onboarding and live tenants. | `/auth/me` exposes `tenant_id`; frontend maps it to `tenantId`; backend path-tenant authorization resolves membership through `get_tenant_user_context` / `require_permission`. | VERIFIED_IN_CODE. Staging NOT_EXECUTED. | Staging verification for provisional and active tenants. |
  | Authoritative route tenant | Onboarding commands use explicit tenant route context. | Backend `submit_step_data` uses path `tenant_id` as idempotency scope tenant and service command tenant. | VERIFIED_IN_CODE and VERIFIED_IN_TEST. | Staging route/JWT/header behavior. |
  | Tenant isolation | Same idempotency key must not replay across tenants. | Platform scope includes tenant, actor, operation, and key; table unique constraint is `uq_tenant_idempotency_scope_key`. | VERIFIED_IN_CODE and VERIFIED_IN_TEST. | Staging replay check across tenants. |
  | Same key in different tenants | Same key may execute independently in different tenant scopes. | `PlatformIdempotencyService` and onboarding integration scope keys by tenant. | VERIFIED_IN_TEST. | Staging same-key cross-tenant confirmation. |
  | Operation isolation | Same key may execute independently for different operations. | Platform scope includes operation. | VERIFIED_IN_TEST. | None for implementation; staging confirmation before promotion. |
  | Onboarding step isolation | Same key may execute independently for different onboarding steps. | Operation identity is `onboarding.step_submit:{step_code}`. | VERIFIED_IN_CODE and VERIFIED_IN_TEST. | None for implementation; staging confirmation before promotion. |
  | Replay protection | Same key and same payload replay returns cached completed response without duplicate domain execution. | Platform service stores completed response body and onboarding route rehydrates `StepSubmissionResponse`. | VERIFIED_IN_CODE and VERIFIED_IN_TEST. | Staging same-key replay. |
  | Same key with different payload | Reusing a key with a different payload must conflict. | Request fingerprint includes route tenant, step code, and request body. | VERIFIED_IN_CODE and VERIFIED_IN_TEST. | None for implementation; staging confirmation before promotion. |
  | Concurrent duplicate request | Concurrent duplicate must not execute duplicate side effects. | Platform claim is atomic via unique scoped record; in-progress duplicate returns conflict. | VERIFIED_IN_CODE and VERIFIED_IN_TEST. | Staging/load-style retry check if feasible. |
  | Retry after timeout / retryable failure | Same key and same payload can retry after retryable failure. | Service marks transient failures as `FAILED_RETRYABLE` and can reclaim the same scoped key/fingerprint. | VERIFIED_IN_CODE and VERIFIED_IN_TEST. | Staging retry-after-timeout scenario. |
  | Missing-key compatibility | Existing clients without key preserve legacy behavior. | Onboarding route bypasses platform idempotency when `Idempotency-Key` is absent. | VERIFIED_IN_CODE and VERIFIED_IN_TEST. | None. |
  | `X-Tenant-ID` behavior | Verify JWT tenant or fallback header behavior. | Frontend retains `X-Tenant-ID` with `// TODO: Req 11`; backend onboarding route uses path tenant and does not trust the header for idempotency scope. | VERIFIED_IN_CODE and frontend API test; staging NOT_EXECUTED. | Staging mismatch/fallback verification before removing fallback. |
  | Cross-tenant rejection | Non-org-admin submitting another tenant's route must be rejected. | Onboarding service rejects non-org-admin when user tenant differs from route tenant; idempotency record remains scoped to route tenant. | VERIFIED_IN_CODE and VERIFIED_IN_TEST. | Staging cross-tenant rejection and replay attempt. |

  - [x] 11.0 Reconcile existing backend implementation and automated tests
    - Backend implementation evidence:
      `docs/adr/ADR-PF-001-reusable-request-idempotency.md`,
      `app/application/platform/idempotency_service.py`,
      `app/infrastructure/repositories/platform_idempotency_repository.py`,
      `app/infrastructure/db/models/platform_idempotency_record.py`,
      migration `20260712_000001_platform_idempotency_records.py`,
      `tenant_idempotency_records`, and
      `app/api/v1/routers/onboarding_router.py`.
    - Focused backend verification passed:
      `DATABASE_URL=postgresql+asyncpg:///novaclinics_test REDIS_URL=redis://localhost:6379/0 JWT_SECRET_KEY=test-secret .venv-idempotency/bin/pytest -q tests/test_platform_idempotency_service.py tests/test_onboarding_idempotency_integration.py`
      reported 12 passed tests.
    - Frontend API verification passed:
      `npm test -- --runInBand tests/onboarding/onboarding.api.test.ts`
      reported 1 passed suite and 2 passed tests for `Idempotency-Key` and `X-Tenant-ID` header behavior.

  - [ ] 11.1 Verify tenant resolution on staging
    - Inspect the JWT returned by `/auth/me` for both a PROVISIONAL tenant and a live tenant on the staging environment
    - Confirm `tenant_id` is present and non-null in both cases, OR confirm the `X-Tenant-ID` header fallback in `onboarding.api.ts` is working correctly on staging
    - If the backend fix (Req 11) has NOT been deployed: ensure `onboarding.api.ts` retains the `'X-Tenant-ID': tenantId` header and `console.warn` fallback with a `// TODO: Req 11` comment
    - If the backend fix HAS been deployed: remove the `X-Tenant-ID` workaround header from `onboarding.api.ts` and the `console.warn` fallback from `ChoiceScreen.tsx` (Req 11 AC-2, AC-3)
    - Record verification outcome in this task group before integration into `test`
    - _Requirements: 11 AC-1, 11 AC-2, 11 AC-3, 11 AC-4_

  - [ ] 11.2 Verify backend idempotency on staging
    - Send two identical `POST /api/v1/onboarding/{tenantId}/steps/{stepCode}` requests with the same `Idempotency-Key` UUID to the staging environment
    - Confirm: (a) the second response returns the cached result without creating a duplicate record; (b) the onboarding status query after both requests shows the step completed exactly once
    - Include same-key replay, retry after timeout, `X-Tenant-ID` mismatch, revoked membership, and cross-tenant replay attempt cases
    - If the backend does not yet honour the header in staging, record this as a P0 open item and block integration/promotion until confirmed
    - _Requirements: 12 AC-6_

- [ ] 12. Final checkpoint — all Progressive Experience production-hardening checkpoint blockers complete
  - Ensure all tests pass, ask the user if questions arise.
  - Confirm the release checklist in `design.md` is fully signed off: all 7 blockers verified, tenant resolution confirmed, idempotency confirmed.

---

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP; all core implementation tasks are mandatory.
- Tasks 11.1 and 11.2 are verification/validation tasks — they require manual confirmation on staging and recording results. No automated test can substitute for the staging environment check.
- All UI changes must use `useClinicTheme()` exclusively — zero hardcoded colours, spacing, font sizes, or border radii (except `flex`, `zIndex`, `minHeight: 44`, `minWidth: 44`, animation timing).
- The `submissionId` guard (task 6.2) and the `Idempotency-Key` (task 11.2) are complementary layers: `submissionId` prevents frontend double-dispatch; `Idempotency-Key` prevents backend duplicate records if a network retry reaches the server.
- No deferred items are in scope: WizardDraftStore, OfflineBanner, PendingMutationStore, Axios retry interceptor, conflict resolution modal, analytics, i18n, accessibility enhancements, payment recovery.

## Git Delivery Strategy

All future onboarding tasks in this plan must follow the Git Delivery Strategy recorded in `design.md`: start both repositories from latest `dev`, create paired frontend/backend onboarding feature branches, push those branches immediately, commit only reviewed onboarding files in logical groups, merge validated work into `test`, run integrated onboarding verification on `test`, then promote validated `test` to `dev`.

Multi-agent rule: one agent = one branch = one clean clone or worktree. Claude's Doctor Module work and Codex's Onboarding work must never share the same working folder. Unrelated Doctor Module files must not be staged, moved, committed, reset, or deleted.

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1"] },
    { "id": 1, "tasks": ["2.1", "3.1", "4"] },
    { "id": 2, "tasks": ["2.2", "3.2", "6.1", "6.2", "8.1"] },
    { "id": 3, "tasks": ["6.3", "7.1", "8.2"] },
    { "id": 4, "tasks": ["7.2", "10.1"] },
    { "id": 5, "tasks": ["10.2", "10.3"] },
    { "id": 6, "tasks": ["10.4", "11.1", "11.2"] }
  ],
  "notes": [
    "11.2 depends on 6.3: backend idempotency verification requires the Idempotency-Key header implementation (6.3) to be complete and deployed to staging before the staging verification in 11.2 can be executed."
  ]
}
```
