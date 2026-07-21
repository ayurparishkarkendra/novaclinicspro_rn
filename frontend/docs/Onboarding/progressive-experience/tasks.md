# Implementation Plan: Onboarding Production Hardening — Progressive Experience Production-Hardening Checkpoint

## Overview

Seven absolute release blockers, in delivery order. Each task maps directly to a design section in `design.md` and specific acceptance criteria in `requirements.md`. Deferred items (WizardDraftStore, OfflineBanner, PendingMutationStore, Axios retry, conflict resolution, analytics, i18n, accessibility, payment recovery) were excluded from the earlier production-hardening checkpoint. After Recovery Checkpoint R0 and completed production-hardening implementation groups, WizardDraftStore is now authorized only as the separate Progressive Experience implementation group defined below.

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

### Progressive Experience Phase 1

- [x] 13. Wizard Draft Persistence Hardening
  - Decision: `REQUIREMENT_5_IS_NEXT`
  - Status: Implementation complete. Focused verification complete. Ready for architectural review.
  - Objective: preserve incomplete onboarding form input across navigation and app restarts without allowing local draft state to become onboarding completion truth or leak across tenants/users.
  - Requirement trace: Requirement 5 AC-1 through AC-12; supporting architecture rules in Requirements 22, 23, 30, and 31; deferred design sections `Deferred Components (Post-Release)`, `Deferred Data Models (Post-Release)`, `Dependency Rules (Req 22, 23)`, `Deferred Data Flows (Post-Release)`, and `Deferred Tests (Post-Release)`.
  - Ownership boundary:
    - Frontend owns local unsaved draft state, persistence of incomplete form input, hydration, validation, migration, corrupt-data recovery, and safe discard/reset.
    - Frontend does not own backend completion truth, onboarding readiness, lifecycle state, activation eligibility, subscription truth, or server-side synchronization.
    - Draft persistence must never make a step appear complete unless backend onboarding status confirms completion.
  - Existing implementation findings:
    - Reuse and evolve `frontend/features/onboarding/presentation/stores/wizard.store.ts`; do not create a parallel draft store.
    - Current store persists `wizardData` under global key `wizard-storage` with `version: 0`; it is not tenant-scoped, has no exported `syncWizardDraftToStorage` / `hydrateWizardDraftFromStorage`, no unified `DraftEntry`, no migration function, no compression path, and no explicit corrupt-data recovery contract.
    - Current step screens use `useWizardStore` for temporary UI draft data; `ClinicProfileScreen` also calls `useWizardStore.getState()` directly and should be aligned with Requirement 22/23 where touched.
    - Existing test coverage: `frontend/tests/onboarding/wizard.store.test.ts` covers in-memory tenant switching only; persisted tenant/user isolation, schema migration, corrupt storage, compression, and reset storage removal are missing.
    - Backend impact: `UNKNOWN`; Requirement 5 is local draft persistence only and does not require backend schema or API changes.

  | Requirement 5 Item | Design Support | Existing Code | Gap | Dependency |
  |---|---|---|---|---|
  | Unified `DraftEntry` with `data`, `createdAt`, `lastSavedAt` | Deferred data models mention `DraftEntry`; Requirements 5 and 31 define fields. | `wizardData` stores raw per-step data only. | Add unified draft entry model. | None. |
  | Zustand state slice with synchronous actions only | Dependency rules and Requirement 22. | `useWizardStore` has synchronous actions, but custom persistence wrapper performs async side effects. | Separate synchronous slice from exported async storage functions. | Preserve existing callers or migrate them intentionally. |
  | `immer` and `subscribeWithSelector` middleware | Requirement 22; design says match auth-store conventions. | Store uses plain Zustand; package has Zustand, but `immer` is not a declared direct dependency. | Add/confirm dependency and middleware application. | Package dependency decision for `immer`. |
  | Tenant/user-scoped AsyncStorage key | Requirement 5 AC-4 and Requirement 30. | Global key `wizard-storage`; in-memory tenant reset only. | Implement `@novaclinics/{tenantId}/wizard_draft_v1` and fallback `@novaclinics/user_{userId}/wizard_draft_v1`. | Auth store tenant/user access. |
  | Safe hydration | Requirement 5 AC-5 and AC-6. | Custom middleware hydrates automatically and logs warning on error. | Add explicit `hydrateWizardDraftFromStorage()` with parse validation, migration, corrupt-entry removal, and no throw. | None. |
  | Storage sync | Requirement 5 AC-4, AC-7, AC-8. | Custom middleware persists on every set with no size/compression contract. | Add explicit `syncWizardDraftToStorage()` with size guard, compression, and recoverable errors. | `lz-string` dependency; telemetry path. |
  | Migration `v0 -> v1` | Requirement 5 AC-12. | Persisted payload writes `{ state, version: 0 }`. | Add `migrateDraft()` and `DraftMigrationError`; migrate split/raw legacy payloads where possible. | Existing global key compatibility decision. |
  | Selectors | Requirement 5 AC-9 and AC-10. | `getStepData` action exists; no pure selectors. | Export pure `selectStepDraft(stepCode)` and `selectStepDraftLastSavedAt(stepCode)`. | None. |
  | Reset removes persisted entry | Requirement 5 AC-11 and Requirement 30. | `resetWizard()` resets memory only. | Remove tenant/user-scoped persisted entry during reset/exported cleanup path. | Auth store identity available at reset time. |
  | Draft expiry | Requirement 31. | None. | Add per-step expiry during hydration only if included in this group. | Remote config override is `OPEN_DECISION`; no verified remote config path in current audit. |
  | Telemetry for storage failure/expiry | Requirement 5 AC-7/AC-8 and Requirement 31 AC-3. | No verified onboarding telemetry utility; analytics feature is reporting UI/API, not an event emitter. | `OPEN_DECISION`: either add a minimal approved event utility or record console-only fallback before implementation. | Requirement 28 architecture decision. |

  - [x] 13.1 Inventory and compatibility plan
    - Document the current persisted payload shape for `wizard-storage` (`{ state: { tenantId, wizardData }, version: 0 }`) and any observed test fixtures.
    - Decide whether implementation must migrate the global legacy key, ignore it, or safely discard it after tenant-scoped storage is introduced.
    - Confirm whether `financials_and_tax` and `payment_setup` draft data are safe for AsyncStorage under Requirement 19; exclude sensitive fields if needed.
    - Resolve `OPEN_DECISION` items for telemetry and draft expiry remote-config override before code changes.
    - Outcome: legacy `wizard-storage` v0 payloads are migrated only when identity validation is safe; scoped v1 keys are tenant/user/version based. No card/token data is stored by `financials_and_tax` or `payment_setup`; stored values remain local form settings. Telemetry uses the existing console event pattern because no dedicated onboarding event emitter exists. Draft expiry uses the documented default constant; no verified remote-config provider exists in the current codebase.
    - _Requirements: 5 AC-4, 5 AC-5, 5 AC-7, 5 AC-8, 5 AC-12, 19 AC-3, 31 AC-4_

  - [x] 13.2 Refactor existing wizard store schema
    - Evolve `frontend/features/onboarding/presentation/stores/wizard.store.ts` into the Requirement 5 draft schema without creating a second store.
    - Add `version`, `stepDrafts`, `setStepDraft`, `clearStepDraft`, and `reset` using unified `DraftEntry`.
    - Preserve existing callers through intentional adapter methods only where needed during migration; avoid dead duplicate state.
    - Apply Zustand `immer` and `subscribeWithSelector` middleware per Requirement 22.
    - Outcome: the existing `useWizardStore` now owns a v1 `stepDrafts` schema, keeps adapter methods for existing step screens, and uses `subscribeWithSelector` plus an Immer-backed state updater.
    - _Requirements: 5 AC-1, 5 AC-2, 5 AC-3, 22 AC-1, 22 AC-2_

  - [x] 13.3 Add scoped storage identity and explicit persistence functions
    - Export `syncWizardDraftToStorage()` and `hydrateWizardDraftFromStorage()` as standalone async functions.
    - Use tenant-scoped key `@novaclinics/{tenantId}/wizard_draft_v1`; fall back to `@novaclinics/user_{userId}/wizard_draft_v1` with `console.warn` when tenant ID is unavailable.
    - Keep storage reads/writes out of Zustand synchronous actions.
    - Outcome: storage is scoped by tenant, user, and schema version. `SetupWizardFlow` hydrates drafts on mount and debounces explicit storage sync from the existing store.
    - _Requirements: 5 AC-4, 22 AC-2, 30 AC-1, 30 AC-4_

  - [x] 13.4 Add safe hydration, migration, and corrupt-data handling
    - Validate parsed persisted data before restoring to memory.
    - Export `migrateDraft(fromVersion, toVersion, payload)` and `DraftMigrationError`.
    - Implement `v0 -> v1` migration for legacy split/raw draft payloads where data can be safely mapped.
    - Discard unsupported versions or corrupt payloads without throwing, log the error/warning, and remove the bad persisted entry.
    - Outcome: corrupt and incompatible scoped drafts are removed without crashing onboarding. Legacy v0 raw/split payloads migrate to unified `DraftEntry` where safe.
    - _Requirements: 5 AC-5, 5 AC-6, 5 AC-12_

  - [x] 13.5 Add size guard, compression, and recoverable sync errors
    - Define `MAX_DRAFT_SIZE_KB`.
    - Before persistence, compute serialized payload size.
    - Use `lz-string` `compressToUTF16` / `decompressFromUTF16` for oversized payloads.
    - If compressed payload is still too large or storage fails, log recoverably and emit the approved storage-failure event path.
    - Outcome: `immer` and `lz-string` are declared package dependencies. Oversized payloads are compressed; still-oversized or failed writes log and emit the console event path without throwing.
    - _Requirements: 5 AC-7, 5 AC-8_

  - [x] 13.6 Add tenant/user isolation and reset behavior
    - Ensure hydrate reads only the active tenant/user scoped key.
    - Ensure `reset()` clears memory and removes only the active scoped persisted entry.
    - Add logout/tenant-switch cleanup only if it can be done within existing auth/onboarding boundaries without changing lifecycle truth.
    - Outcome: hydrate validates tenant/user identity, tenant changes reset in-memory drafts, `resetWizardDraftStorage()` removes current scoped storage, and auth logout calls `clearWizardDraftStorageForIdentity()` before clearing local session.
    - _Requirements: 5 AC-11, 30 AC-1, 30 AC-2, 30 AC-3, 30 AC-5, 30 AC-7_

  - [x] 13.7 Add focused tests
    - Store schema: `setStepDraft` preserves `createdAt` and updates `lastSavedAt`.
    - Persistence round trip: `syncWizardDraftToStorage()` -> `reset()` -> `hydrateWizardDraftFromStorage()` restores the original valid `stepDrafts`.
    - Tenant isolation: tenant A drafts never hydrate under tenant B; fallback user key is isolated.
    - Corrupt storage: hydration logs/removes corrupt entry and leaves empty drafts without throwing.
    - Migration: supported `v0 -> v1` payload migrates to unified `DraftEntry`; unsupported versions discard safely.
    - Size/compression: oversized payload uses compression; still-oversized payload skips write and reports approved failure event.
    - Reset/logout: scoped storage entry is removed without touching other tenants.
    - Outcome: `frontend/tests/onboarding/wizard.store.test.ts` covers 12 focused draft persistence, migration, isolation, compression, and cleanup scenarios.
    - _Requirements: 5 AC-3 through AC-12, 15 AC-3, 15 AC-4, 30 AC-5, 30 AC-7_

  - [x] 13.8 Documentation and stop gate
    - Update this task group with implementation evidence, focused verification commands, and any resolved `OPEN_DECISION` outcomes.
    - Run `git diff --check`, focused `wizard.store` tests, and TypeScript verification for modified files if available.
    - Commit and push only reviewed files.
    - Stop for architectural review before beginning Requirement 6 step-screen integration.
    - Verification:
      - `npm test -- --runInBand tests/onboarding/wizard.store.test.ts` passed: 1 suite, 12 tests.
      - `npm test -- --runInBand tests/onboarding/SetupWizardFlow.test.tsx tests/onboarding/wizard.store.test.ts` passed: 2 suites, 25 tests.
      - `./node_modules/.bin/tsc --noEmit --pretty false` still fails on existing baseline app-wide TypeScript debt; no Task Group 13 touched-file TypeScript errors remain.

  - Acceptance criteria:
    - Incomplete per-step drafts survive app restart for the same tenant/user.
    - Drafts do not hydrate across tenants, users, logout, or tenant switching.
    - Hydration never crashes on corrupt, unsupported, or oversized stored data.
    - Draft metadata is co-located with draft data and uses Unix millisecond timestamps.
    - Local draft state remains temporary input recovery only and does not mark onboarding steps complete.
    - Focused tests cover persistence, migration, corruption recovery, tenant/user isolation, and reset cleanup.

  - Likely frontend files:
    - `frontend/features/onboarding/presentation/stores/wizard.store.ts`
    - `frontend/tests/onboarding/wizard.store.test.ts`
    - `frontend/features/onboarding/presentation/pages/SetupWizardFlow.tsx`
    - `frontend/features/onboarding/presentation/pages/steps/ClinicProfileScreen.tsx`
    - `frontend/features/onboarding/presentation/pages/steps/BillingSetupScreen.tsx`
    - `frontend/features/onboarding/presentation/pages/steps/PaymentSetupScreen.tsx`
    - `frontend/package.json`
    - `frontend/package-lock.json`
    - `frontend/yarn.lock`

  - Likely backend files:
    - `UNKNOWN`

  - Non-goals:
    - Offline mutation queue.
    - `PendingMutationStore`.
    - Backend draft synchronization.
    - Backend completion/readiness/lifecycle changes.
    - Activation eligibility or subscription policy changes.
    - Conflict resolution modal and `updated_at` backend contract.
    - Broad wizard rewrite.
    - Staging tenant/idempotency verification from Task 11.

