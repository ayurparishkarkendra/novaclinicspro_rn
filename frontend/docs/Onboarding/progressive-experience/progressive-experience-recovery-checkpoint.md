# Progressive Experience Recovery Checkpoint

Execution date: 2026-07-12

## 1. Purpose

This checkpoint must close before further Progressive Experience implementation. It converts the ignored Kiro spec work into version-controlled governance, corrects unverified conclusions, and defines the gates required before any new onboarding behavior work begins.

## 2. Current Baseline

Frontend recovery worktree:

```text
/Users/ayurparishkar/Projects/NovaClinics/novaclinicspro_rn-progressive-recovery-codex
```

Frontend branch:

```text
feature/progressive-experience-recovery
```

Frontend `origin/dev` base:

```text
45c13b04 Merge branch 'test' into dev
```

Backend recovery worktree:

```text
/Users/ayurparishkar/Projects/NovaClinics/novaclinicspro-api-progressive-recovery
```

Backend branch:

```text
feature/progressive-experience-recovery
```

Backend `origin/dev` base:

```text
9dba7d1 Implement R4 treatment state ownership backend
```

Backend recovery branch current pushed head:

```text
a2a818b Integrate onboarding submission with platform idempotency
```

## 2.1 Worktree Ownership

| Agent | Repository | Worktree | Branch | Purpose |
|---|---|---|---|---|
| Codex | Frontend | `/Users/ayurparishkar/Projects/NovaClinics/novaclinicspro_rn-progressive-recovery-codex` | `feature/progressive-experience-recovery` | Onboarding recovery documentation |
| Codex | Backend | `/Users/ayurparishkar/Projects/NovaClinics/novaclinicspro-api-progressive-recovery` | `feature/progressive-experience-recovery` | Onboarding recovery |

The previous frontend recovery folder at `/Users/ayurparishkar/Projects/NovaClinics/novaclinicspro_rn-progressive-recovery` is now on `merge-progressive-phase0-into-test` at `e8fb29aa` and is treated as owned by another workflow. It was not switched or modified. No other agent worktree was modified. Doctor Module work remains out of scope.

## 3. Branch Decision

- Stale frontend `origin/feature/progressive-experience-phase-1` must not be reused.
- Clean paired frontend/backend recovery branches were created from latest `origin/dev`.
- Both recovery branches were pushed to origin.
- New implementation work must continue to use the same paired branch name:

```text
feature/progressive-experience-recovery
```

Do not merge into `test` or `dev` during R0.

## 4. Recovery Gate Results

| Gate | Status | Evidence | Unresolved Blocker | Owner / Next Action |
|---|---|---|---|---|
| R1 - Canonical Specs in Git | PASS | `git check-ignore -v frontend/docs/Onboarding/progressive-experience/requirements.md` reports the narrow `.gitignore` unignore rule. `git ls-files frontend/docs/Onboarding/progressive-experience` lists the nine canonical docs. `.kiro` remains ignored via `.gitignore:240:.kiro/`. Documentation commit `4cc02477` was pushed to `origin/feature/progressive-experience-recovery`. | None. | Keep canonical docs in `frontend/docs/Onboarding/progressive-experience/`; treat `.kiro` as a workspace mirror only. |
| R2 - Clean Paired Branches | PASS | Frontend branch `feature/progressive-experience-recovery` created from `45c13b04` and pushed. Backend branch `feature/progressive-experience-recovery` created from `9dba7d1` and pushed. Backend worktree is clean. Frontend worktree contains only reviewed docs and `.gitignore` changes for R0. | None for branch creation. | Codex/user: keep branch pair clean; do not reuse `origin/feature/progressive-experience-phase-1`. |
| R3 - Backend Onboarding Idempotency Verification | PASS_IN_DEV | Backend commits `c5082fb`, `f145dbf`, and `a2a818b` implement Platform Foundation request idempotency, migration `20260712_000001`, onboarding step submission integration, and focused tests. Focused tests: `12 passed`; full backend suite: `316 passed`; `git diff --check` passed; `alembic heads` reports `20260712_000001 (head)`. | `alembic current` was not verified because local database `novaclinics_test` does not exist; staging retry verification still required after deployment. | Backend/platform owner: verify migration/current against a configured database and run staging same-key replay checks. |
| R4 - Tenant Resolution Verification | PARTIAL | Frontend sends `X-Tenant-ID` fallback in onboarding status and step submit APIs. Backend `/auth/me` response includes `tenant_id` when present. Backend route authorization resolves membership from the path `tenant_id`; onboarding service also checks user tenant against route tenant. | Staging verification is still required for provisional onboarding tenants, active tenants, tenant switching, multi-clinic users, `X-Tenant-ID` disagreement behavior, and cross-tenant rejection. | Backend/frontend owners: run staging checklist below. |
| R5 - Hindi Localization Completion Decision | FORMALLY_DEFERRED | Comparison of `onboarding.progressiveExperience` in `en-US.json` and `hi-IN.json` shows every audited key is an `ENGLISH_PLACEHOLDER`. | Hindi localization remains incomplete and must be completed or explicitly accepted again before user-facing Hindi launch. | Product/localization owner: complete Hindi translations in Progressive Experience Phase 1 readiness, or maintain a named deferral owner and acceptance date. |
| R6 - Focused Verification | PARTIAL | Backend verification now passes in `.venv-idempotency`: focused tests `12 passed`, full tests `316 passed`, `git diff --check` passed, `alembic heads` passed. Frontend `node_modules` remains missing from prior audit; frontend tests were not restored in this task. | `alembic current` blocked by missing local database `novaclinics_test`; frontend dependencies/tests still not restored. | Environment owner: verify Alembic current against a configured database and restore frontend dependency/test tooling. |

