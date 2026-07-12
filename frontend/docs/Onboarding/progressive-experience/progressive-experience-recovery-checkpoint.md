# Progressive Experience Recovery Checkpoint

Execution date: 2026-07-12

## 1. Purpose

This checkpoint must close before further Progressive Experience implementation. It converts the ignored Kiro spec work into version-controlled governance, corrects unverified conclusions, and defines the gates required before any new onboarding behavior work begins.

## 2. Current Baseline

Frontend recovery worktree:

```text
/Users/ayurparishkar/Projects/NovaClinics/novaclinicspro_rn-progressive-recovery
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

## 2.1 Worktree Ownership

| Agent | Repository | Worktree | Branch | Purpose |
|---|---|---|---|---|
| Codex | Frontend | `/Users/ayurparishkar/Projects/NovaClinics/novaclinicspro_rn-progressive-recovery` | `feature/progressive-experience-recovery` | Onboarding recovery |
| Codex | Backend | `/Users/ayurparishkar/Projects/NovaClinics/novaclinicspro-api-progressive-recovery` | `feature/progressive-experience-recovery` | Onboarding recovery |

No other agent worktree was modified. Doctor Module work remains out of scope.

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
| R3 - Backend Onboarding Idempotency Verification | BLOCKED | `platform-idempotency-assessment.md` confirms no reusable platform request-idempotency capability exists today. `app/api/v1/routers/onboarding_router.py` step endpoint accepts `tenant_id`, `step_code`, request body, user context, and service, but no `Request` or `Header` dependency for `Idempotency-Key`. `app/application/services/onboarding_service.py::submit_step` receives no idempotency key and always proceeds to handlers plus `_mark_step_completed`. | Backend onboarding step idempotency is not implemented for the required retry/cache/locking semantics. | Recommended owner: `PLATFORM_FOUNDATION`; onboarding should consume the reusable contract once available. |
| R4 - Tenant Resolution Verification | PARTIAL | Frontend sends `X-Tenant-ID` fallback in onboarding status and step submit APIs. Backend `/auth/me` response includes `tenant_id` when present. Backend route authorization resolves membership from the path `tenant_id`; onboarding service also checks user tenant against route tenant. | Staging verification is still required for provisional onboarding tenants, active tenants, tenant switching, multi-clinic users, `X-Tenant-ID` disagreement behavior, and cross-tenant rejection. | Backend/frontend owners: run staging checklist below. |
| R5 - Hindi Localization Completion Decision | BLOCKED | Comparison of `onboarding.progressiveExperience` in `en-US.json` and `hi-IN.json` shows every audited key is an `ENGLISH_PLACEHOLDER`. | Hindi localization remains incomplete. | Product/localization owner: formally complete Hindi translations in Progressive Experience Phase 1 readiness, or defer with named owner and acceptance date. Current R0 decision: formally defer, not complete. |
| R6 - Focused Verification | BLOCKED | `git diff --check` passed for frontend and backend. Frontend `node_modules` is missing; `npm test -- --runInBand` failed with `jest: command not found`; `npm run typecheck` failed because no `typecheck` script exists. Backend has `pyproject.toml`, `requirements.txt`, and `alembic.ini`, but no local `venv`; `./venv/bin/alembic heads`, `./venv/bin/alembic current`, and `./venv/bin/pytest -q` failed because those binaries do not exist. | Local verification toolchain is incomplete/unavailable in the clean worktrees. | Environment owner: install/use project dependencies and Python tooling, then rerun verification. |

## 5. Backend Idempotency Evidence

Conclusion:

```text
IMPLEMENTATION_REQUIRED
```

| Concern | Evidence | Status |
|---|---|---|
| Header read | `submit_step_data` in `app/api/v1/routers/onboarding_router.py` does not accept a `Request`, `Header`, or `idempotency_key` parameter. | FAIL |
| Scope | No onboarding idempotency key is read, so no tenant/user/action/payload scope can be applied. Tenant access check exists separately in `OnboardingService.submit_step`. | FAIL |
| Duplicate prevention | `OnboardingService.submit_step` runs handlers and `_mark_step_completed` without key lookup or duplicate suppression. | FAIL |
| Same-response retry | No persistence/cache of the first response was found for onboarding step submission. | FAIL |
| Concurrent duplicate handling | No lock/unique constraint path for onboarding step idempotency was found. | FAIL |
| Tests | Search found no backend onboarding idempotency tests for `Idempotency-Key`. | FAIL |

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
| Backend | `./venv/bin/alembic heads` | Failed: `./venv/bin/alembic` does not exist. | ENVIRONMENT_FAILURE |
| Backend | `./venv/bin/alembic current` | Failed: `./venv/bin/alembic` does not exist. | ENVIRONMENT_FAILURE |
| Backend | `./venv/bin/pytest -q` | Failed: `./venv/bin/pytest` does not exist. | ENVIRONMENT_FAILURE |

No product test result is claimed as passing except `git diff --check`.

## 9. Go / No-Go Decision

```text
Recovery Checkpoint: NO-GO
```

The checkpoint remains NO-GO because R3, R5, and R6 are blocked.

## 10. Minimum Remaining Actions For GO

1. Implement backend onboarding idempotency or provide verified existing implementation evidence.
2. Verify tenant resolution in staging using the checklist above.
3. Complete Hindi Progressive Experience translations or formally defer with a named owner and approved release gate.
4. Install/use the correct frontend/backend toolchains and rerun all focused verification commands successfully.
5. Update this checkpoint to PASS for all mandatory gates before starting Progressive Experience Phase 1.

## 11. Next Authorized Work

Progressive Experience Phase 1 is not authorized.

No Doctor Module changes are authorized.