### Progressive Experience Planning Reconciliation — Task Group 14

Outcome:

```text
TASK_GROUP_14_READY
```

Requirement 6 is the next valid implementation group. It depends on Task Group 13's v1 draft schema, explicit persistence, tenant/user isolation, and safe hydration. It is accepted in `requirements.md`, has sufficient support in the deferred design sections and dependency rules, has clear frontend ownership, can be implemented incrementally, and does not depend on Task 11 staging verification for implementation.

#### Requirements Coverage Matrix

| Requirement | Current Task Group | Implementation Status | Evidence | Remaining Gap |
|---|---|---|---|---|
| Req 1 - StepDetailScreen alias routing | 1, 2, 5 | COMPLETE | `stepAliases.ts`, `StepDetailScreen.tsx`, `StepDetailScreen.test.tsx`, Task 5 evidence. | Staging/template drift only if backend adds new aliases. |
| Req 2 - SetupWizardFlow alias routing | 1, 3, 5 | COMPLETE | `SetupWizardFlow.tsx`, `SetupWizardFlow.test.tsx`, Task 5 evidence. | None for current alias list. |
| Req 3 - Delete unused Treatments screen | 4, 5 | COMPLETE | `TreatmentsAndTherapiesScreen.tsx` absent; Task 5 evidence. | None. |
| Req 4 - Backend template alias audit | 1, 5 | PARTIALLY_IMPLEMENTED | `SERVICE_CATALOGUE_ALIASES` records audited aliases. | Re-run active-template audit before release if backend templates change. |
| Req 5 - WizardDraftStore schema/persistence | 13 | COMPLETE | `wizard.store.ts`, `wizard.store.test.ts`, Task 13 evidence. | Future Journey Versioning key review only. |
| Req 6 - WizardDraftStore step-screen integration | 14 | PARTIALLY_IMPLEMENTED | `ClinicProfileScreen`, `BillingSetupScreen`, and `PaymentSetupScreen` use `useWizardStore`; Task 13 store exists. | Consistent `setStepDraft`, debounce, restore indicator, clear-on-submit, and all required screens. |
| Req 7 - OfflineBanner | None | NOT_STARTED | No `OfflineBanner.tsx`; no NetInfo dependency found. | Define after draft step integration or with offline group. |
| Req 8 - Offline CTA gating and mutation flush | None | NOT_STARTED | No `PendingMutationStore`; no NetInfo integration; no retry queue. | Requires offline architecture and analytics/error decisions. |
| Req 9 - App lifecycle background/foreground | 13 partial | PARTIALLY_IMPLEMENTED | `SetupWizardFlow` hydrates drafts on mount. | AppState background sync, foreground hydration/refetch, step-update notice. |
| Req 10 - Android back button intercept | 10 | PARTIALLY_IMPLEMENTED | `SetupWizardFlow` consumes hardware back and tests pass. | Draft save/sync before previous-step navigation now depends on Req 6 integration. |
| Req 11 - Tenant identity fix | 11 | STAGING_ONLY | Code paths verified; Task 11 staging checks remain open. | Provisional/live/multi-clinic staging verification. |
| Req 12 - Idempotency keys | 6, 11 | PARTIALLY_IMPLEMENTED | Frontend step submit key, backend platform idempotency, focused tests. | Complete setup idempotency and staging replay checks. |
| Req 13 - Demo/live transition hooks | None | PARTIALLY_IMPLEMENTED | `DemoStatusBanner.tsx` and tests exist. | Repository hooks, pending/loading behavior, errors, navigation contract. |
| Req 14 - Theme compliance | Cross-cutting | PARTIALLY_IMPLEMENTED | Existing completed groups used theme checks where touched. | Must be enforced for each new UI group. |
| Req 15 - Test coverage | Cross-cutting | PARTIALLY_IMPLEMENTED | Focused tests exist for Groups 1-10 and 13. | Offline, step draft integration, conflict, and E2E tests remain. |
| Req 16 - Draft conflict modal | None | NOT_STARTED | No `DraftConflictModal`; no conflict UI. | Depends on Req 6 and reliable Req 29 contract/fallback. |
| Req 17 - Multi-device validation | None | NOT_STARTED | No multi-device conflict flow. | Depends on Req 16 and backend timestamp contract. |
| Req 18 - Pending payment recovery | None | NOT_STARTED | No pending-verification API wrapper or recovery banner. | Requires subscription/payment scope decision. |
| Req 19 - Storage security audit | 13 partial | PARTIALLY_IMPLEMENTED | Task 13 assessed current draft data safety. | Full AsyncStorage vs SecureStore audit remains. |
| Req 20 - Error message centralisation | None | NOT_STARTED | No onboarding error mapper found. | Needs design of localization/error mapping boundary. |
| Req 21 - Zero hardcoded design values | Cross-cutting | PARTIALLY_IMPLEMENTED | Applied where previous groups touched UI. | Grep/review required for every new UI task. |
| Req 22 - Zustand architecture | 13 partial | PARTIALLY_IMPLEMENTED | Wizard store refactor and tests. | Full architecture audit across future stores remains. |
| Req 23 - Hook/service architecture | Cross-cutting | PARTIALLY_IMPLEMENTED | Existing repository/data/presentation boundaries. | Review required for each new task. |
| Req 24 - Internationalisation coverage | R0, cross-cutting | PARTIALLY_IMPLEMENTED | Hindi Progressive Experience keys completed in R0. | New user-visible strings need `en-US` and `hi-IN` keys. |
| Req 25 - Accessibility | Cross-cutting | PARTIALLY_IMPLEMENTED | Existing CTA disabled states in completed groups. | New indicators/banners/modals need explicit accessibility coverage. |
| Req 26 - Duplicate submission locking | 6, 7, 9 | PARTIALLY_IMPLEMENTED | Step submission lock, stale callback guard, submit/refetch ordering tests. | Complete/go-live/demo transition pending states remain. |
| Req 27 - Query invalidation | 8, 9 | PARTIALLY_IMPLEMENTED | Submit-step status invalidation implemented and tested. | Complete/demo/transition invalidation remains. |
| Req 28 - Analytics/audit events | 13 partial | PARTIALLY_IMPLEMENTED | Draft storage failure/expiry uses console event path. | Structured analytics utility and full event list remain. |
| Req 29 - Backend `updated_at` contract | None | OPEN_DECISION | Frontend DTO includes `updated_at`; backend/staging contract not verified here. | Backend contract and conflict fallback design. |
| Req 30 - Tenant-scoped storage | 13 partial | PARTIALLY_IMPLEMENTED | Draft tenant/user scoped keys and cleanup tests. | Pending mutation store isolation remains. |
| Req 31 - Draft expiry | 13 partial | PARTIALLY_IMPLEMENTED | `DRAFT_EXPIRY_DAYS`, hydration expiry, and focused tests. | Remote-config override remains an open future decision. |
| Req 32 - End-to-end release verification | 11, 12 | STAGING_ONLY | Release checklist documented. | Runs A-D and staging sign-off remain blocked by environment/access. |

#### Candidate Area Review

| Candidate Area | Requirement Support | Design Support | Ownership Clear? | Dependencies Complete? | Decision |
|---|---|---|---|---|---|
| Wizard draft step-screen integration | Req 6; supports Req 10 AC-1 and future Req 16 | Deferred data flows, dependency rules, Task 13 store contract | Yes - frontend presentation + existing wizard store | Yes - Task 13 complete | SELECTED for Task Group 14 |
| OfflineBanner | Req 7, 15, 21, 24, 25 | Deferred component only | Mostly frontend | Partially - benefits from Req 6 first so offline changes preserve current step state | Defer until after Req 6 |
| PendingMutationStore/offline flush | Req 8, 30 | Deferred data models/flows only | Frontend store plus API retry behavior | No - needs offline banner, analytics/error decisions | Defer |
| App lifecycle | Req 9 | Deferred flow only | Frontend presentation + draft store | Partial - needs Req 6 current-step state integration | Defer until after Req 6 |
| Draft conflict modal | Req 16, 17, 25, 29 | Deferred component and DTO note | Frontend plus backend status contract | No - needs reliable step data integration and Req 29 decision | Defer |
| Demo/live transition wiring | Req 13, 26, 27 | Existing banner/component only, insufficient flow design | Frontend + subscription policy | Partial - subscription endpoint/extend-demo behavior unclear | Needs design clarification |
| Pending payment recovery | Req 18 | Requirement allows deferral to subscription spec | Frontend + subscription/payment | No - subscription/payment scope decision missing | Needs design clarification |
| Error centralisation | Req 20 | Deferred error handling only | Cross-cutting frontend | No - error mapping utility path/design unclear | Needs design clarification |
| Analytics/audit events | Req 28 | Deferred analytics stub note only | Core/frontend telemetry | No - event utility/provider decision missing | Needs design clarification |
| Backend `updated_at` contract | Req 29 | Design explicitly deferred | Backend + frontend DTO | No - backend contract/staging not verified | Defer |
| End-to-end release verification | Req 32 | Release checklist | Release/UAT | No - staging/device access required | Staging only |

#### Task 13 Follow-Up Mapping

Future Journey Versioning must not reuse draft schema versioning. When a future Journey Versioning task group is defined, it must include an acceptance item to review draft identity conceptually as:

```text
tenantId + userId + journeyVersion + draftSchemaVersion
```

The current Task 13 guarantees remain unchanged:

- fallback user drafts must not migrate to the wrong tenant;
- reset and logout cleanup remain scoped to the current tenant/user identity;
- local drafts never become completion truth.

Do not reopen Task Group 13 for this follow-up.