## 5. Backend Idempotency Evidence

Conclusion after backend recovery implementation:

```text
VERIFIED_IN_DEV
```

| Concern | Evidence | Status |
|---|---|---|
| Header read | `submit_step_data` accepts optional `Idempotency-Key` via FastAPI `Header`. Missing key preserves legacy behavior; present empty key returns platform validation error. | PASS_IN_DEV |
| Scope | Platform scope includes route tenant, authenticated actor, onboarding step operation, and idempotency key. Request fingerprint includes tenant, step code, and request body. | PASS_IN_DEV |
| Duplicate prevention | `PlatformIdempotencyService` atomically claims a scoped key through `platform_idempotency_records` unique scope/key storage. | PASS_IN_DEV |
| Same-response retry | Completed same-key/same-payload requests replay the stored response body. | PASS_IN_DEV |
| Concurrent duplicate handling | Concurrent same-scope/same-key in-progress requests receive conflict and do not execute duplicate domain side effects in focused tests. | PASS_IN_DEV |
| Tests | `tests/test_platform_idempotency_service.py` and `tests/test_onboarding_idempotency_integration.py` cover first request, replay, conflict, concurrency, tenant/actor/operation/step isolation, retryable failure, missing-key compatibility, and cross-tenant rejection. | PASS_IN_DEV |

Recommended owner:

```text
PLATFORM_FOUNDATION
```

Rationale: the backend contains request correlation, CORS header allowance, event outbox retry infrastructure, notification event uniqueness, and domain-specific idempotency patterns, but no reusable processed-request store or request-level idempotency middleware/service. Onboarding should consume a reusable platform contract rather than creating a permanent onboarding-only mechanism.

## 6. Tenant Resolution Evidence

| Concern | Evidence | Status |
|---|---|---|
| `/auth/me` | `CurrentUserResponse` includes `tenant_id`; handler returns `user.tenant_id` and tenant status/name when present. | VERIFIED_IN_CODE |
| Current tenant/session resolution | Frontend auth entity maps `/auth/me` `tenant_id` to `tenantId`; auth hooks refresh session after demo/sample clinic creation to pick up tenant metadata. | VERIFIED_IN_CODE |
| Onboarding/provisional tenant behavior | Frontend has explicit `X-Tenant-ID` workaround and warning for missing JWT `tenant_id`; backend JWT dependency still requires tenant ID unless org-admin bypass applies. | REQUIRES_STAGING |
| Live tenant behavior | Code supports tenant ID in JWT and route tenant IDs. | REQUIRES_STAGING |
| `X-Tenant-ID` compatibility | Frontend sends header, but backend onboarding route does not directly read it in the route signature inspected. Compatibility requires staging/API verification. | GAP |
| Tenant switching | Auth store has selected clinic/effective tenant logic, but R0 did not verify end-to-end tenant switching. | REQUIRES_STAGING |
| Cross-tenant submission safety | `OnboardingService.submit_step` rejects non-org-admin users when `user_context.tenant_id != tenant_id`. | VERIFIED_IN_CODE |
| Multi-tenant ownership | Frontend auth maps `owned_clinics`, but selected/effective tenant switching was not executed end-to-end. | UNKNOWN |

### Staging Checklist

1. Provisional onboarding tenant: create/sign in, verify `/auth/me` has expected `tenant_id` or documented fallback behavior.
2. Active tenant: verify `/auth/me` returns active tenant and onboarding/dashboard routes use it.
3. Multi-tenant user: verify selected/effective tenant does not leak prior tenant onboarding status.
4. Tenant switch: switch tenants and verify onboarding/status/query cache isolation.
5. Onboarding step retry: submit same step twice with same `Idempotency-Key` after backend implementation, verify one side effect and same response.
6. Cross-tenant rejection: authenticated Tenant A user attempts Tenant B onboarding route/header, verify rejection unless org-admin.
7. Expired or invalid tenant membership: deactivate membership, refresh token/session, verify onboarding route rejection.
8. `X-Tenant-ID` disagreement: send URL Tenant A with header Tenant B and verify backend behavior is explicit and documented.