- [x] 14. Wizard Draft Step Screen Integration
  - This item was outside the earlier production-hardening checkpoint and is now authorized as a separate Progressive Experience implementation group.

  ## Objective

  Persist and restore actual per-step form input through the v1 draft store across all required onboarding step screens, while keeping backend onboarding status as the only completion truth.

  ## Requirement Traceability

  - Requirement 6 AC-1 through AC-5.
  - Requirement 10 AC-1 for saving current draft state before Android back navigation.
  - Requirement 14 AC-2 for restored-draft inline notice styling.
  - Requirement 15 AC-3 and AC-4 for draft tests where applicable.
  - Requirement 21 AC-1 for no hardcoded style values in modified UI.
  - Requirement 22 AC-4 and AC-5 for store subscription/use boundaries.
  - Requirement 23 AC-4 for presentation orchestration.
  - Requirement 24 AC-1, AC-2, AC-4 for new user-visible copy.
  - Requirement 25 AC-4 for disabled/restored-state accessibility where touched.

  ## Design Traceability

  - `design.md` deferred data flows for draft lifecycle.
  - `design.md` dependency rules for stores, presentation hooks, repositories, and components.
  - `design.md` theme compliance.
  - `tasks.md` Task Group 13 store contract and evidence.

  ## Ownership

  - Owning layer: frontend onboarding presentation layer.
  - Collaborating module: existing onboarding wizard store at `frontend/features/onboarding/presentation/stores/wizard.store.ts`.
  - Must not own backend completion truth, onboarding readiness, lifecycle state, activation eligibility, subscription policy, or server-side synchronization.
  - Must not create another wizard/draft store.

  ## Dependencies

  - Recovery Checkpoint R0: complete.
  - Task Groups 1-10: complete.
  - Task 11.0 implementation and automated verification: complete.
  - Task Group 13: complete; v1 draft schema, scoped storage, safe hydration, migration, expiry, and focused tests are available.
  - Task 11.1 and 11.2 staging checks remain release blockers only; they do not block Task 14 implementation.

  ## Existing Assets to Reuse

  - `frontend/features/onboarding/presentation/stores/wizard.store.ts`
  - `frontend/features/onboarding/presentation/pages/SetupWizardFlow.tsx`
  - `frontend/features/onboarding/presentation/pages/steps/ClinicProfileScreen.tsx`
  - `frontend/features/onboarding/presentation/pages/steps/OperatingHoursScreen.tsx`
  - `frontend/features/onboarding/presentation/pages/steps/TreatmentRoomsScreen.tsx`
  - `frontend/features/onboarding/presentation/pages/steps/StaffSetupScreen.tsx`
  - `frontend/features/onboarding/presentation/pages/steps/BillingSetupScreen.tsx`
  - `frontend/features/onboarding/presentation/pages/steps/PaymentSetupScreen.tsx`
  - `frontend/tests/onboarding/SetupWizardFlow.test.tsx`
  - `frontend/tests/onboarding/wizard.store.test.ts`
  - `frontend/core/localization/translations/en-US.json`
  - `frontend/core/localization/translations/hi-IN.json`

  ## Tasks

  - [x] 14.1 Inventory current step-screen draft behavior
    - Confirm which required screens already call `useWizardStore` and which do not.
    - Record existing submit handlers, restore paths, and server-data fetch behavior.
    - Confirm no screen treats a local draft as completion state.

  - [x] 14.2 Add a reusable presentation helper for step drafts if it reduces duplication
    - Prefer a small hook/helper only if it removes repeated debounce/restore/clear logic.
    - Keep it in the onboarding presentation boundary.
    - Do not move API or React Query behavior into the store.

  - [x] 14.3 Integrate draft save/restore in required step screens
    - Cover `ClinicProfileScreen`, `OperatingHoursScreen`, `TreatmentRoomsScreen`, `StaffSetupScreen`, `BillingSetupScreen`, and `PaymentSetupScreen`.
    - Save current form state through `setStepDraft(stepCode, currentFormState)` with approximately 500 ms debounce.
    - Restore drafts only when server-side data for that step is absent or stale.
    - Do not restore drafts for completed server steps unless a future conflict-resolution group explicitly authorizes it.

  - [x] 14.4 Clear drafts after successful submission
    - After each step's successful submit, call `clearStepDraft(stepCode)` and persist the resulting store state.
    - Preserve current `onSuccess` and wizard navigation behavior.
    - Do not mark a step complete locally.

  - [x] 14.5 Add restored-draft inline indicator
    - Add localized copy for "Restored unsaved changes" in English and Hindi.
    - Use `useClinicTheme()` values only.
    - Indicator is non-dismissible and clears when the user edits the form or submits.
    - Include accessibility state/role only where appropriate for the existing UI pattern.

  - [x] 14.6 Save current draft before Android back previous-step navigation
    - Ensure the registered current-step save handler or equivalent draft sync runs before `handlePrevious` changes step.
    - Preserve the existing guarantee that Android hardware back never exits the wizard.

  - [x] 14.7 Focused tests
    - Unit/integration tests for draft restore and clear-on-submit for representative screens.
    - Verify restored indicator behavior.
    - Verify a completed backend step is not overridden by a local draft.
    - Verify Android back saves/syncs current draft before moving to the previous step.
    - Keep existing Task 13 store tests passing.

  - [x] 14.8 Documentation and stop gate
    - Update Task Group 14 evidence and verification commands in this file.
    - Run `git diff --check`, focused onboarding tests, and TypeScript verification for touched files where applicable.
    - Commit and push only reviewed files.
    - Stop for architectural review before any offline or conflict-resolution work.

  ## Acceptance Criteria

  - Required step screens save incomplete form data into the v1 draft store.
  - Drafts restore only for the same tenant/user and only when backend data is absent or stale.
  - Successful submit clears the corresponding local draft.
  - Restored-draft UI is localized, theme-compliant, and does not block interaction.
  - Android back to a previous step preserves current local edits before navigation.
  - Local drafts never mark onboarding steps complete.

  ## Likely Files

  - `frontend/features/onboarding/presentation/pages/SetupWizardFlow.tsx`
  - `frontend/features/onboarding/presentation/pages/steps/ClinicProfileScreen.tsx`
  - `frontend/features/onboarding/presentation/pages/steps/OperatingHoursScreen.tsx`
  - `frontend/features/onboarding/presentation/pages/steps/TreatmentRoomsScreen.tsx`
  - `frontend/features/onboarding/presentation/pages/steps/StaffSetupScreen.tsx`
  - `frontend/features/onboarding/presentation/pages/steps/BillingSetupScreen.tsx`
  - `frontend/features/onboarding/presentation/pages/steps/PaymentSetupScreen.tsx`
  - `frontend/features/onboarding/presentation/stores/wizard.store.ts`
  - `frontend/tests/onboarding/SetupWizardFlow.test.tsx`
  - `frontend/tests/onboarding/wizard.store.test.ts`
  - `frontend/core/localization/locales/en-US.json`
  - `frontend/core/localization/locales/hi-IN.json`

  Backend files: `UNKNOWN`; no backend change is expected for Task Group 14.

  ## Tests

  - Focused step-screen tests for save/restore/clear behavior.
  - `SetupWizardFlow` integration test for Android back draft save before previous-step navigation.
  - Existing Task Group 13 wizard store tests.
  - TypeScript verification for touched files if available.

  ## Migration Fixtures

  Reuse the migration-fixture concepts for:

  - onboarding/provisional tenant with `tenant_id` available or fallback user identity;
  - live tenant with tenant-scoped draft keys;
  - tenant switching without draft leakage;
  - Hindi localization key audit for new restored-draft copy.

  No database migration is authorized.

  ## Localization

  - No hardcoded user-facing strings.
  - Add restored-draft indicator keys to English and Hindi locale files.
  - Preserve interpolation parity if interpolation is introduced.

  ## Non-Goals

  - Offline banner.
  - Pending mutation queue.
  - Axios retry interceptor.
  - Draft conflict modal.
  - Backend `updated_at` contract.
  - Multi-device conflict resolution.
  - Analytics beyond existing Task 13 draft-store event path.
  - Payment recovery.
  - Subscription/demo transition policy.
  - Staging tenant/idempotency verification.
  - Journey Versioning or journey-aware draft keys.

  ## Stop Gate

  After implementation: focused verification, canonical docs update, commit, push, architectural review, and no automatic continuation.

  ## Completion Evidence

  - Reused the Task Group 13 v1 `wizard.store.ts` schema, tenant/user scoped hydration, persistence, migration, cleanup, and expiry behavior.
  - Added `clearStepDraftAndSync(stepCode)` to clear only the completed step draft and immediately persist the updated store.
  - Added `RestoredDraftIndicator` as a localized, theme-based presentation component.
  - Integrated draft save/restore/clear behavior in `ClinicProfileScreen`, `OperatingHoursScreen`, `TreatmentRoomsScreen`, `StaffSetupScreen`, `BillingSetupScreen`, and `PaymentSetupScreen`.
  - Updated `SetupWizardFlow` so Android previous-step navigation awaits draft storage sync before changing steps and go-live completion clears all wizard drafts.
  - Added English and Hindi restored-draft keys in the actual translation files under `frontend/core/localization/translations/`.
  - Focused verification passed:
    - `git diff --check`
    - `npx jest tests/onboarding/wizard.store.test.ts tests/onboarding/SetupWizardFlow.test.tsx tests/onboarding/PaymentSetupScreen.draft.test.tsx --runInBand`
  - TypeScript verification was executed with `npx tsc --noEmit`; Task Group 14 touched onboarding files had no reported TypeScript errors after filtering, while the full command still reports unrelated baseline failures in existing non-Task-14 files.

---

### Progressive Experience Planning Reconciliation — Task Group 15

Outcome:

```text
TASK_GROUP_15_READY
```

Task Group 15 selects Requirement 9 because Task Group 14 has completed per-step draft integration, giving `SetupWizardFlow` a reliable in-memory draft state to flush when the app backgrounds. This is the smallest dependency-correct increment after draft persistence: it improves real user data safety, uses existing React Native `AppState`, does not require new platform work, and does not require reopening completed routing, idempotency, tenant, or draft-store architecture.

#### Updated Requirements Coverage Matrix

| Requirement | Current Task Group | Implementation Status | Repository Evidence | Remaining Gap |
|---|---|---|---|---|
| Req 1 - StepDetailScreen alias routing | 1, 2, 5 | COMPLETE | `stepAliases.ts`, `StepDetailScreen.tsx`, `StepDetailScreen.test.tsx`. | Active-template drift audit before release if templates change. |
| Req 2 - SetupWizardFlow alias routing | 1, 3, 5 | COMPLETE | `SetupWizardFlow.tsx`, `SetupWizardFlow.test.tsx`. | None for current alias list. |
| Req 3 - Delete unused Treatments screen | 4, 5 | COMPLETE | `TreatmentsAndTherapiesScreen.tsx` remains absent. | None. |
| Req 4 - Backend template alias audit | 1, 5 | PARTIALLY_IMPLEMENTED | Shared alias constant records audited service aliases. | Re-run active-template audit before release if backend templates change. |
| Req 5 - WizardDraftStore schema/persistence | 13 | COMPLETE | `wizard.store.ts`, `wizard.store.test.ts`, Task 13 evidence. | Future Journey Versioning key review only. |
| Req 6 - WizardDraftStore step-screen integration | 14 | COMPLETE | Task 14 commit `0ffb72e6`; required step screens save/restore/clear local drafts. | No implementation gap; release still depends on integrated verification. |
| Req 7 - OfflineBanner | Future | NOT_STARTED | No `OfflineBanner.tsx`; no NetInfo usage; `@react-native-community/netinfo` is not declared in `frontend/package.json`. | Add dependency and component in a later offline-specific group. |
| Req 8 - Offline CTA gating and mutation flush | Future | NOT_STARTED | No `PendingMutationStore`; no retry queue; no NetInfo integration. | Requires offline architecture, pending mutation storage, retry/error decisions. |
| Req 9 - App lifecycle background/foreground | 15 | PARTIALLY_IMPLEMENTED | `SetupWizardFlow` hydrates drafts on mount; Task 14 saves active form drafts. | Add `AppState` background sync, foreground hydrate/refetch, and updated-steps notice. |
| Req 10 - Android back button intercept | 10, 14 | COMPLETE | `SetupWizardFlow` consumes hardware back; Task 14 awaits draft storage sync before previous-step navigation. | None for current scope. |
| Req 11 - Tenant identity fix | 11 | STAGING_ONLY | Code and automated tests verified; staging checklist remains open. | Provisional/live/multi-clinic staging verification. |
| Req 12 - Idempotency keys | 6, 11 | PARTIALLY_IMPLEMENTED | Frontend step submit key; backend platform idempotency and focused tests. | Staging same-key replay and tenant replay checks. |
| Req 13 - Demo/live transition hooks | Future | PARTIALLY_IMPLEMENTED | `DemoStatusBanner.tsx`, `DemoStatusBanner.test.tsx`, demo/live repository hooks exist. | `SetupWizardFlow` wiring, loading/error states, navigation contract. |
| Req 14 - Theme compliance | Cross-cutting | PARTIALLY_IMPLEMENTED | Completed groups use theme where touched; hardcoded baseline values remain in older screens. | Grep/review for every new UI group. |
| Req 15 - Test coverage | Cross-cutting | PARTIALLY_IMPLEMENTED | Focused tests exist for Groups 1-10, 13, and 14. | Req 7-9, 13, 16, 18, 20, 28, E2E coverage remains. |
| Req 16 - Draft conflict modal | Future | NOT_STARTED | No `DraftConflictModal`; no conflict UI. | Depends on Req 9 foreground resume and Req 29 contract/fallback decision. |
| Req 17 - Multi-device validation | Future | NOT_STARTED | No multi-device conflict flow. | Depends on conflict design and reliable status timestamp handling. |
| Req 18 - Pending payment recovery | Future | NOT_STARTED | No pending-verification API wrapper or recovery banner. | Requires subscription/payment scope decision. |
| Req 19 - Storage security audit | 13 partial | PARTIALLY_IMPLEMENTED | Draft storage data safety assessed in Task 13. | Full AsyncStorage vs SecureStore audit remains. |
| Req 20 - Error message centralisation | Future | NOT_STARTED | `core/hooks/useApiErrorHandler.ts` exists, but onboarding screens still show raw `error.message` in catch paths. | Define onboarding error mapper boundary and localization keys. |
| Req 21 - Zero hardcoded design values | Cross-cutting | PARTIALLY_IMPLEMENTED | New Task 14 indicator uses theme values. | Existing onboarding screens still need per-task grep/backfill where touched. |
| Req 22 - Zustand architecture | 13, 14 | PARTIALLY_IMPLEMENTED | Wizard store uses synchronous actions plus standalone storage helpers; Task 14 added store helper only. | Audit remains for future stores such as pending mutations. |
| Req 23 - Hook/service architecture | Cross-cutting | PARTIALLY_IMPLEMENTED | Repository hooks and datasource boundaries exist. | Review required for each new task; several legacy screens still call datasources directly. |
| Req 24 - Internationalisation coverage | R0, 14 | PARTIALLY_IMPLEMENTED | Hindi Progressive Experience keys completed; Task 14 added English/Hindi restored-draft key. | New user-visible strings need English/Hindi keys. |
| Req 25 - Accessibility | Cross-cutting | PARTIALLY_IMPLEMENTED | Existing CTA disabled states and Task 14 indicator accessibility role. | Offline/conflict/payment banners need explicit accessibility coverage. |
| Req 26 - Duplicate submission locking | 6, 7, 9, 13 partial | PARTIALLY_IMPLEMENTED | Step submission lock, stale callback guard, and submit/refetch ordering tests exist. | Demo/live transition pending states remain. |
| Req 27 - Query invalidation | 8, 9, 13 partial | PARTIALLY_IMPLEMENTED | Submit and complete setup invalidation hooks exist. | Demo extend/transition invalidation and session refresh remain. |
| Req 28 - Analytics/audit events | Future | PARTIALLY_IMPLEMENTED | Draft storage failure/expiry uses console event path. | Structured analytics utility/provider and full event list remain. |
| Req 29 - Backend `updated_at` contract | Future | OPEN_DECISION | Frontend DTO includes `updated_at`; backend/staging contract not verified here. | Backend contract and conservative conflict fallback design. |
| Req 30 - Tenant-scoped storage | 13, 14 partial | PARTIALLY_IMPLEMENTED | Wizard draft storage is tenant/user scoped; Task 14 does not introduce mutation storage. | PendingMutationStore isolation and full logout integration remain. |
| Req 31 - Draft expiry | 13 partial | PARTIALLY_IMPLEMENTED | `DRAFT_EXPIRY_DAYS`, hydration expiry, and focused tests exist. | Remote-config override and structured analytics remain. |
| Req 32 - End-to-end release verification | 11, 12 | STAGING_ONLY | Release checklist and recovery checkpoint track staging gates. | Runs A-D and staging tenant/replay sign-off remain blocked by environment/access. |

#### Candidate Area Review

| Candidate Area | Readiness | Decision |
|---|---|---|
| App lifecycle draft/status sync | Requirements are explicit in Req 9; Task 14 completed current draft persistence; uses existing `AppState`, `hydrateWizardDraftFromStorage`, `syncWizardDraftToStorage`, and `refetch`. | SELECTED for Task Group 15. |
| OfflineBanner | Req 7 is explicit, but NetInfo is not declared and Req 8 would still be needed for CTA gating. | BLOCKED_BY_DEPENDENCY for now; better after lifecycle sync or an offline dependency/install group. |
| Pending mutation handling | Req 8 is broad and introduces a new store, retry/dead-letter logic, analytics, and tenant isolation obligations. | BLOCKED_BY_DEPENDENCY on OfflineBanner, analytics/error decisions, and architecture review. |
| Error recovery / centralised onboarding errors | Req 20 is valuable, but design does not yet identify the onboarding mapper boundary or exact integration pattern. | NEEDS_DESIGN_CLARIFICATION. |
| Analytics/audit events | Req 28 lacks an approved telemetry provider; existing analytics feature is reporting-oriented, not an event emitter. | NEEDS_DESIGN_CLARIFICATION. |
| Draft conflict modal | Depends on foreground resume behavior and Req 29 timestamp contract/fallback. | BLOCKED_BY_DEPENDENCY until Task 15 and Req 29 decision. |
| Journey Cards | Not represented by an accepted concrete requirement or design in the current canonical docs. | NEEDS_DESIGN_CLARIFICATION. |
| Journey Versioning | Preserved as a Task 13 follow-up, but no requirement/design group is accepted yet. | NEEDS_DESIGN_CLARIFICATION. |
| Capability-driven visibility | Ownership map identifies Capability ownership, but current tasks do not define an implementable capability visibility increment. | NEEDS_DESIGN_CLARIFICATION. |
| Workspace preparation | Ownership is Workspace, but no next implementable design slice is present in these docs. | NEEDS_DESIGN_CLARIFICATION. |
| Readiness providers | Backend/readiness ownership is not decomposed into a frontend-safe task group here. | NEEDS_DESIGN_CLARIFICATION. |
| Ready-to-Start experience | `GoLiveScreen` exists and uses server step status; remaining gaps overlap demo/live and completion lifecycle. | BLOCKED_BY_DEPENDENCY on trial/subscription policy decisions. |
| Trial lifecycle UX | `DemoStatusBanner` exists, but SetupWizardFlow wiring and commercial policy are incomplete. | NEEDS_DESIGN_CLARIFICATION before implementation. |
| Commercial trial conversion | Existing repository hooks exist, but subscription/commercial policy is not fully specified for the next slice. | NEEDS_DESIGN_CLARIFICATION. |
| Informational dunning | No accepted requirement/design currently defines dunning behavior. | NEEDS_DESIGN_CLARIFICATION. |
| Billing preparation / progressive financial setup | Billing and payment step screens exist; pending payment recovery and subscription verification remain underspecified. | NEEDS_DESIGN_CLARIFICATION. |
| Clinic identity refinements | Clinic profile screen exists and drafts are integrated; no accepted next refinements are specified. | NEEDS_DESIGN_CLARIFICATION. |
| Clinic contact improvements | Covered only by existing clinic profile behavior; no standalone accepted task is defined. | NEEDS_DESIGN_CLARIFICATION. |
| Backend `updated_at` contract | Frontend DTO has `updated_at`, but backend/staging guarantee is not verified. | BLOCKED_BY_DEPENDENCY for conflict-resolution work. |
| End-to-end release verification | Requires staging URL, credentials, safe tenants, and physical-device/network checks. | STAGING_ONLY, not an implementation group. |

- [x] 15. App Lifecycle Draft Sync and Foreground Status Refresh

  ## Objective

  Preserve in-progress onboarding work across app background/foreground transitions by flushing current draft state to persistent storage when the app backgrounds, hydrating drafts when the app returns active, refetching authoritative onboarding status, and showing a localized inline notice when the server-visible step list changed while the app was away.

  ## User Value

  A clinic admin can switch apps, answer a call, or briefly lose focus mid-form without losing local edits or unknowingly continuing from a stale step list after returning.

  ## Requirement Traceability

  - Requirement 9 AC-1 through AC-3.
  - Requirement 6 AC-5, because lifecycle hydration must reuse the existing draft hydration contract.
  - Requirement 10 AC-1, because background and hardware-back persistence should remain consistent.
  - Requirement 14 AC-2 and Requirement 21 AC-1 for theme-compliant inline notice styling.
  - Requirement 15 AC-3 and AC-4 for focused lifecycle tests.
  - Requirement 22 AC-4 and AC-5 for wizard-store subscription/use boundaries.
  - Requirement 23 AC-4 for presentation orchestration.
  - Requirement 24 AC-1, AC-2, AC-4 for any new user-visible copy.
  - Requirement 25 AC-4 for non-blocking notice accessibility where appropriate.

  ## Design Traceability

  - `design.md` deferred AppState lifecycle handling.
  - `design.md` dependency rules for presentation orchestration and store side effects.
  - `tasks.md` Task Group 13 store contract.
  - `tasks.md` Task Group 14 screen-level draft integration.

  ## Ownership

  - Owning layer: frontend onboarding presentation layer.
  - Collaborating module: existing onboarding wizard store at `frontend/features/onboarding/presentation/stores/wizard.store.ts`.
  - `SetupWizardFlow` may orchestrate lifecycle events, draft hydration/sync, and onboarding status refetch.
  - Backend status remains authoritative for step completion and readiness.
  - Must not create a new store, own readiness policy, own subscription policy, or introduce conflict-resolution behavior.

  ## Dependencies

  Implementation dependencies:

  - Recovery Checkpoint R0: complete.
  - Task Groups 1-10: complete.
  - Task 11.0 implementation and automated verification: complete.
  - Task Group 13: complete.
  - Task Group 14: complete.

  Staging dependencies:

  - None for implementation.
  - Existing Task 11.1 and 11.2 staging checks remain required before integration/promotion.

  Release dependencies:

  - Baseline frontend Jest/TypeScript debt remains a release/integration blocker.
  - Staging tenant/replay verification remains a production promotion blocker.

  ## Existing Components to Reuse

  - `frontend/features/onboarding/presentation/pages/SetupWizardFlow.tsx`
  - `frontend/features/onboarding/presentation/stores/wizard.store.ts`
  - `hydrateWizardDraftFromStorage()`
  - `syncWizardDraftToStorage()`
  - `useWizardStore`
  - `useOnboardingStatusQuery`
  - `frontend/tests/onboarding/SetupWizardFlow.test.tsx`
  - `frontend/tests/onboarding/wizard.store.test.ts`
  - `frontend/core/localization/translations/en-US.json`
  - `frontend/core/localization/translations/hi-IN.json`

  Backend files: not expected.

  ## Work Breakdown

  - [x] 15.1 Inventory lifecycle baseline
    - Confirm current `SetupWizardFlow` mount hydration, draft sync subscription, Android back sync, and status `refetch` behavior.
    - Record the active step-list comparison source (`visible_steps` or derived step code list).

  - [x] 15.2 Add AppState lifecycle orchestration in `SetupWizardFlow`
    - Register and clean up a React Native `AppState` listener while the wizard is mounted.
    - On transition to background/inactive, ensure current draft state has been pushed into the v1 draft store through Task 14 screen integration, then call `syncWizardDraftToStorage()`.
    - Do not submit any backend mutation from the lifecycle handler.

  - [x] 15.3 Hydrate and refetch on foreground resume
    - On transition to active, call `hydrateWizardDraftFromStorage()`.
    - Then call onboarding status `refetch()` when `tenantId` and authentication state are valid.
    - Preserve the existing focus-effect guard so logout/unauthenticated transitions do not fire authenticated requests.

  - [x] 15.4 Show updated-steps notice when server step list changes
    - Compare the step-code signature before backgrounding with the post-refetch `visible_steps` signature.
    - If the list changed, show a non-blocking localized inline notice that setup steps were updated.
    - Use `useClinicTheme()` values only.
    - Notice clears when the user changes steps, exits, or the wizard receives another unchanged active-state refetch.

  - [x] 15.5 Focused tests
    - Verify background transition calls `syncWizardDraftToStorage()`.
    - Verify active transition calls `hydrateWizardDraftFromStorage()` and then `refetch()`.
    - Verify no active refetch occurs when unauthenticated or tenant ID is absent.
    - Verify the updated-steps notice appears when `visible_steps` changes after foreground refetch.
    - Verify the notice does not appear when the step list is unchanged.

  - [x] 15.6 Documentation and stop gate
    - Update Task Group 15 evidence and verification commands in this file.
    - Run `git diff --check`, focused lifecycle tests, and TypeScript verification for touched files where applicable.
    - Commit and push only reviewed files.
    - Stop for architectural review before offline, pending mutation, or conflict-resolution work.

  ## Acceptance Criteria

  - Background/inactive app transitions persist current onboarding drafts through the existing wizard draft storage.
  - Foreground active transitions hydrate local drafts and refetch authoritative onboarding status in that order.
  - Lifecycle handlers do not submit step data, complete onboarding, transition demo/live status, or mutate subscription state.
  - A localized, theme-compliant inline notice appears only when the server-visible step list changed while the app was away.
  - Backend status remains the only completion/readiness truth.
  - Lifecycle listeners are removed on unmount.

  ## Localization

  - No hardcoded user-facing strings.
  - Add English and Hindi keys for the updated-steps notice.
  - Preserve interpolation parity if interpolation is introduced.

  ## Tests

  - Focused `SetupWizardFlow` lifecycle tests for background sync, foreground hydrate/refetch, unchanged step list, changed step list, and unauthenticated/tenant-missing guards.
  - Existing Task Group 13 and Task Group 14 draft tests remain in scope if touched.
  - TypeScript verification for touched files if available.

  ## Migration Fixtures

  Reuse the migration-fixture concepts for:

  - onboarding/provisional tenant with a tenant ID or safe fallback identity;
  - live tenant with tenant-scoped draft keys;
  - tenant switching without draft leakage;
  - Hindi localization key parity for the new notice.

  No database migration is authorized.

  ## Non-Goals

  - Offline banner.
  - NetInfo dependency installation.
  - Pending mutation queue.
  - Axios retry interceptor.
  - Draft conflict modal.
  - Multi-device conflict resolution.
  - Backend `updated_at` contract.
  - Analytics beyond existing console fallback paths.
  - Payment recovery.
  - Subscription/demo transition policy.
  - Journey Versioning or journey-aware draft keys.

  ## Stop Gate

  After implementation: focused verification, canonical docs update, commit, push, architectural review, and no automatic continuation.

  ## Completion Evidence

  - Added `AppState` lifecycle orchestration in `SetupWizardFlow`.
  - Background/inactive transitions record the current `visible_steps` signature and call `syncWizardDraftToStorage()` only when the existing wizard store is dirty.
  - Foreground active transitions call `hydrateWizardDraftFromStorage()` and then guarded onboarding status `refetch()` when tenant/auth state is valid.
  - Added a localized, theme-based inline notice for changed server-visible step lists after foreground refresh.
  - Kept backend onboarding status authoritative; lifecycle handlers do not submit step data, complete onboarding, transition demo/live state, mutate subscriptions, poll, or schedule background work.
  - Updated `syncWizardDraftToStorage()` to mark the existing wizard store clean after successful raw or compressed persistence.
  - Added English and Hindi `progressUpdatedNotice` localization keys.
  - Focused verification passed:
    - `git diff --check`
    - `npx jest tests/onboarding/SetupWizardFlow.test.tsx tests/onboarding/wizard.store.test.ts --runInBand`
  - TypeScript verification was executed with `npx tsc --noEmit --pretty false`; the command still reports existing baseline failures outside Task Group 15 touched files, including existing onboarding demo-status usecase DTO mismatches.

---

### Progressive Experience Planning Reconciliation - TG16

Outcome:

```text
TASK_GROUP_16_READY
```

TG16 selects offline connectivity visibility and submit gating because Task Groups 13-15 now preserve local drafts across editing, navigation, and app lifecycle transitions. The next smallest dependency-safe increment is to prevent users from submitting while the device is known offline and to make that state visible. Pending mutation persistence, retry/flush, and dead-letter handling remain broader follow-up work because they require a new queue store, network replay policy, structured analytics, and error-recovery decisions.

#### Refreshed Requirements Coverage Matrix