## 7. Hindi Localization Evidence

Outcome:

```text
FORMALLY_DEFERRED
```

Reason: every audited `onboarding.progressiveExperience` key in `hi-IN.json` currently equals the English value. This checkpoint does not implement product localization; it records the blocker.

Owner: Product/localization owner.

Target phase: Progressive Experience Phase 1 readiness gate, before any user-facing Hindi launch.

Acceptance criteria:

- every `onboarding.progressiveExperience` key in `hi-IN.json` is translated into Hindi;
- interpolation variables such as `{{completed}}`, `{{total}}`, and `{{durationDays}}` are preserved;
- JSON validation passes;
- localization tests or a key-diff script reports no `ENGLISH_PLACEHOLDER` values for Progressive Experience.

Sample comparison evidence:

| Key | English | Current Hindi | Status |
|---|---|---|---|
| `routes.prepareClinic` | Prepare Your Clinic | Prepare Your Clinic | ENGLISH_PLACEHOLDER |
| `dashboard.finishPreparingClinic` | Finish Preparing Your Clinic | Finish Preparing Your Clinic | ENGLISH_PLACEHOLDER |
| `choice.sampleClinicReadyTitle` | Sample Clinic Ready | Sample Clinic Ready | ENGLISH_PLACEHOLDER |
| `choice.prepareMyClinic` | Prepare My Clinic | Prepare My Clinic | ENGLISH_PLACEHOLDER |
| `statusBanner.commercialTrial` | Commercial Trial | Commercial Trial | ENGLISH_PLACEHOLDER |
| `flow.subscriptionDescription` | Review subscription options. Your commercial trial starts after your clinic is Ready to Start. | Review subscription options. Your commercial trial starts after your clinic is Ready to Start. | ENGLISH_PLACEHOLDER |
| `stepLabels.readyToStart` | Ready to Start | Ready to Start | ENGLISH_PLACEHOLDER |
| `readyToStart.confirmAccuracy` | I confirm that all information is accurate and I am ready to start accepting patients | I confirm that all information is accurate and I am ready to start accepting patients | ENGLISH_PLACEHOLDER |

Full script result: every audited `onboarding.progressiveExperience` leaf key returned `ENGLISH_PLACEHOLDER`.

## 8. Verification Results

| Area | Command | Result | Classification |
|---|---|---|---|
| Frontend | `git diff --check` | Passed with no output. | PASS |
| Frontend | `npm test -- --runInBand` | Failed: `jest: command not found`. | ENVIRONMENT_FAILURE |
| Frontend | `npm run typecheck` | Failed: package has no `typecheck` script; npm log write to the home npm cache also failed. | ENVIRONMENT_FAILURE |
| Backend | `git diff --check` | Passed with no output. | PASS |
| Backend | `.venv-idempotency/bin/pytest -q tests/test_platform_idempotency_service.py tests/test_onboarding_idempotency_integration.py` | `12 passed`. | PASS |
| Backend | `.venv-idempotency/bin/pytest -q` | `316 passed`. | PASS |
| Backend | `.venv-idempotency/bin/alembic heads` | `20260712_000001 (head)`. | PASS |
| Backend | `.venv-idempotency/bin/alembic current` | Failed because local database `novaclinics_test` does not exist; no database was created or altered. | ENVIRONMENT_BLOCKER |

Backend product verification now claims the focused and full pytest results above. Frontend product tests are still not claimed as passing.

## 8.1 Backend Recovery Commits

| Commit | Message | Scope |
|---|---|---|
| `c5082fb` | `Define reusable request idempotency architecture` | Backend ADR for platform ownership and replay contract. |
| `f145dbf` | `Implement platform request idempotency foundation` | Platform service, SQLAlchemy model/repository/dependency, migration `20260712_000001`, Alembic model metadata. |
| `a2a818b` | `Integrate onboarding submission with platform idempotency` | Onboarding step submission consumer and focused idempotency/onboarding tests. |

## 9. Go / No-Go Decision

```text
Recovery Checkpoint: NO-GO
```

The checkpoint remains NO-GO because mandatory recovery validation is not fully closed: `alembic current` has not been verified against a configured database, tenant-resolution/staging replay checks have not run, frontend dependency/test tooling is still unavailable, and Hindi localization remains formally deferred rather than complete.

## 10. Minimum Remaining Actions For GO

1. Verify `alembic current` against a configured local or staging database without touching unknown shared data.
2. Verify tenant resolution and onboarding same-key replay in staging using the checklist above.
3. Restore frontend dependencies/tests and rerun focused frontend verification.
4. Complete Hindi Progressive Experience translations or maintain a named, approved deferral before any user-facing Hindi launch.
5. Update this checkpoint to PASS for all mandatory gates before starting Progressive Experience Phase 1.

## 11. Next Authorized Work

Progressive Experience Phase 1 is not authorized.

No Doctor Module changes are authorized.