| Requirement | Current Task Group | Implementation Status | Implementation Evidence | Test Evidence | Design Section | Remaining Gap | Blocking Dependency |
|---|---|---|---|---|---|---|---|
| Req 1 - StepDetailScreen alias routing | 1, 2, 5 | COMPLETE | Shared aliases and redirect routing exist. | Focused alias tests. | 1.1, Property 5. | Active-template drift audit before release if backend templates change. | None. |
| Req 2 - SetupWizardFlow alias routing | 1, 3, 5 | COMPLETE | Shared aliases render Treatments redirect card. | `SetupWizardFlow` alias tests. | 1.2, Property 5. | None for current alias list. | None. |
| Req 3 - Delete unused Treatments screen | 4, 5 | COMPLETE | Dead screen remains absent. | Existing imports/tests do not require it. | 1.3. | None. | None. |
| Req 4 - Backend template alias audit | 1, 5 | PARTIALLY_IMPLEMENTED | Shared alias list records audited service aliases. | Alias tests cover known aliases. | 1.1, 1.2. | Re-run active-template audit before release. | Backend template inventory access. |
| Req 5 - WizardDraftStore schema/persistence | 13, 15 | COMPLETE | Versioned tenant/user-scoped draft store, migration, expiry, compression, clean-state marking. | `wizard.store.test.ts`. | Deferred data models, Req 22 rules. | Future Journey Versioning identity review only. | None for current schema. |
| Req 6 - WizardDraftStore step-screen integration | 14, 15 | COMPLETE | Required step screens save/restore/clear drafts; lifecycle uses existing store. | Task 14 focused tests plus TG15 lifecycle tests. | Deferred components, dependency rules. | No implementation gap. | Release verification. |
| Req 7 - OfflineBanner | 16 | COMPLETE | `OfflineBanner.tsx`, NetInfo dependency, and wizard wiring exist. | `SetupWizardFlow.test.tsx` covers offline and online banner states. | Deferred components, testing strategy. | Physical/emulated offline run remains release verification. | Req 32 Run D. |
| Req 8 - Offline CTA gating and mutation flush | 16 plus future | PARTIALLY_IMPLEMENTED | Known-offline submit/complete CTA gating exists; no PendingMutationStore, retry queue, or flush. Platform idempotency exists for replay once requests reach backend. | Offline CTA disable/re-enable and no-submit tests pass. | Deferred data flows, Core axios retry deferred. | Queue/flush/retry/dead-letter remain future. | Offline queue/error/analytics design. |
| Req 9 - App lifecycle background/foreground | 15 | COMPLETE | AppState background sync, foreground hydrate/refetch, changed-step notice. | `SetupWizardFlow` lifecycle tests. | Deferred data flows activated by TG15. | No polling or conflict-resolution expansion. | None. |
| Req 10 - Android back button intercept | 10, 14 | COMPLETE | Hardware back persists drafts and navigates previous/consumes first step. | `SetupWizardFlow` back tests. | Property 4. | None. | None. |
| Req 11 - Tenant identity fix | 11 | STAGING_ONLY | Code and automated checks verified; fallback remains. | Backend focused tests. | Backend dependencies for E2E. | Provisional/live/multi-clinic staging. | Staging access. |
| Req 12 - Idempotency keys | 6, 11 | PARTIALLY_IMPLEMENTED | Frontend keys and backend Platform Foundation idempotency implemented. | Backend idempotency tests pass in dev. | Backend dependencies for E2E. | Staging same-key replay and tenant replay checks. | Staging deployment/access. |
| Req 13 - Demo/live transition hooks | 17 | PARTIALLY_IMPLEMENTED | `DemoStatusBanner`, repository transition hook, demo-status query, and transition API exist. | `DemoStatusBanner.test.tsx`. | Query invalidation AC 27. | Wire banner actions into wizard, add pending/error states, and route Go Live to the checklist gate. | Task Group 17. |
| Req 14 - Theme compliance | Cross-cutting | PARTIALLY_IMPLEMENTED | Completed new UI uses `useClinicTheme()` where touched. | Focused tests for touched UI. | Theme Compliance. | Existing legacy hardcoded values remain. | Per-task review. |
| Req 15 - Test coverage | Cross-cutting | PARTIALLY_IMPLEMENTED | Focused tests exist for completed groups. | TG16 focused tests pass; baseline full suite debt remains. | Testing Strategy. | Conflict, payment, analytics, demo/live action wiring, and E2E coverage. | Future task implementation and baseline debt. |
| Req 16 - Draft conflict modal | Future | NOT_STARTED | No conflict modal. | None. | Deferred components, Req 29. | Compare local draft timestamps to server timestamps and resolve choice. | Req 29 backend contract and TG15 foreground flow. |
| Req 17 - Multi-device validation | Future | NOT_STARTED | Server refetch updates steps; no multi-device conflict flow. | None. | Deferred data flows. | Clear drafts on server-completed steps and integration test. | Req 29/conflict design. |
| Req 18 - Pending payment recovery | Future | NOT_STARTED | Subscription step and APIs exist, but no pending-verification API wrapper/banner. | None. | Backend dependencies, subscription flows. | Endpoint/scope decision and recovery UX. | Subscription/payment decision. |
| Req 19 - Storage security audit | 13 partial | PARTIALLY_IMPLEMENTED | Draft storage reviewed for current fields. | Draft tests. | Deferred security notes. | Project-level storage classification and SecureStore decision. | Security owner review. |
| Req 20 - Error message centralisation | Future | NOT_STARTED | Generic error helpers exist; onboarding catch paths still surface raw messages. | None. | Deferred Error Handling. | Define onboarding error mapper and localized keys. | Error-boundary design. |
| Req 21 - Zero hardcoded design values | Cross-cutting | PARTIALLY_IMPLEMENTED | Recent UI changes use theme tokens. | Focused UI tests. | Theme Compliance. | Legacy screens still need touch-scope cleanup. | Per-task review. |
| Req 22 - Zustand architecture | 13-15 | PARTIALLY_IMPLEMENTED | Wizard store follows synchronous actions plus standalone async helpers. | `wizard.store.test.ts`. | Dependency Rules. | Future stores, especially PendingMutationStore. | Future store design review. |
| Req 23 - Hook/service architecture | Cross-cutting | PARTIALLY_IMPLEMENTED | Repository hooks and datasource boundaries exist. | Focused repository/API tests. | Dependency Rules. | Legacy direct datasource calls in some screens remain. | Per-task review. |
| Req 24 - Internationalisation coverage | R0, 14-16 | PARTIALLY_IMPLEMENTED | English/Hindi Progressive Experience keys updated for touched UI, including offline copy. | Key parity checks from R0; focused UI text assertions. | Localization governance. | New TG17 strings need EN/HI keys and review. | Task Group 17. |
| Req 25 - Accessibility | Cross-cutting | PARTIALLY_IMPLEMENTED | Recent notices and disabled buttons include accessible state/roles where touched, including offline banner. | Focused UI tests. | Accessibility ACs. | DemoStatusBanner pending/disabled state and labels. | Task Group 17. |
| Req 26 - Duplicate submission locking | 6, 7, 9, 13-15 | PARTIALLY_IMPLEMENTED | Next submit lock and stale callback guard exist. | Rapid-tap and ordering tests. | Properties 1-3. | Demo/live pending button states remain. | Demo/live task. |
| Req 27 - Query invalidation | 8, 9, 13-15 | PARTIALLY_IMPLEMENTED | Submit/complete invalidation and foreground refetch exist. | Focused tests. | Query invalidation rules. | Demo extend/transition invalidation and session refresh remain. | Demo/live task. |
| Req 28 - Analytics/audit events | Future | PARTIALLY_IMPLEMENTED | Draft storage failure/expiry currently logs via console path. | Store tests cover behavior, not structured analytics. | Deferred analytics. | Analytics provider/stub and full event list. | Telemetry decision. |
| Req 29 - Backend `updated_at` contract | Future | OPEN_DECISION | Frontend DTO includes `updated_at`; backend/staging guarantee not verified here. | None. | 1.4 deferred DTO, backend dependencies. | Backend contract and conservative fallback. | Backend contract decision. |
| Req 30 - Tenant-scoped storage | 13-15 partial | PARTIALLY_IMPLEMENTED | Wizard drafts are tenant/user scoped and cleaned on logout. | Draft isolation tests. | Recovery tenant checklist. | PendingMutationStore isolation not implemented. | Future pending mutation design. |
| Req 31 - Draft expiry | 13 partial | PARTIALLY_IMPLEMENTED | Expiry constant and hydration discard exist. | `wizard.store.test.ts`. | Deferred data models. | Remote-config override and structured analytics. | Remote config/analytics decision. |
| Req 32 - End-to-end release verification | 11, 12 | STAGING_ONLY | Release checklist tracks runs A-D and staging gates. | Not executed. | E2E Manual Verification. | Runs A-D plus tenant/replay sign-off. | Staging/device access. |

#### Candidate Area Review

| Candidate | Requirements | Design Ready? | Dependencies Ready? | Existing Assets | Main Risk | Decision |
|---|---|---|---|---|---|---|
| Offline connectivity banner and submit gating | Req 7, Req 8 AC1-2 partial, Req 14, Req 15 AC1-2, Req 24, Req 25 AC1/AC4, Req 26 | Yes for banner/gating only. | Complete. Draft recovery, lifecycle sync, submit locks, and backend idempotency are complete. | `OfflineBanner`, `SetupWizardFlow`, theme/i18n, `SetupWizardFlow.test.tsx`. | Scope creep into queue/flush/retry. | DEFERRED |
| Pending mutation persistence | Req 8 AC6-11, Req 30 | Partial. | No. Requires queue ownership, tenant cleanup, dead-letter UX. | Wizard store pattern, platform idempotency. | Frontend queue becoming domain truth. | BLOCKED_BY_DEPENDENCY |
| Offline retry/flush | Req 8 AC2-5, AC8-11 | No. | No. Needs PendingMutationStore, retry policy, error mapper, analytics. | Platform idempotency protects replay after request reaches backend. | Hidden background sync/offline engine. | NEEDS_DESIGN_CLARIFICATION |
| Axios retry recovery | Req 8 AC3-4, Req 28 | No. | No. Cross-feature axios behavior requires platform/network decision. | `axiosClient`. | Retrying unsafe operations globally. | NEEDS_DESIGN_CLARIFICATION |
| Centralized onboarding errors | Req 20, Req 24 | Partial. | No. Needs mapper boundary and string catalog. | `core/utils/errorHandler.ts`, `useApiErrorHandler`. | Inconsistent mapping across screens. | NEEDS_DESIGN_CLARIFICATION |
| Draft conflict handling | Req 16, Req 17, Req 29 | Partial. | No. TG15 is complete, but backend timestamp contract remains open. | Wizard drafts, foreground refetch, `updated_at` DTO field. | Incorrect overwrite/conflict decisions. | BLOCKED_BY_DEPENDENCY |
| Journey Versioning | Req 5 follow-up, ownership docs | No. | No. | Draft schema version note. | Confusing draft schema with journey version. | NEEDS_DESIGN_CLARIFICATION |
| Journey Cards | Uncovered accepted requirement | No. | No. | None verified. | Inventing architecture outside docs. | NEEDS_DESIGN_CLARIFICATION |
| Capability-driven visibility | Ownership map | No. | No. | Capability ownership guidance only. | Frontend owning capability truth. | NEEDS_DESIGN_CLARIFICATION |
| Readiness providers | Readiness ownership | No. | No. | Server readiness status. | Frontend owning readiness policy. | NEEDS_DESIGN_CLARIFICATION |
| Workspace preparation | Workspace ownership | No. | No. | Existing external management routes. | Crossing workspace lifecycle boundary. | NEEDS_DESIGN_CLARIFICATION |
| Ready-to-Start UX | Req 13, Req 18, Req 26, Req 27 | Partial for DemoStatusBanner wiring only. | Yes for routing Go Live to the existing checklist gate; no for subscription/payment recovery. | `DemoStatusBanner`, `GoLiveScreen`, complete mutation. | Accidentally bypassing readiness/subscription policy. | READY |
| Commercial trial start / subscription conversion | Req 13, Req 18, Req 27 | Partial for banner action wiring only. | Yes for Req 13 action wiring; no for payment recovery/subscription conversion. | `DemoStatusBanner`, transition hook, demo-status query, subscription step. | Expanding into commercial policy. | READY |
| Informational dunning | Uncovered accepted requirement | No. | No. | None verified. | Inventing billing policy. | NEEDS_DESIGN_CLARIFICATION |
| Progressive branding | Uncovered accepted requirement | No. | No. | Existing localized copy. | Cosmetic scope without accepted criteria. | NEEDS_DESIGN_CLARIFICATION |
| Progressive financial configuration | Req 18, billing/payment steps | Partial. | No. | Billing/payment step screens. | Payment/security decisions. | NEEDS_DESIGN_CLARIFICATION |
| Bring Your Clinic | Ownership map only | No. | No. | Choice/application flows exist. | Undefined scope. | NEEDS_DESIGN_CLARIFICATION |
| Clinic Contact Details refinement | Existing clinic profile | No. | No. | `ClinicProfileScreen`. | No accepted next behavior. | NEEDS_DESIGN_CLARIFICATION |
| Analytics/observability | Req 28 | No. | No. | Console event paths. | Provider/stub decision. | NEEDS_DESIGN_CLARIFICATION |
| Backend `updated_at` contract | Req 29 | Partial. | No. | Frontend DTO field. | Backend/staging guarantee missing. | BLOCKED_BY_DEPENDENCY |
| Staging tenant/replay verification | Req 11, Req 12, Req 32 | Yes as checklist. | No environment. | Recovery checkpoint. | Claiming unexecuted staging success. | STAGING_ONLY |

#### Offline Sequencing Decision

Offline behavior is now the correct next area only for a bounded visibility/gating increment. Req 7 mandates an offline banner, and Req 8 AC1 requires disabling submit CTAs while offline. The design does not yet define network-state ownership for a durable mutation queue, and no `PendingMutationStore` exists. Backend platform idempotency makes replay safer once a request reaches the server, but it does not by itself define local offline queue semantics. TG16 must therefore stop at network-state detection, banner visibility, and submit/complete gating; mutation queueing, retry flush, and dead-letter UX remain future work.

#### Task Group 16 - Offline Connectivity Banner and Submit Gating

- [x] 16. Offline Connectivity Banner and Submit Gating

  ## Objective

  Make offline state visible in the onboarding wizard and prevent known-offline submit actions from dispatching backend mutations.

  ## User Value

  A clinic admin on an unreliable connection can see why onboarding cannot submit right now, keep editing safely through existing draft persistence, and avoid failed or misleading submit attempts while offline.

  ## Requirement Traceability

  - Requirement 7 AC1-6.
  - Requirement 8 AC1 and the online re-enable portion of AC2.
  - Requirement 14 AC1-2.
  - Requirement 15 AC1-2.
  - Requirement 24 AC1-4.
  - Requirement 25 AC1 and AC4.
  - Requirement 26 AC1 and AC4 for preserving submit disabled/loading behavior.

  ## Design Traceability

  - `design.md` Deferred Components: `OfflineBanner.tsx`.
  - `design.md` Layer Map: presentation components own UI state, repositories own server mutations.
  - `design.md` Dependency Rules: presentation may orchestrate hooks/components; no direct API calls.
  - `design.md` Theme Compliance.
  - `design.md` Testing Strategy: offline banner and CTA disabled coverage.

  ## Ownership

  - Owning layer: frontend onboarding presentation.
  - Collaborators: React Native NetInfo, `SetupWizardFlow`, existing submit/complete pending-state logic, localization, theme.
  - Owns: network-state display, offline CTA disabled state, and accessible user feedback.
  - Must not own: mutation execution, server completion truth, readiness, subscription policy, retry scheduling, background sync, or queued mutation replay.

  ## Dependencies

  Implementation dependencies:

  - Recovery Checkpoint R0 complete.
  - Task Groups 13-15 complete.
  - Platform idempotency implemented in backend dev branch.
  - Existing draft persistence and lifecycle sync protect local edits while offline.

  Staging dependencies:

  - None for implementation.
  - Physical/emulated offline validation remains part of release verification.

  Release dependencies:

  - Task 11 staging tenant/replay checks remain open.
  - Baseline frontend Jest/TypeScript debt remains an integration blocker.
  - Req 32 Run D remains required before production promotion.

  ## Existing Assets to Reuse

  - `frontend/features/onboarding/presentation/pages/SetupWizardFlow.tsx`
  - `frontend/features/onboarding/presentation/components/RestoredDraftIndicator.tsx` as a local theme/i18n/accessibility pattern.
  - `frontend/tests/onboarding/SetupWizardFlow.test.tsx`
  - `frontend/core/localization/translations/en-US.json`
  - `frontend/core/localization/translations/hi-IN.json`
  - Existing `isNextPending`, `isHandlingNext`, `submitMutation.isPending`, and `accessibilityState` patterns.

  Backend files: not expected.

  ## Work Breakdown

  - [x] 16.1 Confirm NetInfo dependency approach
    - Add `@react-native-community/netinfo` using the repository package manager only if it remains absent.
    - Do not add a custom network service or global offline engine.
    - Completion evidence: repository had no existing NetInfo dependency or onboarding connectivity abstraction; `@react-native-community/netinfo` was added with Yarn only.

  - [x] 16.2 Add `OfflineBanner`
    - Create `frontend/features/onboarding/presentation/components/OfflineBanner.tsx`.
    - Use NetInfo connectivity state.
    - Render nothing when online or unknown.
    - Render a non-blocking themed alert when offline.
    - Completion evidence: `OfflineBanner` renders a localized, themed alert only when `isOffline` is true.

  - [x] 16.3 Wire offline state into `SetupWizardFlow`
    - Render `OfflineBanner` near existing wizard notices.
    - Disable `Next`, `Previous` only if needed to preserve submit safety, and `Ready to Start`/complete actions that would dispatch backend mutations while offline.
    - Preserve existing pending-state spinner and stale-submission guards.
    - Do not enqueue or replay mutations.
    - Completion evidence: `SetupWizardFlow` gates backend mutation CTAs when NetInfo reports known offline, preserves editing/navigation, and does not add queue/retry/replay behavior.

  - [x] 16.4 Localize and preserve accessibility
    - Add English and Hindi keys for banner copy and any offline-disabled label if needed.
    - Set banner `accessibilityRole="alert"` and `accessibilityLiveRegion="polite"`.
    - Ensure disabled CTAs set `accessibilityState={{ disabled: true }}`.
    - Completion evidence: English and Hindi offline keys were added; banner and disabled CTA accessibility states are covered in focused tests.

  - [x] 16.5 Focused tests
    - Mock NetInfo online/offline states.
    - Verify banner renders offline and not online.
    - Verify `Next`/submit CTA is disabled offline and enabled online.
    - Verify pressing disabled submit does not call mutation.
    - Verify pending submit behavior still disables and shows spinner.
    - Completion evidence: `npx jest tests/onboarding/SetupWizardFlow.test.tsx tests/onboarding/wizard.store.test.ts --runInBand --silent` passed with 2 suites and 37 tests.

  - [x] 16.6 Documentation and stop gate
    - Update this task with completion evidence.
    - Run `git diff --check`, focused onboarding tests, and TypeScript verification for touched files if practical.
    - Commit, push, and stop for architectural review before Task Group 17.
    - Completion evidence: `git diff --check` passed. `npx tsc --noEmit --pretty false` was executed; it remains blocked by baseline TypeScript errors outside Task Group 16 touched files, with no errors reported for `OfflineBanner`, `SetupWizardFlow`, localization files, or package metadata.

  ## Acceptance Criteria

  - Offline state displays a localized, non-blocking `OfflineBanner`.
  - Online or unknown network state does not render the banner.
  - Known-offline state disables submit/complete CTAs that would dispatch backend mutations.
  - Existing draft editing, draft persistence, lifecycle sync, and status display continue to work while offline.
  - No pending mutation queue, retry scheduler, background service, polling, or backend endpoint is introduced.
  - No hardcoded user-facing text is added.
  - New UI uses `useClinicTheme()` tokens only.

  ## Likely Files

  - `frontend/package.json`
  - `frontend/yarn.lock`
  - `frontend/features/onboarding/presentation/components/OfflineBanner.tsx`
  - `frontend/features/onboarding/presentation/pages/SetupWizardFlow.tsx`
  - `frontend/tests/onboarding/SetupWizardFlow.test.tsx`
  - `frontend/core/localization/translations/en-US.json`
  - `frontend/core/localization/translations/hi-IN.json`

  Backend files: not expected.

  ## Tests

  - Offline banner visible when NetInfo reports disconnected.
  - Offline banner hidden when NetInfo reports connected.
  - `Next`/submit CTA disabled while offline.
  - Offline submit press does not dispatch `useSubmitStepMutation`.
  - Online submit behavior remains unchanged.
  - Existing Task Groups 13-15 focused tests remain in scope if touched.

  ## Localization

  - Add English and Hindi keys for offline banner copy.
  - No hardcoded user-visible strings.
  - Preserve key parity and interpolation parity.

  ## Migration Fixtures

  - Demo/provisional tenant with draft edits while offline.
  - Live tenant with draft edits while offline.
  - Tenant switching must not affect existing draft storage behavior.
  - No database migration.

  ## Non-Goals

  - PendingMutationStore.
  - Offline mutation queue.
  - Retry flush.
  - Axios retry interceptor.
  - Dead-letter handling.
  - Analytics events.
  - Draft conflict modal.
  - Backend `updated_at` contract.
  - Journey Versioning.
  - Payment recovery.
  - Subscription/demo policy changes.
  - Background sync, polling, timers, push notifications, or websocket refresh.

  ## Preserved Follow-Ups

  - Draft schema version is not Journey Version.
  - Future Journey Versioning must review draft identity.
  - Foreground refresh must not evolve into polling.
  - Lifecycle listeners must remain singular and scoped.
  - Drafts must never become completion truth.

  ## Stop Gate

  After implementation: focused verification, canonical docs update, commit, push, architectural review, and no automatic continuation to Task Group 17.

---

### Progressive Experience Planning Reconciliation - TG17

Outcome:

```text
TASK_GROUP_17_READY
```

Task Group 17 selects DemoStatusBanner action wiring because it is the next visible customer-value increment with verified local assets and no new backend ownership. It uses the existing banner, demo-status query, transition API, repository hook pattern, theme, localization, and wizard orchestration. It intentionally stops at wiring the banner actions and preserving the existing go-live checklist gate; it does not implement subscription conversion, payment recovery, readiness policy, pending mutation queues, analytics, or backend contract changes.

#### TG17 Candidate Area Review

| Candidate | Requirements | Design Ready | Dependencies Ready | Existing Assets | User Value | Decision |
|---|---|---|---|---|---|---|
| PendingMutationStore | Req 8 AC6-11, Req 30 | Partial | No | Wizard store pattern, platform idempotency | Saves offline submit intent across app restarts. | BLOCKED_BY_DEPENDENCY |
| Offline mutation queue | Req 8 AC2-5, AC8-11 | No | No | NetInfo banner/gating, platform idempotency | Allows later submission after reconnection. | NEEDS_DESIGN_CLARIFICATION |
| Retry/replay | Req 8 AC3-4, Req 28 | No | No | `axiosClient`, platform idempotency | Recovers transient failures. | NEEDS_DESIGN_CLARIFICATION |
| Centralized onboarding error handling | Req 20, Req 24 | Partial | No | `core/utils/errorHandler.ts`, `useApiErrorHandler` | Consistent user-facing error copy. | NEEDS_DESIGN_CLARIFICATION |
| Conflict resolution | Req 16, Req 17, Req 29 | Partial | No | Wizard drafts, foreground refetch, `updated_at` DTO field | Prevents stale local draft overwrite. | BLOCKED_BY_DEPENDENCY |
| Journey Cards | Accepted scope only | No | No | UNKNOWN | Richer onboarding guidance. | NEEDS_DESIGN_CLARIFICATION |
| Journey Versioning | Req 5 follow-up, ownership docs | No | No | Draft schema version note | Safer future journey migrations. | NEEDS_DESIGN_CLARIFICATION |
| Capability-driven visibility | Ownership map | No | No | Capability ownership guidance | More relevant setup steps. | NEEDS_DESIGN_CLARIFICATION |
| Readiness providers | Ownership map, Req 17 | No | No | Server readiness status | Clearer readiness truth. | NEEDS_DESIGN_CLARIFICATION |
| Workspace preparation | Ownership map | No | No | External management routes | Helps clinics prepare operating workspace. | NEEDS_DESIGN_CLARIFICATION |
| Ready-to-Start dashboard | Req 13, Req 26, Req 27 | Partial | Yes for banner-to-checklist routing only | `DemoStatusBanner`, `SetupWizardFlow`, `GoLiveScreen` | Turns dead banner action into guided next step. | READY |
| Commercial trial UX | Req 13, Req 27 | Partial | Yes for banner actions only | `DemoStatusBanner`, demo query, transition API | Lets demo users intentionally continue setup. | READY |
| Trial expiry UX | Req 13, Req 18 | Partial | No | `DemoStatusBanner` expired state | Clarifies blocked/expired state. | NEEDS_DESIGN_CLARIFICATION |
| Subscription conversion | Req 18, Req 27 | Partial | No | Subscription payment step and API wrappers | Enables commercial conversion. | NEEDS_DESIGN_CLARIFICATION |
| Informational dunning | Accepted scope only | No | No | UNKNOWN | Communicates payment risk. | NEEDS_DESIGN_CLARIFICATION |
| Progressive branding | Accepted scope only | No | No | Existing localized copy | Improves perceived product fit. | DEFERRED |
| Clinic identity refinement | Ownership map | No | No | `ClinicProfileScreen` | Better clinic setup accuracy. | NEEDS_DESIGN_CLARIFICATION |
| Clinic contact refinement | Ownership map | No | No | `ClinicProfileScreen` | Better contact completeness. | NEEDS_DESIGN_CLARIFICATION |
| Financial configuration | Req 18, billing/payment steps | Partial | No | Billing/payment step screens | Completes commercial setup. | NEEDS_DESIGN_CLARIFICATION |
| Bring Your Clinic | Ownership map | No | No | `ChoiceScreen`, application flows | Supports migration-style onboarding. | NEEDS_DESIGN_CLARIFICATION |
| Analytics | Req 28 | No | No | Console event paths | Improves support diagnostics. | NEEDS_DESIGN_CLARIFICATION |
| Backend `updated_at` contract | Req 29 | Partial | No | Frontend DTO field | Enables accurate draft conflict checks. | BLOCKED_BY_DEPENDENCY |
| Remaining staging tenant/replay verification | Req 11, Req 12, Req 32 | Yes | No environment | Recovery checkpoint checklist | Protects release promotion. | STAGING_ONLY |

#### Task Group 17 - DemoStatusBanner Action Wiring and Go-Live Checklist Routing

- [x] 17. DemoStatusBanner Action Wiring and Go-Live Checklist Routing

  ## Objective

  Wire the legacy compatibility banner actions into `SetupWizardFlow` so users can continue setup or move intentionally to the existing Ready-to-Start checklist gate without bypassing readiness, subscription, or backend ownership.

  ## User Value

  A clinic admin sees actionable banner controls instead of dead UI. "Ready to Start" guides them to the checklist step, and "Continue Setup" returns them to the backend-recommended preparation step.

  ## Requirement Traceability

  - Requirement 13 AC1-6.
  - Requirement 14 AC3-4 for touched banner/wizard styling.
  - Requirement 15 AC6 for preserving existing wizard tests.
  - Requirement 24 AC1-4 for new user-visible strings.
  - Requirement 25 AC3 for touched CTA accessibility.
  - Requirement 26 AC3-4 for pending transition button state.
  - Requirement 27 AC3-4 for demo/live query invalidation and session refresh planning.

  ## Design Traceability

  - `design.md` Layer Map: repository hooks own React Query mutations; presentation orchestrates.
  - `design.md` Dependency Rules: presentation must not call datasources directly; repositories must not import Zustand directly.
  - `design.md` Query Invalidation Rules.
  - `design.md` Theme Compliance.
  - `design.md` Backend Dependencies for E2E Validation.

  ## Ownership

  Frontend responsibilities:

  - use existing repository query data to determine whether the compatibility banner can render;
  - wire `DemoStatusBanner` props from `SetupWizardFlow`;
  - route "Ready to Start" to the existing `go_live_checklist` step instead of directly transitioning the tenant;
  - route "Continue Setup" to the backend-recommended step when available;
  - keep touched CTA accessibility states accurate.

  Backend responsibilities:

  - preserve existing demo-status and transition endpoint contracts;
  - no backend code is expected for this task group.

  Must not own:

  - subscription conversion;
  - payment recovery;
  - commercial pricing or plan policy;
  - readiness eligibility computation;
  - workspace lifecycle;
  - offline mutation queueing;
  - analytics provider implementation;
  - backend idempotency or tenant-resolution redesign.

  ## Dependencies

  Implementation dependencies:

  - Recovery Checkpoint R0 complete.
  - Task Groups 13-16 complete.
  - Existing `DemoStatusBanner` component.
  - Existing `useDemoStatusQuery`.
  - Existing `go_live_checklist` step handling in `SetupWizardFlow`.

  Staging dependencies:

  - None for implementation.
  - Staging demo/live endpoint verification remains required before integration or production promotion.

  Release dependencies:

  - Task 11 staging tenant/replay checks remain open.
  - Production promotion remains `NO-GO`.
  - Baseline frontend Jest/TypeScript debt remains an integration blocker.
  - Req 32 E2E runs must include the demo banner path before release.

  ## Existing Components to Reuse

  - `frontend/features/onboarding/presentation/components/DemoStatusBanner.tsx`
  - `frontend/features/onboarding/presentation/pages/SetupWizardFlow.tsx`
  - `frontend/features/onboarding/presentation/pages/steps/GoLiveScreen.tsx`
  - `frontend/features/onboarding/data/repositories/onboarding.repository.impl.ts`
  - `frontend/features/onboarding/data/datasources/onboarding.api.ts`
  - `frontend/features/onboarding/data/models/onboarding.dtos.ts`
  - `frontend/tests/onboarding/DemoStatusBanner.test.tsx`
  - `frontend/tests/onboarding/SetupWizardFlow.test.tsx`
  - `frontend/tests/onboarding/onboarding.repository.test.tsx`
  - `frontend/core/localization/translations/en-US.json`
  - `frontend/core/localization/translations/hi-IN.json`

  Backend files: not expected.

  ## Work Breakdown

  - [x] 17.1 Audit current demo/live flow
    - Confirm how `SetupWizardFlow` identifies PROVISIONAL/demo tenants from current status/auth data.
    - Confirm whether `go_live_checklist` exists in `visible_steps`; if not, document fallback behavior before implementation.
    - Do not infer commercial policy from UI labels.
    - Completion evidence: no reliable frontend lifecycle flag exists beyond existing auth/onboarding status and demo-status data. The banner renders only when the existing demo-status query returns data. Ready-to-Start navigation is disabled unless backend-provided `go_live_checklist` is present and actionable.

  - [x] 17.2 Preserve repository boundaries
    - Do not add a banner-owned mutation because TG17 banner actions are presentation-only and must not activate tenant, workspace, subscription, or commercial trial state.
    - Use `useDemoStatusQuery` for compatibility banner data.
    - Do not call `transitionDemoToLiveApi` from `SetupWizardFlow`.
    - Completion evidence: no repository or datasource changes were made; banner actions only update the current wizard step index.

  - [x] 17.3 Wire `DemoStatusBanner` in `SetupWizardFlow`
    - Render the banner only when existing demo-status data is available.
    - Wire `onExtendDemo` compatibility prop to route to the backend-recommended preparation step.
    - Wire `onTransitionToLive` to navigate to the existing `go_live_checklist` step.
    - Preserve offline gating and existing submit/complete pending behavior.
    - Completion evidence: `SetupWizardFlow` renders the legacy compatibility banner from `useDemoStatusQuery`, routes Continue Setup to `next_recommended_step`, and routes Ready to Start to `go_live_checklist` only when backend status marks it actionable.

  - [x] 17.4 Pending, localization, and accessibility
    - Disable touched banner CTAs while their mutation/navigation action is pending.
    - Add localized English and Hindi user-facing copy.
    - Use `useClinicTheme()` for all new visual states.
    - Add accessibility state/labels for disabled banner CTAs.
    - Completion evidence: banner labels now use Ready-to-Start terminology, disable state is exposed through `accessibilityState`, and English/Hindi strings avoid user-facing Demo and Go Live lifecycle terms.

  - [x] 17.5 Focused tests
    - Repository boundary regression coverage confirms no direct activation mutation is dispatched from banner actions.
    - `SetupWizardFlow` tests for banner rendering in demo context.
    - `SetupWizardFlow` tests that Ready to Start routes to `go_live_checklist` without calling transition API.
    - `DemoStatusBanner` tests for disabled/pending CTA states if the component API changes.
    - Completion evidence: `npx jest tests/onboarding/DemoStatusBanner.test.tsx tests/onboarding/SetupWizardFlow.test.tsx tests/onboarding/onboarding.repository.test.tsx --runInBand --silent --forceExit` reported 3 passed suites and 42 passed tests. `--forceExit` is still required because of existing Jest open-handle debt.

  - [x] 17.6 Documentation and stop gate
    - Update this task with completion evidence.
    - Run `git diff --check`, focused onboarding tests, and TypeScript verification for touched files if practical.
    - Commit, push, and stop for architectural review before Task Group 18.
    - Completion evidence: `git diff --check` passed. `npx tsc --noEmit --pretty false` was executed and still reports existing baseline failures outside TG17 touched files.

  ## Acceptance Criteria

  - Compatibility wizard sessions render `DemoStatusBanner` when demo status data is available.
  - "Continue Setup" routes only within the existing wizard step list.
  - "Ready to Start" navigates to `go_live_checklist` and does not directly transition or complete the tenant.
  - Pending banner actions disable the relevant CTA and expose `accessibilityState={{ disabled: true }}`.
  - User-facing banner copy is localized and does not expose Demo or Go Live lifecycle terms.
  - No direct datasource calls are added to presentation.
  - No backend files are modified.

  ## Likely Files

  - `frontend/features/onboarding/presentation/components/DemoStatusBanner.tsx`
  - `frontend/features/onboarding/presentation/pages/SetupWizardFlow.tsx`
  - `frontend/tests/onboarding/DemoStatusBanner.test.tsx`
  - `frontend/tests/onboarding/SetupWizardFlow.test.tsx`
  - `frontend/core/localization/translations/en-US.json`
  - `frontend/core/localization/translations/hi-IN.json`

  Backend files: not expected.

  Unknown paths:

  ```text
  UNKNOWN
  ```

  No additional paths are authorized until implementation inspection confirms them.

  ## Tests

  - Banner renders only when compatibility demo-status data is available.
  - Continue Setup routes to the backend-recommended step.
  - Ready-to-start action navigates to `go_live_checklist`.
  - Ready-to-start action does not dispatch a submit/transition mutation.
  - Ready-to-start action is disabled when backend status marks the checklist not actionable.
  - Existing offline gating tests still pass.

  ## Localization

  - Update English and Hindi banner values to Progressive Experience terminology.
  - No hardcoded user-visible strings.
  - Preserve key parity and interpolation parity.

  ## Migration Fixtures

  - Demo/provisional tenant with active sample access.
  - Demo/provisional tenant with expired sample access but active commercial trial.
  - Demo/provisional tenant where `go_live_checklist` exists in `visible_steps`.
  - Demo/provisional tenant where `go_live_checklist` is absent; implementation must not invent a step.
  - No database migration.

  ## Non-Goals

  - Subscription checkout implementation.
  - Pending payment recovery.
  - Pricing, dunning, or commercial policy.
  - Direct tenant transition from the banner.
  - Workspace lifecycle changes.
  - Readiness provider changes.
  - Offline queue/retry/replay.
  - Centralized onboarding error mapper.
  - Analytics provider or event emission.
  - Backend API changes.
  - Doctor Module work.

  ## Stop Gate

  After implementation: focused verification, canonical docs update, commit, push, architectural review, and no automatic continuation to Task Group 18.

---


### Post-Dev-Sync Reconciliation - 2026-07-20

Outcome:

```text
NO_IMPLEMENTATION_GROUP_READY
```

The frontend and backend `feature/progressive-experience-recovery` worktrees were synchronized with latest `origin/dev` before this reconciliation. Frontend HEAD is `516dc8feb780460481310295b20920e38977ee15`; backend HEAD is `14522967f8a063b53b7f29c0b2b8e9cbc750b573`. Both worktrees are clean, both remain on `feature/progressive-experience-recovery`, and `git merge-base --is-ancestor origin/dev HEAD` returned `0` in both repositories.

Task Group 17 remains complete after the dev merge. The next incomplete areas are either staging-only release checks or implementation areas with unresolved design, ownership, backend contract, telemetry, payment, or environment dependencies. No Task Group 18 is authorized from the current canonical evidence.

#### Task Group 17 Evidence Audit

| Task 17 Acceptance Item | Code Evidence | Test Evidence | Status |
|---|---|---|---|
| Compatibility wizard sessions render `DemoStatusBanner` when demo status data is available. | `SetupWizardFlow.tsx` calls `useDemoStatusQuery(tenantId, { enabled: !!tenantId && currentUser?.applicationStatus === \"onboarding\" })` and renders `DemoStatusBanner` only when `demoStatusData` exists. | `SetupWizardFlow.test.tsx` covers banner rendering with mocked demo status data; focused TG17 run reported 3 passed suites and 42 passed tests. | VERIFIED_COMPLETE |
| "Continue Setup" routes only within the existing wizard step list. | `handleContinueSetupFromBanner` first uses `statusData.next_recommended_step` through `navigateToStep`, then falls back to an existing non-completed/non-blocked step. `navigateToStep` returns false for unknown step codes. | `SetupWizardFlow.test.tsx` verifies Continue Setup routes to the backend-recommended `operating_hours` step and does not dispatch a mutation. | VERIFIED_COMPLETE |
| "Ready to Start" navigates to `go_live_checklist` and does not directly transition or complete the tenant. | `handleReadyToStartFromBanner` only calls `navigateToStep(\"go_live_checklist\")` when `canOpenReadyToStartChecklist` is true. No banner-owned transition mutation or tenant completion call is added. | `SetupWizardFlow.test.tsx` verifies Ready to Start opens the existing checklist and `mockMutateAsync` is not called. | VERIFIED_COMPLETE |
| Ready-to-start is disabled when backend readiness is unavailable. | `canOpenReadyToStartChecklist` requires the visible `go_live_checklist` step and `per_step_validation.go_live_checklist.actionable === true`; `DemoStatusBanner` receives `isTransitionDisabled={isNextPending || !canOpenReadyToStartChecklist}`. | `SetupWizardFlow.test.tsx` and `DemoStatusBanner.test.tsx` assert disabled accessibility state and no navigation/callback when disabled. | VERIFIED_COMPLETE |
| Pending/disabled banner actions expose accessible disabled state. | `DemoStatusBanner.tsx` sets `accessibilityState={{ disabled: ... }}` for Continue Setup and Ready to Start actions and shows pending indicators through the existing props. | `DemoStatusBanner.test.tsx` covers disabled Ready to Start behavior; SetupWizardFlow tests cover the wizard-disabled Ready-to-Start path. | VERIFIED_COMPLETE |
| User-facing banner copy is localized and avoids legacy Demo or Go Live lifecycle terms. | `en-US.json` and `hi-IN.json` contain Progressive Experience status-banner keys including Continue Setup and Ready to Start. | `DemoStatusBanner.test.tsx` and `SetupWizardFlow.test.tsx` assert legacy `Demo` and `Go Live` wording is not exposed in the tested banner flow. | VERIFIED_COMPLETE |
| No backend files or Doctor Module files were modified for TG17. | TG17 implementation evidence is limited to onboarding presentation, tests, and localization files. The post-sync backend merge preserved platform and clinical exports without attributing Doctor Module work to Progressive Experience. | `git status` is clean in both PE worktrees after sync; focused frontend and backend verification passed before this reconciliation. | VERIFIED_COMPLETE |

#### Post-Sync Requirements Coverage Matrix

| Requirement | Status | Evidence | Remaining Gap |
|---|---|---|---|
| Req 1 - StepDetailScreen alias routing | COMPLETE | Shared alias routing evidence remains in completed groups 1, 2, and 5. | Re-audit only if backend templates change before release. |
| Req 2 - SetupWizardFlow alias routing | COMPLETE | SetupWizardFlow service-catalogue aliases continue to use the shared alias list. | None for current alias inventory. |
| Req 3 - Delete unused Treatments screen | COMPLETE | Dead onboarding Treatments screen remains absent from active imports. | None. |
| Req 4 - Backend template alias audit | PARTIALLY_IMPLEMENTED | Current alias list is documented and tested. | Active-template audit remains release validation if backend templates change. |
| Req 5 - WizardDraftStore schema/persistence | COMPLETE | Task Groups 13 and 15 completed tenant/user-scoped draft persistence, migration, expiry, compression, and clean-state behavior. | Future Journey Versioning identity review only. |
| Req 6 - WizardDraftStore step-screen integration | COMPLETE | Task Group 14 integrated required wizard step screens; Task Group 15 covered lifecycle sync. | Release verification only. |
| Req 7 - OfflineBanner | COMPLETE | Task Group 16 added NetInfo-backed offline banner wiring. | Physical/emulated offline release run remains under Req 32. |
| Req 8 - Offline CTA gating and mutation flush | PARTIALLY_IMPLEMENTED | Task Group 16 gates known-offline submit/complete CTAs; backend platform idempotency supports safe server replay after requests reach backend. | PendingMutationStore, retry/flush, and dead-letter behavior need queue/error/analytics design. |
| Req 9 - App lifecycle background/foreground | COMPLETE | Task Group 15 added AppState background sync, foreground hydrate, refetch, and changed-step notice. | No polling/conflict expansion authorized. |
| Req 10 - Android back button intercept | COMPLETE | Completed production-hardening groups preserve Android back handling. | None. |
| Req 11 - Tenant identity fix | STAGING_ONLY | Automated checks and fallback behavior are complete. | Provisional/live/multi-clinic staging confirmation required. |
| Req 12 - Idempotency keys | PARTIALLY_IMPLEMENTED | Frontend idempotency keys and backend Platform Foundation idempotency tests passed in dev. | Same-key replay and tenant replay staging checks remain. |
| Req 13 - Demo/live transition hooks | COMPLETE | Task Group 17 wired DemoStatusBanner actions into SetupWizardFlow while preserving the checklist gate. | Subscription conversion, payment recovery, and direct transition remain explicit non-goals. |
| Req 14 - Theme compliance | PARTIALLY_IMPLEMENTED | Touched Progressive Experience UI uses `useClinicTheme()` tokens. | Legacy untouched UI remains per-task cleanup only. |
| Req 15 - Test coverage | PARTIALLY_IMPLEMENTED | Focused onboarding tests cover completed groups, including TG17. | Full frontend TypeScript/Jest baseline debt and E2E coverage remain. |
| Req 16 - Draft conflict modal | NOT_STARTED | No conflict modal is implemented. | Requires backend `updated_at` contract and conflict design. |
| Req 17 - Multi-device validation | NOT_STARTED | Foreground refetch exists, but no multi-device conflict flow is authorized. | Requires Req 29 and conflict-resolution policy. |
| Req 18 - Pending payment recovery | NOT_STARTED | Subscription/payment screens and APIs exist outside a recovery policy. | Needs subscription/payment ownership and UX decision. |
| Req 19 - Storage security audit | PARTIALLY_IMPLEMENTED | Current draft fields were reviewed during Task Group 13. | Project-level storage classification and SecureStore decision remain. |
| Req 20 - Error message centralisation | NOT_STARTED | Existing generic error utilities are not an onboarding mapper. | Needs mapper boundary, localized key catalog, and tests. |
| Req 21 - Zero hardcoded design values | PARTIALLY_IMPLEMENTED | Recent touched UI follows theme tokens. | Legacy untouched screens remain per-task cleanup. |
| Req 22 - Zustand architecture | PARTIALLY_IMPLEMENTED | Wizard store follows synchronous Zustand actions plus standalone async helpers. | Future stores, especially PendingMutationStore, need design review. |
| Req 23 - Hook/service architecture | PARTIALLY_IMPLEMENTED | Repository hooks and datasource boundaries exist for completed flows. | Legacy direct datasource calls remain outside current authorization. |
| Req 24 - Internationalisation coverage | PARTIALLY_IMPLEMENTED | TG17 added/verified English and Hindi user-facing banner terminology. | Future task strings need parity review. |
| Req 25 - Accessibility | PARTIALLY_IMPLEMENTED | TG16/TG17 touched notices and disabled CTAs expose accessible state/roles. | Broader legacy accessibility audit remains outside current task groups. |
| Req 26 - Duplicate submission locking | PARTIALLY_IMPLEMENTED | Submit lock, stale submission guard, offline gating, and TG17 banner-disabled states exist. | Future commercial/payment recovery pending states need their own task. |
| Req 27 - Query invalidation | PARTIALLY_IMPLEMENTED | Submit/complete invalidation, foreground refetch, and TG17 presentation-only routing exist. | Demo extend/transition mutation invalidation remains out of TG17 scope. |
| Req 28 - Analytics/audit events | PARTIALLY_IMPLEMENTED | Draft storage failure/expiry logging path exists. | Structured analytics provider/stub and event catalog remain undecided. |
| Req 29 - Backend `updated_at` contract | OPEN_DECISION | Frontend DTO field exists. | Backend guarantee and staging proof are not established. |
| Req 30 - Tenant-scoped storage | PARTIALLY_IMPLEMENTED | Wizard drafts are tenant/user scoped and cleaned on logout. | PendingMutationStore isolation not implemented. |
| Req 31 - Draft expiry | PARTIALLY_IMPLEMENTED | Draft expiry constant and hydration discard exist. | Remote-config override and structured analytics remain undecided. |
| Req 32 - End-to-end release verification | STAGING_ONLY | Release checklist remains documented. | Runs A-D and tenant/replay sign-off require staging/device access. |

#### Next Implementation Decision

| Candidate Next Area | Requirement Support | Design/Ownership Support | Dependency Check | Result |
|---|---|---|---|---|
| Pending mutation persistence / offline queue | Req 8, Req 30 | Partial only | Needs queue ownership, retry policy, dead-letter UX, error mapper, and analytics decision. | NO_IMPLEMENTATION_GROUP_READY |
| Draft conflict and multi-device handling | Req 16, Req 17, Req 29 | Partial only | Blocked by backend `updated_at` contract and conflict-resolution policy. | NO_IMPLEMENTATION_GROUP_READY |
| Pending payment recovery / commercial conversion | Req 18, Req 27 | Not enough | Needs subscription/payment ownership, endpoint scope, and commercial UX policy. | NO_IMPLEMENTATION_GROUP_READY |
| Centralized onboarding error messages | Req 20, Req 24 | Partial only | Needs mapper boundary, string catalog, and ownership confirmation. | NO_IMPLEMENTATION_GROUP_READY |
| Analytics / audit events | Req 28 | Not enough | Needs provider/stub decision and accepted event list. | NO_IMPLEMENTATION_GROUP_READY |
| Staging tenant and replay verification | Req 11, Req 12, Req 32 | Checklist ready | Environment/device dependent; not an implementation group. | STAGING_ONLY |

Selected result: `NO_IMPLEMENTATION_GROUP_READY`.

Dependency confirmation:

- Requirement support: the remaining gaps are traceable, but none has enough accepted design plus dependency readiness for implementation.
- Design support: no new frontend/backend task group should be created until the relevant queue, conflict, payment, error, or analytics boundary is clarified.
- Ownership: onboarding remains Codex-owned; Doctor Module, clinical readiness, workspace lifecycle, billing policy, and capability truth remain outside this implementation authorization.
- Frontend/backend impact: no code changes are authorized by this reconciliation.
- Staging dependencies: Req 11, Req 12, and Req 32 remain staging-only and must not be marked complete from local tests.
- Release dependencies: production promotion remains blocked by staging runs, baseline frontend TypeScript/Jest debt, and release sign-off.


## Task Group 18 — Journey Foundation and Card Presentation (COMPLETE)

Status: **COMPLETE** (2026-07-20)

TG18 implemented only the approved E1 foundation and reusable Journey Card
presentation slices. It introduced the versioned, tenant-scoped journey domain;
pure DTO-to-domain and domain-to-presentation projection; reuse of the existing
onboarding status repository/query, navigation, `StepCard`, `ProgressBar`, theme,
and localization framework; and safe presentation for supported, unsupported,
and recognized-empty journeys.

Completion evidence:

- the backend remained unchanged; no API, migration, repository, store, service,
  dependency, or draft-schema implementation was created;
- unsupported major versions fail closed with localized unavailable messaging,
  no partial cards, and no actionable wizard footer;
- recognized empty journeys present an explicit localized non-completion state;
- active journeys preserve authoritative card order and expose localized
  aggregate `completed / total` progress with progressbar semantics;
- tenant mismatch suppresses stale raw status and journey projection;
- English and Hindi keys have compatible interpolation placeholders;
- central theme tokens, existing icon/navigation systems, accessible roles and
  labels, and specialty-agnostic multi-clinic behavior are preserved;
- focused journey entity, projection, hook, Journey Card, progress, journey
  surface, and wizard integration verification passes (7 suites, 77 tests).

TG18 does not authorize TG19, Doctor Module, Clinical Workspace, scheduling,
inventory, billing/payment implementation, analytics-platform implementation,
backend redesign, or architecture rewrites. TG19 requires its own readiness
review before any implementation.

## Notes

### TG19 Final Acceptance — NOT ACCEPTED (2026-07-21)

- Backend Platform Foundation, Clinic Entry, verification, audit, capability,
  idempotency, transaction, and PostgreSQL evidence: verified (159 tests).
- Clinic Entry choice presentation, English/Hindi parity, central Theme, and
  focused accessibility semantics: verified (8 tests).
- Required frontend Clinic Entry orchestration: not implemented.
- ADR-PF-017/018 runtime strategy resolution: implemented as resolvers but not
  consumed by an operational composition path.
- Controlling evidence: `TG19-FINAL-ACCEPTANCE.md`.
- Decision: `TG19_NOT_ACCEPTED`; TG20 remains unauthorized.

- Tasks marked with `*` are optional and can be skipped for a faster MVP; all core implementation tasks are mandatory.
- Tasks 11.1 and 11.2 are verification/validation tasks — they require manual confirmation on staging and recording results. No automated test can substitute for the staging environment check.
- All UI changes must use `useClinicTheme()` exclusively — zero hardcoded colours, spacing, font sizes, or border radii (except `flex`, `zIndex`, `minHeight: 44`, `minWidth: 44`, animation timing).
- The `submissionId` guard (task 6.2) and the `Idempotency-Key` (task 11.2) are complementary layers: `submissionId` prevents frontend double-dispatch; `Idempotency-Key` prevents backend duplicate records if a network retry reaches the server.
- WizardDraftStore was excluded from the earlier production-hardening checkpoint. It is now complete through Task Groups 13-15. OfflineBanner visibility/gating is complete through Task Group 16. Other deferred items remain out of scope until a later canonical task group authorizes them: PendingMutationStore, Axios retry interceptor, conflict resolution modal, analytics beyond the approved draft-storage event path, i18n additions beyond user-visible strings introduced by an authorized task, accessibility enhancements beyond touched controls, and payment recovery.

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
    { "id": 6, "tasks": ["10.4", "11.1", "11.2"] },
    { "id": 7, "tasks": ["13"] },
    { "id": 8, "tasks": ["14"] },
    { "id": 9, "tasks": ["15"] },
    { "id": 10, "tasks": ["16"] },
    { "id": 11, "tasks": ["17"] },
    { "id": 12, "tasks": ["18"] }
  ],
  "notes": [
    "11.2 depends on 6.3: backend idempotency verification requires the Idempotency-Key header implementation (6.3) to be complete and deployed to staging before the staging verification in 11.2 can be executed.",
    "13 depends on Recovery Checkpoint R0, completed production-hardening implementation groups 1 through 10, Task 11.0 automated verification, Requirements 5/22/23/30, and the deferred design sections now activated for Progressive Experience Phase 1.",
    "14 depends on Task Group 13's v1 draft store and activates Requirement 6 step-screen integration. Task 11 staging checks remain release blockers only and do not block Task 14 implementation.",
    "15 depends on Task Group 14's active step-screen draft integration and activates Requirement 9 app lifecycle sync. Task 11 staging checks remain release blockers only and do not block Task 15 implementation.",
    "16 depends on Task Group 15's lifecycle-safe draft recovery and activates the bounded Req 7 plus Req 8 AC1 offline visibility/gating increment. Pending mutation queue, retry flush, and dead-letter handling require future design and are not part of Task Group 16.",
    "17 depends on Task Group 16 and activates the bounded Req 13 DemoStatusBanner action-wiring increment. Subscription conversion, payment recovery, readiness policy, and direct tenant transition remain out of scope.",
    "18 depends on the approved Phase 2 roadmap, TG18 readiness review, and accepted E1 requirements, domain design, journey versioning, Journey Card contract, and reuse audit. It implements only Journey Foundation and Card Presentation; TG19 requires a separate readiness review."
  ]
}
```
